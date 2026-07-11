/**
 * Hermes Integration Layer
 * Production-grade unified entry point for MotionOS platform orchestration
 */

import { contextRouter } from '@/lib/hermes/context-router';
import { normalizeMultimodalInput, type NormalizedHermesInput } from '@/lib/hermes/multimodal';
import { bioSupervisor } from '@/lib/bio/supervisor';
import { buildMotionOSDocument } from '@/lib/bio/document';
import { applyFitnessProofing } from '@/lib/bio/fitness-proofing';
import { processVoiceTurn } from '@/lib/wispr/conversation';
import { workoutAgent, nutritionAgent, progressAgent } from '@/lib/hermes/peer-agents';
import { createBioContext } from '@/lib/bio/engine';
import type { AgentAction, AgentTier, OrchestrationTrace } from '@/types/agent';
import type {
  ContextRouterDecision,
  HermesIntegrationResult,
  MultimodalInput,
} from '@/types/hermes-context';
import type { BioPipelineResult } from '@/lib/bio/supervisor';

export interface HermesIntegrationRequest {
  input: MultimodalInput;
  tier?: AgentTier;
  mode?: 'client' | 'coach';
  coach_override?: boolean;
}

export class HermesIntegrationLayer {
  /**
   * Primary entry — all multimodal inputs flow through Context Router first
   */
  async process(request: HermesIntegrationRequest): Promise<HermesIntegrationResult> {
    const normalized = normalizeMultimodalInput(request.input);
    const tier = request.tier ?? 'free';

    // Pre-fetch bio state if available (router enriches further after pipeline)
    const initialBioState = await this.peekBioState(normalized.client_id, tier);

    const decision = contextRouter.route({
      normalized,
      tier,
      mode: request.mode,
      coach_override: request.coach_override,
      bio_state: initialBioState,
    });

    const traces: OrchestrationTrace[] = [];
    const allActions: AgentAction[] = [];
    const peerResults: Record<string, unknown> = {};
    let bioPipeline: BioPipelineResult | undefined;
    let spokenFeedback: string | undefined;
    let visualUpdates: string[] = [];
    let document: unknown;

    const ctx = createBioContext(normalized.client_id, {
      tier,
      trigger: normalized.trigger,
      sessionId: normalized.session_id,
      voiceInput: normalized.transcript,
    });

    // ── Phase 1: Bio Modeling Supervisor ──
    const shouldRunBio = decision.routing.agent_routes.some((r) =>
      ['ingestion-normalization', 'digital-twin-modeler', 'recovery-adaptation'].includes(r.agent_id)
    );

    if (shouldRunBio) {
      if (normalized.modality === 'voice' && normalized.transcript) {
        bioPipeline = await bioSupervisor.runPipeline(
          {
            voiceRequest: {
              clientId: normalized.client_id,
              transcript: normalized.transcript,
              sessionId: normalized.session_id,
            },
          },
          ctx
        );
        const intentResult = processVoiceTurn({
          clientId: normalized.client_id,
          sessionId: normalized.session_id,
          utterance: normalized.transcript,
          mode: request.mode,
          bioContext: {
            recovery_score: bioPipeline.context.twin.unifiedScores.find((s) => s.key === 'recovery_score')?.value,
            load_score: bioPipeline.context.twin.unifiedScores.find((s) => s.key === 'load_score')?.value,
            hrv: bioPipeline.context.twin.recovery.hrvCurrent ?? undefined,
            sleep_debt: bioPipeline.context.twin.recovery.sleepDebtHours,
          },
        });
        spokenFeedback = intentResult.output.spoken_response;
        visualUpdates = intentResult.output.visual_updates;
        document = buildMotionOSDocument(bioPipeline.context, {
          trace: bioPipeline.trace,
          correlationId: decision.correlation_id,
          voiceLayer: {
            session_id: normalized.session_id,
            transcript: normalized.transcript,
            detected_intent: intentResult.intent_id,
            confidence: intentResult.confidence,
            spoken_feedback: intentResult.output.spoken_response,
          },
        });
        traces.push(bioPipeline.trace);
        allActions.push(...bioPipeline.downstreamActions);
      } else {
        bioPipeline = await bioSupervisor.runPipeline(
          {
            ingest: normalized.ingest,
            voiceRequest: normalized.transcript
              ? { clientId: normalized.client_id, transcript: normalized.transcript, sessionId: normalized.session_id }
              : undefined,
            audience: request.mode === 'coach' ? 'coach' : 'client',
          },
          ctx
        );
        traces.push(bioPipeline.trace);
        allActions.push(...bioPipeline.downstreamActions);
        document = buildMotionOSDocument(bioPipeline.context, { trace: bioPipeline.trace, correlationId: decision.correlation_id });
      }
    }

    const adaptations = bioPipeline?.context?.adaptations ?? [];
    const proofing = bioPipeline?.context?.twin
      ? applyFitnessProofing(adaptations, bioPipeline.context.twin, { coachOverride: request.coach_override })
      : undefined;

    const enrichedWithBio = {
      ...decision.enriched_context,
      bio_state: {
        ...decision.enriched_context.bio_state,
        recovery_score: bioPipeline?.context?.twin?.unifiedScores?.find((s) => s.key === 'recovery_score')?.value,
        load_score: bioPipeline?.context?.twin?.unifiedScores?.find((s) => s.key === 'load_score')?.value,
        overtraining_risk: bioPipeline?.context?.twin?.unifiedScores?.find((s) => s.key === 'overtraining_risk')?.value,
        soreness_level: bioPipeline?.context?.twin?.recovery?.sorenessLevel,
        sleep_debt_hours: bioPipeline?.context?.twin?.recovery?.sleepDebtHours,
        twin_version: bioPipeline?.context?.twin?.version,
      },
    };

    // ── Phase 2: Peer Agents (post-bio) ──
    const routeIds = new Set(decision.routing.agent_routes.map((r) => r.agent_id));

    if (routeIds.has('workout-programming')) {
      const result = await workoutAgent.execute(
        { enriched_context: enrichedWithBio, adaptations: proofing?.approved ?? adaptations, intent: normalized.detected_intent },
        ctx
      );
      peerResults['workout-programming'] = result.data;
      if (result.data && typeof result.data === 'object' && 'actions' in result.data) {
        allActions.push(...(result.data as { actions: AgentAction[] }).actions);
      }
      visualUpdates = [...visualUpdates, 'workout_card'];
    }

    if (routeIds.has('nutrition')) {
      const result = await nutritionAgent.execute(
        { enriched_context: enrichedWithBio, adaptations: proofing?.approved ?? adaptations, intent: normalized.detected_intent },
        ctx
      );
      peerResults['nutrition'] = result.data;
      if (result.data && typeof result.data === 'object' && 'actions' in result.data) {
        allActions.push(...(result.data as { actions: AgentAction[] }).actions);
      }
      visualUpdates = [...visualUpdates, 'nutrition_card'];
    }

    if (routeIds.has('progress-analyst')) {
      const result = await progressAgent.execute(
        {
          enriched_context: enrichedWithBio,
          bio_insights: bioPipeline?.context?.insights?.map((i) => ({ title: i.title, body: i.body })),
        },
        ctx
      );
      peerResults['progress-analyst'] = result.data;
      if (result.data && typeof result.data === 'object' && 'actions' in result.data) {
        allActions.push(...(result.data as { actions: AgentAction[] }).actions);
      }
      if (normalized.detected_intent === 'progress_check' || normalized.detected_intent === 'how_am_i_doing') {
        spokenFeedback = spokenFeedback ?? (result.data as { summary?: string })?.summary;
      }
      visualUpdates = [...visualUpdates, 'dashboard'];
    }

    // Apply safety blocks
    if (decision.safety.halt_training) {
      allActions.push({
        type: 'halt_training',
        target: 'workout-programming',
        payload: { reason: 'Safety gate: halt_training active' },
        requiresApproval: false,
        priority: 'critical',
      });
    }

    return {
      decision: { ...decision, enriched_context: enrichedWithBio },
      bio_pipeline: bioPipeline,
      peer_results: peerResults,
      spoken_feedback: spokenFeedback,
      visual_updates: [...new Set(visualUpdates)],
      actions: allActions,
      traces,
      document,
      message: this.buildSummary(decision, spokenFeedback, allActions.length),
    };
  }

  private async peekBioState(clientId: string, tier: AgentTier) {
    try {
      const pipeline = await bioSupervisor.runPipeline({}, createBioContext(clientId, { tier, trigger: 'manual_log' }));
      const twin = pipeline.context.twin;
      return {
        recovery_score: twin.unifiedScores.find((s) => s.key === 'recovery_score')?.value,
        load_score: twin.unifiedScores.find((s) => s.key === 'load_score')?.value,
        overtraining_risk: twin.unifiedScores.find((s) => s.key === 'overtraining_risk')?.value,
        hrv: twin.recovery.hrvCurrent ?? undefined,
        hrv_baseline: twin.recovery.hrvBaseline ?? undefined,
        sleep_debt_hours: twin.recovery.sleepDebtHours,
        soreness_level: twin.recovery.sorenessLevel,
        twin_version: twin.version,
      };
    } catch {
      return {};
    }
  }

  private buildSummary(decision: ContextRouterDecision, spoken?: string, actionCount?: number): string {
    const intent = decision.enriched_context.detected_intent ?? 'sync';
    const agents = decision.routing.agent_routes.map((r) => r.agent_id).join(', ');
    return `Hermes routed "${intent}" via ${decision.enriched_context.input_modality} → [${agents}]. ${actionCount ?? 0} actions. ${spoken ? `Coach: "${spoken.slice(0, 80)}..."` : ''}`;
  }
}

export const hermesIntegration = new HermesIntegrationLayer();

/** Convenience: voice-only entry */
export async function processHermesVoice(
  clientId: string,
  transcript: string,
  sessionId: string,
  options?: { tier?: AgentTier; mode?: 'client' | 'coach' }
) {
  return hermesIntegration.process({
    input: {
      modality: 'voice',
      client_id: clientId,
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      payload: { type: 'voice', transcript },
    },
    tier: options?.tier ?? 'pro',
    mode: options?.mode,
  });
}
