/**
 * Progress Analyst Agent — Peer agent under Hermes Fitness Supervisor
 */

import { BaseAgent } from '@/lib/hermes/agent-base';
import type { AgentContext, AgentAction } from '@/types/agent';
import type { EnrichedHermesContext } from '@/types/hermes-context';

export interface ProgressAnalystInput {
  enriched_context: EnrichedHermesContext;
  bio_insights?: Array<{ title: string; body: string }>;
}

export interface ProgressAnalystResult {
  summary: string;
  metrics: {
    recovery_trend: string;
    strength_summary?: string;
    workouts_completed_estimate: number;
    on_track: boolean;
  };
  actions: AgentAction[];
  confidence: number;
}

export class ProgressAnalystAgent extends BaseAgent<ProgressAnalystInput, ProgressAnalystResult> {
  id = 'progress-analyst' as const;
  name = 'Progress Analyst Agent';
  description = 'Analyzes longitudinal progress from bio data, memory, and training history';
  tier = 'pro' as const;

  async run(input: ProgressAnalystInput, ctx: AgentContext): Promise<ProgressAnalystResult> {
    const bio = input.enriched_context.bio_state;
    const memory = input.enriched_context.memory;
    const recovery = bio.recovery_score ?? 70;
    const load = bio.load_score ?? 50;
    const onTrack = recovery >= 50 && (bio.overtraining_risk ?? 0) < 60;

    const summary = [
      `Recovery: ${recovery}% | Load: ${load}%`,
      memory.strength_history_summary ?? 'Strength history building',
      `${memory.adaptation_history_count} adaptations applied historically`,
      onTrack ? 'On track this week.' : 'Consider prioritizing recovery.',
    ].join('. ');

    return {
      summary,
      metrics: {
        recovery_trend: recovery >= 70 ? 'improving' : recovery >= 50 ? 'stable' : 'declining',
        strength_summary: memory.strength_history_summary,
        workouts_completed_estimate: 4,
        on_track: onTrack,
      },
      actions: [
        {
          type: 'update_dashboard',
          target: 'client',
          payload: { summary },
          requiresApproval: false,
          priority: 'low',
        },
      ],
      confidence: 0.85,
    };
  }
}

export const progressAgent = new ProgressAnalystAgent();
