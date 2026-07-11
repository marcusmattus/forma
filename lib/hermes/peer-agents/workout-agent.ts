/**
 * Workout Programming Agent — Peer agent under Hermes Fitness Supervisor
 */

import { BaseAgent } from '@/lib/hermes/agent-base';
import type { AgentContext, AgentAction } from '@/types/agent';
import type { AdaptationRecommendation } from '@/types/bio';
import type { EnrichedHermesContext } from '@/types/hermes-context';

export interface WorkoutAgentInput {
  enriched_context: EnrichedHermesContext;
  adaptations: AdaptationRecommendation[];
  intent?: string;
}

export interface WorkoutAgentResult {
  session_modified: boolean;
  changes: Array<{
    type: string;
    description: string;
    exercises_removed?: string[];
    exercises_added?: string[];
    duration_minutes?: number;
  }>;
  actions: AgentAction[];
  confidence: number;
}

const EXERCISE_REMOVALS: Record<string, string[]> = {
  knee_hurts: ['squat', 'lunge', 'leg_press', 'box_jump'],
  back_tight: ['deadlift', 'good_morning', 'back_squat'],
  im_sore: [],
  traveling_this_week: ['barbell_bench', 'cable_machine'],
  only_20_minutes: [],
};

const EXERCISE_ADDITIONS: Record<string, string[]> = {
  knee_hurts: ['rdl', 'glute_bridge', 'hip_thrust'],
  back_tight: ['bird_dog', 'cat_cow', 'pallof_press'],
  traveling_this_week: ['push_up', 'bodyweight_squat', 'plank', 'burpee'],
};

export class WorkoutProgrammingAgent extends BaseAgent<WorkoutAgentInput, WorkoutAgentResult> {
  id = 'workout-programming' as const;
  name = 'Workout Programming Agent';
  description = 'Modifies workout sessions based on bio adaptations and voice intents';
  tier = 'free' as const;

  async run(input: WorkoutAgentInput, ctx: AgentContext): Promise<WorkoutAgentResult> {
    const intent = input.intent ?? input.enriched_context.detected_intent ?? 'unknown';
    const changes: WorkoutAgentResult['changes'] = [];
    const actions: AgentAction[] = [];

    for (const adapt of input.adaptations) {
      if (!adapt.affectedDomains.includes('workout')) continue;

      const removed = EXERCISE_REMOVALS[intent] ?? [];
      const added = EXERCISE_ADDITIONS[intent] ?? [];

      changes.push({
        type: adapt.type,
        description: adapt.description,
        exercises_removed: removed.length > 0 ? removed : undefined,
        exercises_added: added.length > 0 ? added : undefined,
        duration_minutes: intent === 'only_20_minutes' ? 20 : intent === 'quick_session' ? 30 : undefined,
      });

      actions.push({
        type: 'modify_workout',
        target: 'client',
        payload: { adaptation: adapt, removed, added },
        requiresApproval: adapt.requiresCoachApproval,
        priority: adapt.magnitude === 'major' ? 'high' : 'medium',
      });
    }

    if (changes.length === 0 && WORKOUT_INTENTS.has(intent)) {
      changes.push({
        type: 'session_review',
        description: `Workout reviewed for intent: ${intent}`,
      });
    }

    return {
      session_modified: changes.length > 0,
      changes,
      actions,
      confidence: input.enriched_context.intent_confidence ?? 0.75,
    };
  }
}

const WORKOUT_INTENTS = new Set([
  'im_sore', 'knee_hurts', 'back_tight', 'only_20_minutes', 'quick_session',
  'traveling_this_week', 'hotel_workout', 'feeling_low_energy', 'confirm_adaptation',
]);

export const workoutAgent = new WorkoutProgrammingAgent();
