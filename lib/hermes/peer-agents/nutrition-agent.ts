/**
 * Nutrition Agent — Peer agent under Hermes Fitness Supervisor
 */

import { BaseAgent } from '@/lib/hermes/agent-base';
import type { AgentContext, AgentAction } from '@/types/agent';
import type { AdaptationRecommendation } from '@/types/bio';
import type { EnrichedHermesContext } from '@/types/hermes-context';

export interface NutritionAgentInput {
  enriched_context: EnrichedHermesContext;
  adaptations: AdaptationRecommendation[];
  intent?: string;
}

export interface NutritionAgentResult {
  recommendations: Array<{
    type: 'meal' | 'macro_adjust' | 'hydration' | 'timing';
    description: string;
    calories?: number;
    protein_g?: number;
  }>;
  actions: AgentAction[];
  confidence: number;
}

export class NutritionAgent extends BaseAgent<NutritionAgentInput, NutritionAgentResult> {
  id = 'nutrition' as const;
  name = 'Nutrition Agent';
  description = 'Meal suggestions and macro adjustments based on bio state and voice intents';
  tier = 'free' as const;

  async run(input: NutritionAgentInput, ctx: AgentContext): Promise<NutritionAgentResult> {
    const intent = input.intent ?? input.enriched_context.detected_intent ?? '';
    const recovery = input.enriched_context.bio_state.recovery_score ?? 70;
    const recommendations: NutritionAgentResult['recommendations'] = [];
    const actions: AgentAction[] = [];

    if (intent === 'what_to_eat' || intent === 'craving_carbs') {
      recommendations.push({
        type: 'meal',
        description: 'Post-workout: grilled chicken, rice, vegetables (~550 kcal, 45g protein)',
        calories: 550,
        protein_g: 45,
      });
    }

    if (intent === 'feeling_low_energy' || recovery < 50) {
      recommendations.push({
        type: 'macro_adjust',
        description: 'Possible under-fueling — consider +200-300 kcal today',
        calories: 250,
      });
      actions.push({
        type: 'adjust_nutrition',
        target: 'client',
        payload: { caloric_adjustment: 250 },
        requiresApproval: true,
        priority: 'medium',
      });
    }

    for (const adapt of input.adaptations) {
      if (adapt.affectedDomains.includes('nutrition')) {
        recommendations.push({
          type: 'macro_adjust',
          description: adapt.description,
        });
      }
    }

    if (input.enriched_context.bio_state.soreness_level && input.enriched_context.bio_state.soreness_level > 6) {
      recommendations.push({
        type: 'hydration',
        description: 'Elevated soreness — increase hydration and consider anti-inflammatory foods',
      });
    }

    return {
      recommendations,
      actions,
      confidence: 0.8,
    };
  }
}

export const nutritionAgent = new NutritionAgent();
