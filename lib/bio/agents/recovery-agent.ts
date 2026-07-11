/**
 * Recovery & Adaptation Agent
 * Analyzes recovery markers and triggers plan adaptations (voice-aware)
 */

import { BaseAgent } from '@/lib/hermes/agent-base';
import { recordAdaptation, recordVoiceContext } from '@/lib/hermes/memory';
import type { AgentAction, AgentContext } from '@/types/agent';
import type {
  AdaptationRecommendation,
  DigitalTwinState,
  Prediction,
  VoiceAdaptationRequest,
} from '@/types/bio';

export interface RecoveryInput {
  clientId: string;
  twin: DigitalTwinState;
  predictions: Prediction[];
  voiceRequest?: VoiceAdaptationRequest;
}

export interface RecoveryResult {
  adaptations: AdaptationRecommendation[];
  actions: AgentAction[];
  voiceIntent?: string;
}

const VOICE_INTENTS: Record<string, { keywords: string[]; adaptation: Partial<AdaptationRecommendation> }> = {
  sore: {
    keywords: ['sore', 'pain', 'hurt', 'ache'],
    adaptation: {
      type: 'exercise_swap',
      description: 'Swap high-impact exercises for lower-stress alternatives',
      magnitude: 'moderate',
      autoApply: true,
      requiresCoachApproval: false,
      affectedDomains: ['workout'],
    },
  },
  time_limited: {
    keywords: ['20 minutes', '30 minutes', 'short on time', 'quick workout', 'only have'],
    adaptation: {
      type: 'schedule',
      description: 'Condense workout to available time window',
      magnitude: 'minor',
      autoApply: true,
      requiresCoachApproval: false,
      affectedDomains: ['workout'],
    },
  },
  traveling: {
    keywords: ['travel', 'travelling', 'hotel', 'away', 'no gym'],
    adaptation: {
      type: 'exercise_swap',
      description: 'Switch to bodyweight/travel-friendly workout',
      magnitude: 'moderate',
      autoApply: true,
      requiresCoachApproval: false,
      affectedDomains: ['workout'],
    },
  },
  tired: {
    keywords: ['tired', 'exhausted', 'fatigued', 'no energy'],
    adaptation: {
      type: 'intensity',
      description: 'Reduce workout intensity by 20-30%',
      magnitude: 'moderate',
      autoApply: true,
      requiresCoachApproval: false,
      affectedDomains: ['workout', 'recovery'],
    },
  },
  hungry: {
    keywords: ['hungry', 'craving', 'underfed'],
    adaptation: {
      type: 'nutrition',
      description: 'Adjust caloric target — possible under-fueling',
      magnitude: 'minor',
      autoApply: false,
      requiresCoachApproval: true,
      affectedDomains: ['nutrition'],
    },
  },
};

export class RecoveryAdaptationAgent extends BaseAgent<RecoveryInput, RecoveryResult> {
  id = 'recovery-adaptation' as const;
  name = 'Recovery & Adaptation Agent';
  description = 'Analyzes recovery and triggers workout/nutrition adaptations';
  tier = 'free' as const;

  async run(input: RecoveryInput, ctx: AgentContext): Promise<RecoveryResult> {
    const adaptations: AdaptationRecommendation[] = [];
    const actions: AgentAction[] = [];
    let voiceIntent: string | undefined;

    if (input.voiceRequest) {
      const voiceResult = this.processVoiceInput(input);
      adaptations.push(...voiceResult.adaptations);
      voiceIntent = voiceResult.intent;
      recordVoiceContext(input.clientId, input.voiceRequest.transcript, voiceIntent ?? 'unknown');
    }

    adaptations.push(...this.analyzeRecoveryMarkers(input.twin));
    adaptations.push(...this.deriveFromPredictions(input.predictions));

    for (const adaptation of adaptations) {
      if (adaptation.autoApply && !adaptation.requiresCoachApproval) {
        recordAdaptation(input.clientId, {
          type: adaptation.type,
          description: adaptation.description,
          appliedAt: new Date().toISOString(),
        });

        for (const domain of adaptation.affectedDomains) {
          actions.push({
            type: `adapt_${domain}`,
            target: domain === 'workout' ? 'workout-programming' : domain === 'nutrition' ? 'nutrition' : 'client',
            payload: adaptation,
            requiresApproval: adaptation.requiresCoachApproval,
            priority: adaptation.magnitude === 'major' ? 'high' : 'medium',
          });
        }
      }
    }

    return { adaptations, actions, voiceIntent };
  }

  private processVoiceInput(input: RecoveryInput): {
    adaptations: AdaptationRecommendation[];
    intent?: string;
  } {
    const transcript = input.voiceRequest!.transcript.toLowerCase();
    const adaptations: AdaptationRecommendation[] = [];
    let intent: string | undefined;

    for (const [intentKey, config] of Object.entries(VOICE_INTENTS)) {
      if (config.keywords.some((kw) => transcript.includes(kw))) {
        intent = intentKey;
        adaptations.push({
          id: `adapt_voice_${Date.now()}`,
          rationale: `Voice input detected: "${input.voiceRequest!.transcript}"`,
          ...config.adaptation,
        } as AdaptationRecommendation);
        break;
      }
    }

    return { adaptations, intent };
  }

  private analyzeRecoveryMarkers(twin: DigitalTwinState): AdaptationRecommendation[] {
    const adaptations: AdaptationRecommendation[] = [];
    const recovery = twin.unifiedScores.find((s) => s.key === 'recovery_score');
    const load = twin.unifiedScores.find((s) => s.key === 'load_score');

    if (recovery && recovery.value < 40) {
      adaptations.push({
        id: `adapt_recovery_${Date.now()}`,
        type: 'deload',
        description: 'Recovery score critically low — recommend active recovery or rest day',
        magnitude: 'major',
        autoApply: false,
        requiresCoachApproval: true,
        rationale: `Recovery score: ${recovery.value}%, sleep debt: ${twin.recovery.sleepDebtHours}h`,
        affectedDomains: ['workout', 'recovery'],
      });
    }

    if (load && recovery && load.value > 70 && recovery.value < 50) {
      adaptations.push({
        id: `adapt_load_${Date.now()}`,
        type: 'volume',
        description: 'Reduce training volume by 25% for next 3 sessions',
        magnitude: 'moderate',
        autoApply: true,
        requiresCoachApproval: false,
        rationale: `Load-recovery imbalance: load ${load.value}%, recovery ${recovery.value}%`,
        affectedDomains: ['workout'],
      });
    }

    if (twin.recovery.sorenessLevel > 7) {
      adaptations.push({
        id: `adapt_sore_${Date.now()}`,
        type: 'intensity',
        description: 'High soreness detected — reduce eccentric load and add mobility work',
        magnitude: 'moderate',
        autoApply: true,
        requiresCoachApproval: false,
        rationale: `Soreness level: ${twin.recovery.sorenessLevel}/10`,
        affectedDomains: ['workout', 'recovery'],
      });
    }

    if (twin.recovery.sleepDebtHours > 6) {
      adaptations.push({
        id: `adapt_sleep_${Date.now()}`,
        type: 'recovery',
        description: 'Prioritize sleep — defer high-intensity sessions',
        magnitude: 'moderate',
        autoApply: true,
        requiresCoachApproval: false,
        rationale: `Accumulated sleep debt: ${twin.recovery.sleepDebtHours}h`,
        affectedDomains: ['workout', 'habits'],
      });
    }

    return adaptations;
  }

  private deriveFromPredictions(predictions: Prediction[]): AdaptationRecommendation[] {
    return predictions
      .filter((p) => p.type === 'overtraining' && p.confidence > 0.6)
      .map((p) => ({
        id: `adapt_pred_${p.id}`,
        type: 'deload' as const,
        description: p.recommendedActions[0] ?? 'Schedule deload',
        magnitude: 'major' as const,
        autoApply: false,
        requiresCoachApproval: true,
        rationale: p.description,
        affectedDomains: ['workout' as const, 'recovery' as const],
      }));
  }
}

export const recoveryAgent = new RecoveryAdaptationAgent();
