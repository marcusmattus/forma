/**
 * Wispr-powered voice pipeline for Hermes Bio Modeling
 */

import {
  buildWisprVoiceLayer,
  detectWisprIntent,
  getWisprAdaptations,
  wisprAdaptationsToRecommendations,
} from '@/lib/wispr/voice-layer';
import { applyFitnessProofing, MEDICAL_DISCLAIMER } from '@/lib/bio/fitness-proofing';
import { bioSupervisor } from '@/lib/bio/supervisor';
import { buildMotionOSDocument } from '@/lib/bio/document';
import { createBioContext } from '@/lib/bio/engine';
import { recordVoiceContext } from '@/lib/hermes/memory';
import type { AgentTier } from '@/types/agent';
import type { VoiceAdaptationRequest } from '@/types/bio';
import type { MotionOSBioDocument } from '@/types/motionos';

export interface WisprPipelineResult {
  document: MotionOSBioDocument;
  spokenFeedback: string;
  intent: string;
  confidence: number;
}

export async function processWisprVoice(
  request: VoiceAdaptationRequest,
  tier: AgentTier = 'free'
): Promise<WisprPipelineResult> {
  const intentMatch = detectWisprIntent(request.transcript);
  const wisprLayer = buildWisprVoiceLayer(request.transcript, request.sessionId);
  const spec = getWisprAdaptations(intentMatch.intent);

  const ctx = createBioContext(request.clientId, {
    tier,
    trigger: 'voice_command',
    sessionId: request.sessionId,
    voiceInput: request.transcript,
  });

  const pipeline = await bioSupervisor.runPipeline({ voiceRequest: request }, ctx);

  let adaptations = pipeline.context.adaptations;
  if (spec) {
    const wisprAdapts = wisprAdaptationsToRecommendations(spec, request.transcript);
    adaptations = [...wisprAdapts, ...adaptations];
  }

  const proofing = applyFitnessProofing(adaptations, pipeline.context.twin, {
    trigger: 'voice_intent',
    voiceIntent: intentMatch.intent,
  });

  recordVoiceContext(request.clientId, request.transcript, intentMatch.intent);

  const document = buildMotionOSDocument(
    { ...pipeline.context, adaptations: proofing.approved },
    {
      correlationId: pipeline.trace.correlationId,
      voiceLayer: {
        session_id: request.sessionId,
        transcript: request.transcript,
        detected_intent: intentMatch.intent,
        confidence: intentMatch.confidence,
        spoken_feedback: wisprLayer.spoken_feedback,
      },
      proofing,
      trace: pipeline.trace,
    }
  );

  return {
    document,
    spokenFeedback: wisprLayer.spoken_feedback,
    intent: intentMatch.intent,
    confidence: intentMatch.confidence,
  };
}

export { MEDICAL_DISCLAIMER };
