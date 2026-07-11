/**
 * Hermes Fitness Supervisor
 * Top-level orchestrator — delegates to Integration Layer + Context Router
 */

import { hermesIntegration, processHermesVoice } from '@/lib/hermes/integration-layer';
import { bioSupervisor } from '@/lib/bio/supervisor';
import { createBioContext } from '@/lib/bio/engine';
import type { AgentContext, AgentAction, OrchestrationTrace } from '@/types/agent';
import type { BioPipelineResult } from '@/lib/bio/supervisor';
import type { HermesIntegrationResult, MultimodalInput } from '@/types/hermes-context';
import type { IngestPayload, VoiceAdaptationRequest } from '@/types/bio';

export interface HermesRequest {
  clientId: string;
  intent: 'bio_sync' | 'bio_ingest' | 'voice_adapt' | 'builder_insights' | 'full_pipeline' | 'multimodal';
  payload?: IngestPayload | VoiceAdaptationRequest | MultimodalInput | Record<string, unknown>;
  tier?: AgentContext['tier'];
  mode?: 'client' | 'coach';
  coach_override?: boolean;
}

export interface HermesResponse {
  integration?: HermesIntegrationResult;
  bio?: BioPipelineResult;
  decision?: HermesIntegrationResult['decision'];
  actions: AgentAction[];
  trace: OrchestrationTrace[];
  spoken_feedback?: string;
  visual_updates?: string[];
  message: string;
}

export class HermesFitnessSupervisor {
  id = 'hermes-fitness-supervisor' as const;

  async handle(request: HermesRequest): Promise<HermesResponse> {
    // Multimodal path — full Integration Layer
    if (request.intent === 'multimodal' && request.payload && 'modality' in request.payload) {
      const result = await hermesIntegration.process({
        input: request.payload as MultimodalInput,
        tier: request.tier,
        mode: request.mode,
        coach_override: request.coach_override,
      });
      return this.wrapIntegration(result);
    }

    // Voice — route through Integration Layer
    if (request.intent === 'voice_adapt') {
      const voice = request.payload as VoiceAdaptationRequest;
      const result = await processHermesVoice(
        voice.clientId,
        voice.transcript,
        voice.sessionId,
        { tier: request.tier, mode: request.mode }
      );
      return this.wrapIntegration(result);
    }

    // Legacy bio intents — direct bio supervisor (Context Router lite)
    const ctx = createBioContext(request.clientId, {
      tier: request.tier ?? 'free',
      trigger: this.mapTrigger(request.intent),
    });

    let bio: BioPipelineResult | undefined;

    switch (request.intent) {
      case 'bio_ingest':
        bio = await bioSupervisor.runPipeline({ ingest: request.payload as IngestPayload }, ctx);
        break;
      case 'bio_sync':
      case 'full_pipeline':
      case 'builder_insights':
        bio = await bioSupervisor.runPipeline(
          { audience: request.intent === 'builder_insights' ? 'coach' : 'client' },
          ctx
        );
        break;
    }

    return {
      bio,
      actions: bio?.downstreamActions ?? [],
      trace: bio ? [bio.trace] : [],
      message: bio
        ? `Bio pipeline (${request.intent}) complete.`
        : 'No processing performed.',
    };
  }

  private wrapIntegration(result: HermesIntegrationResult): HermesResponse {
    return {
      integration: result,
      decision: result.decision,
      bio: result.bio_pipeline as BioPipelineResult | undefined,
      actions: result.actions,
      trace: result.traces,
      spoken_feedback: result.spoken_feedback,
      visual_updates: result.visual_updates,
      message: result.message,
    };
  }

  private mapTrigger(intent: HermesRequest['intent']): AgentContext['trigger'] {
    const map: Record<string, AgentContext['trigger']> = {
      bio_sync: 'scheduled_sync',
      bio_ingest: 'wearable_webhook',
      voice_adapt: 'voice_command',
      builder_insights: 'builder_studio_request',
      full_pipeline: 'manual_log',
      multimodal: 'manual_log',
    };
    return map[intent] ?? 'manual_log';
  }
}

export const hermesSupervisor = new HermesFitnessSupervisor();
