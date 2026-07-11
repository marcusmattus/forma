/**
 * Predictive Analytics Agent
 * Forecasts plateaus, overtraining, super-compensation, body comp changes
 */

import { BaseAgent, tierAllowsFeature } from '@/lib/hermes/agent-base';
import type { AgentContext } from '@/types/agent';
import type { DigitalTwinState, Prediction, BioReading } from '@/types/bio';

export interface PredictiveInput {
  clientId: string;
  twin: DigitalTwinState;
  readings: BioReading[];
  horizonDays?: number;
}

export interface PredictiveResult {
  predictions: Prediction[];
  overallConfidence: number;
}

export class PredictiveAnalyticsAgent extends BaseAgent<PredictiveInput, PredictiveResult> {
  id = 'predictive-analytics' as const;
  name = 'Predictive Analytics Agent';
  description = 'Forecasts plateaus, overtraining risk, and performance trends';
  tier = 'pro' as const;

  async run(input: PredictiveInput, ctx: AgentContext): Promise<PredictiveResult> {
    if (!tierAllowsFeature(ctx.tier, 'pro')) {
      return {
        predictions: this.getFreeTierPredictions(input.twin),
        overallConfidence: 0.4,
      };
    }

    const predictions: Prediction[] = [];
    const horizon = input.horizonDays ?? 14;

    predictions.push(...this.predictOvertraining(input.twin, horizon));
    predictions.push(...this.predictPlateau(input.twin, horizon));
    predictions.push(...this.predictSupercompensation(input.twin));
    predictions.push(...this.predictBodyComp(input.twin, input.readings, horizon));
    predictions.push(...this.predictPerformanceTrend(input.twin));

    const overallConfidence =
      predictions.length > 0
        ? predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length
        : 0;

    return { predictions, overallConfidence };
  }

  private getFreeTierPredictions(twin: DigitalTwinState): Prediction[] {
    const overtraining = twin.unifiedScores.find((s) => s.key === 'overtraining_risk');
    if (overtraining && overtraining.value > 60) {
      return [
        {
          id: `pred_free_${Date.now()}`,
          type: 'overtraining',
          confidence: 0.5,
          timeline: 'next 7 days',
          description: 'Your load may be exceeding recovery capacity.',
          actionableBy: 'client',
          recommendedActions: ['Consider a rest day', 'Reduce workout intensity'],
        },
      ];
    }
    return [];
  }

  private predictOvertraining(twin: DigitalTwinState, horizon: number): Prediction[] {
    const risk = twin.unifiedScores.find((s) => s.key === 'overtraining_risk');
    if (!risk || risk.value < 50) return [];

    return [
      {
        id: `pred_ot_${Date.now()}`,
        type: 'overtraining',
        confidence: Math.min(0.9, risk.value / 100),
        timeline: `next ${horizon} days`,
        description: `Overtraining risk at ${risk.value}%. HRV trend ${
          twin.trends.hrv?.direction ?? 'unknown'
        }, sleep debt ${twin.recovery.sleepDebtHours}h.`,
        actionableBy: 'coach',
        recommendedActions: [
          'Schedule deload week',
          'Reduce training volume 20-30%',
          'Prioritize sleep hygiene',
        ],
      },
    ];
  }

  private predictPlateau(twin: DigitalTwinState, horizon: number): Prediction[] {
    if (twin.performance.plateauRisk < 40 && twin.performance.strengthTrend >= 0) return [];

    return [
      {
        id: `pred_plat_${Date.now()}`,
        type: 'plateau',
        confidence: 0.7,
        timeline: `within ${horizon} days`,
        description:
          'Performance metrics suggest approaching a training plateau based on volume tolerance and trend stagnation.',
        actionableBy: 'coach',
        recommendedActions: [
          'Vary rep ranges and exercise selection',
          'Introduce periodization block',
          'Assess nutrition adequacy',
        ],
      },
    ];
  }

  private predictSupercompensation(twin: DigitalTwinState): Prediction[] {
    const recovery = twin.unifiedScores.find((s) => s.key === 'recovery_score');
    const load = twin.unifiedScores.find((s) => s.key === 'load_score');

    if (!recovery || !load) return [];
    if (recovery.value > 75 && load.value < 40 && twin.recovery.sleepDebtHours < 2) {
      return [
        {
          id: `pred_super_${Date.now()}`,
          type: 'supercompensation',
          confidence: 0.75,
          timeline: 'next 3-5 days',
          description:
            'Recovery markers indicate a super-compensation window — ideal for PR attempts or volume progression.',
          actionableBy: 'client',
          recommendedActions: [
            'Schedule key workout in next 48h',
            'Consider testing 1RM or AMRAP sets',
          ],
        },
      ];
    }
    return [];
  }

  private predictBodyComp(
    twin: DigitalTwinState,
    readings: BioReading[],
    horizon: number
  ): Prediction[] {
    const bodyComp = twin.unifiedScores.find((s) => s.key === 'body_comp_delta');
    if (!bodyComp || bodyComp.confidence < 0.3) return [];

    const trend = twin.trends.body_weight;
    if (!trend) return [];

    return [
      {
        id: `pred_bc_${Date.now()}`,
        type: 'body_comp_change',
        confidence: trend.confidence,
        timeline: `over ${horizon} days`,
        description: `Body composition trending ${trend.direction}. Current delta: ${bodyComp.value}%.`,
        actionableBy: 'coach',
        recommendedActions: [
          trend.direction === 'declining'
            ? 'Review caloric intake and protein targets'
            : 'Maintain current nutrition protocol',
          'Schedule progress photos at 2-week intervals',
        ],
      },
    ];
  }

  private predictPerformanceTrend(twin: DigitalTwinState): Prediction[] {
    const loadTrend = twin.trends.strain;
    if (!loadTrend) return [];

    return [
      {
        id: `pred_perf_${Date.now()}`,
        type: 'performance_trend',
        confidence: loadTrend.confidence,
        timeline: 'ongoing',
        description: `Training strain is ${loadTrend.direction}. Volume tolerance: ${twin.performance.volumeTolerance}%.`,
        actionableBy: 'coach',
        recommendedActions:
          loadTrend.direction === 'declining'
            ? ['Investigate recovery factors', 'Check program adherence']
            : ['Progressive overload on track', 'Monitor for overreach'],
      },
    ];
  }
}

export const predictiveAgent = new PredictiveAnalyticsAgent();
