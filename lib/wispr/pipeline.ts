/**
 * Wispr Voice Pipeline v2 — Multi-turn + Hermes bio integration
 */

import { processVoiceTurn, generateProactivePrompt } from '@/lib/wispr/conversation';
import { getWisprAdaptations, wisprAdaptationsToRecommendations } from '@/lib/wispr/voice-layer';
import { detectIntentFromRegistry } from '@/lib/wispr/intent-detector';
import { applyFitnessProofing, MEDICAL_DISCLAIMER } from '@/lib/bio/fitness-proofing';
import { bioSupervisor } from '@/lib/bio/supervisor';
import { buildMotionOSDocument } from '@/lib/bio/document';
import { createBioContext } from '@/lib/bio/engine';
import { recordVoiceContext } from '@/lib/hermes/memory';
import type { AgentTier } from '@/types/agent';
import type { VoiceAdaptationRequest } from '@/types/bio';
import type { MotionOSBioDocument } from '@/types/motionos';
import type { WisprIntentResult } from '@/types/wispr';

export interface WisprPipelineResult {
  document: MotionOSBioDocument;
  intentResult: WisprIntentResult;
  spokenFeedback: string;
  intent: string;
  confidence: number;
  awaitingClarification: boolean;
  visualUpdates: string[];
}

export interface WisprTurnRequest extends VoiceAdaptationRequest {
  tier?: AgentTier;
  mode?: 'client' | 'coach';
}

export async function processWisprVoice(
  request: WisprTurnRequest,
  tier: AgentTier = 'pro'
): Promise<WisprPipelineResult> {
  const effectiveTier = request.tier ?? tier;

  const ctx = createBioContext(request.clientId, {
    tier: effectiveTier,
    trigger: 'voice_command',
    sessionId: request.sessionId,
    voiceInput: request.transcript,
  });

  const pipeline = await bioSupervisor.runPipeline({ voiceRequest: request }, ctx);
  const twin = pipeline.context.twin;

  const recoveryScore = twin.unifiedScores.find((s) => s.key === 'recovery_score')?.value;
  const loadScore = twin.unifiedScores.find((s) => s.key === 'load_score')?.value;

  const intentResult = processVoiceTurn({
    clientId: request.clientId,
    sessionId: request.sessionId,
    utterance: request.transcript,
    mode: request.mode,
    bioContext: {
      recovery_score: recoveryScore,
      load_score: loadScore,
      hrv: twin.recovery.hrvCurrent ?? undefined,
      hrv_baseline: twin.recovery.hrvBaseline ?? undefined,
      sleep_debt: twin.recovery.sleepDebtHours,
      body_comp_delta: twin.unifiedScores.find((s) => s.key === 'body_comp_delta')?.value,
      trend: twin.trends.hrv?.direction ?? 'stable',
    },
  });

  let adaptations = pipeline.context.adaptations;

  if (!intentResult.awaiting_clarification) {
    const legacyIntent = mapToLegacyIntent(intentResult.intent_id);
    const spec = getWisprAdaptations(legacyIntent);
    if (spec) {
      adaptations = [...wisprAdaptationsToRecommendations(spec, request.transcript), ...adaptations];
    }
  }

  const proofing = applyFitnessProofing(adaptations, twin, {
    trigger: 'voice_intent',
    voiceIntent: mapToLegacyIntent(intentResult.intent_id),
  });

  recordVoiceContext(request.clientId, request.transcript, intentResult.intent_id);

  const document = buildMotionOSDocument(
    { ...pipeline.context, adaptations: proofing.approved },
    {
      correlationId: pipeline.trace.correlationId,
      voiceLayer: {
        session_id: request.sessionId,
        transcript: request.transcript,
        detected_intent: mapToLegacyIntent(intentResult.intent_id),
        confidence: intentResult.confidence,
        spoken_feedback: intentResult.output.spoken_response,
      },
      proofing,
      trace: pipeline.trace,
    }
  );

  return {
    document,
    intentResult,
    spokenFeedback: intentResult.output.spoken_response,
    intent: intentResult.intent_id,
    confidence: intentResult.confidence,
    awaitingClarification: intentResult.awaiting_clarification,
    visualUpdates: intentResult.output.visual_updates,
  };
}

export async function getProactiveCoaching(
  clientId: string,
  tier: AgentTier = 'pro'
): Promise<WisprIntentResult | null> {
  const ctx = createBioContext(clientId, { tier, trigger: 'scheduled_sync' });
  const pipeline = await bioSupervisor.runPipeline({}, ctx);
  const twin = pipeline.context.twin;

  const sleepReading = pipeline.context.recentReadings.find((r) => r.metricKey === 'sleep_duration');
  const hrv = twin.recovery.hrvCurrent;
  const baseline = twin.recovery.hrvBaseline;

  return generateProactivePrompt({
    sleep_hours: sleepReading?.value,
    hrv_drop_pct: hrv && baseline ? ((baseline - hrv) / baseline) * 100 : undefined,
    recovery_score: twin.unifiedScores.find((s) => s.key === 'recovery_score')?.value,
  });
}

/** Map expanded intents to legacy adaptation specs */
function mapToLegacyIntent(intentId: string): import('@/types/wispr').WisprIntent {
  const map: Record<string, import('@/types/wispr').WisprIntent> = {
    im_sore: 'im_sore',
    knee_hurts: 'knee_hurts',
    back_tight: 'im_sore',
    injury_location_followup: 'im_sore',
    only_20_minutes: 'only_20_minutes',
    quick_session: 'only_20_minutes',
    traveling_this_week: 'traveling_this_week',
    hotel_workout: 'traveling_this_week',
    feeling_low_energy: 'feeling_low_energy',
  };
  return map[intentId] ?? 'unknown';
}

export { MEDICAL_DISCLAIMER };
