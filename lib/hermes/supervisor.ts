/**
 * Hermes Fitness Supervisor
 * Top-level orchestrator — delegates bio modeling to Bio Modeling Supervisor
 */

import { bioSupervisor } from '@/lib/bio/supervisor';
import { createBioContext } from '@/lib/bio/engine';
import type { AgentContext, AgentAction, OrchestrationTrace } from '@/types/agent';
import type { BioPipelineResult } from '@/lib/bio/supervisor';
import type { IngestPayload, VoiceAdaptationRequest } from '@/types/bio';

export interface HermesRequest {
  clientId: string;
  intent: 'bio_sync' | 'bio_ingest' | 'voice_adapt' | 'builder_insights' | 'full_pipeline';
  payload?: IngestPayload | VoiceAdaptationRequest | Record<string, unknown>;
  tier?: AgentContext['tier'];
}

export interface HermesResponse {
  bio?: BioPipelineResult;
  actions: AgentAction[];
  trace: OrchestrationTrace[];
  message: string;
}

export class HermesFitnessSupervisor {
  id = 'hermes-fitness-supervisor' as const;

  async handle(request: HermesRequest): Promise<HermesResponse> {
    const ctx = createBioContext(request.clientId, {
      tier: request.tier ?? 'free',
      trigger: this.mapTrigger(request.intent),
    });

    const traces: OrchestrationTrace[] = [];
    const actions: AgentAction[] = [];
    let bio: BioPipelineResult | undefined;

    switch (request.intent) {
      case 'bio_ingest':
        bio = await bioSupervisor.runPipeline(
          { ingest: request.payload as IngestPayload },
          ctx
        );
        break;

      case 'voice_adapt':
        bio = await bioSupervisor.runPipeline(
          { voiceRequest: request.payload as VoiceAdaptationRequest },
          ctx
        );
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

    if (bio) {
      traces.push(bio.trace);
      actions.push(...bio.downstreamActions);
    }

    return {
      bio,
      actions,
      trace: traces,
      message: this.buildMessage(request.intent, bio),
    };
  }

  private mapTrigger(intent: HermesRequest['intent']): AgentContext['trigger'] {
    const map: Record<HermesRequest['intent'], AgentContext['trigger']> = {
      bio_sync: 'scheduled_sync',
      bio_ingest: 'wearable_webhook',
      voice_adapt: 'voice_command',
      builder_insights: 'builder_studio_request',
      full_pipeline: 'manual_log',
    };
    return map[intent];
  }

  private buildMessage(intent: HermesRequest['intent'], bio?: BioPipelineResult): string {
    if (!bio) return 'No bio data processed.';
    const recovery = bio.context.twin.unifiedScores?.find((s) => s.key === 'recovery_score');
    return `Bio pipeline complete (${intent}). Recovery: ${recovery?.value ?? 'N/A'}%. ${bio.context.adaptations.length} adaptations, ${bio.context.anomalies.length} anomalies, ${bio.context.insights.length} insights.`;
  }
}

export const hermesSupervisor = new HermesFitnessSupervisor();
