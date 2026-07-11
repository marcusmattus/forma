/**
 * Insight & Visualization Agent
 * Generates plain-language explanations, dashboards, and coaching summaries
 */

import { BaseAgent, tierAllowsFeature } from '@/lib/hermes/agent-base';
import type { AgentContext } from '@/types/agent';
import type {
  AnomalyAlert,
  AdaptationRecommendation,
  BioInsight,
  DigitalTwinState,
  Prediction,
  VisualizationSpec,
} from '@/types/bio';

export interface InsightInput {
  clientId: string;
  twin: DigitalTwinState;
  predictions: Prediction[];
  adaptations: AdaptationRecommendation[];
  anomalies: AnomalyAlert[];
  audience?: 'client' | 'coach' | 'both';
}

export interface InsightResult {
  insights: BioInsight[];
  visualizations: VisualizationSpec[];
  coachingSummary: string;
}

export class InsightVisualizationAgent extends BaseAgent<InsightInput, InsightResult> {
  id = 'insight-visualization' as const;
  name = 'Insight & Visualization Agent';
  description = 'Generates dashboards, progress charts, and coaching summaries';
  tier = 'free' as const;

  async run(input: InsightInput, ctx: AgentContext): Promise<InsightResult> {
    const audience = input.audience ?? 'both';
    const insights: BioInsight[] = [];
    const now = new Date().toISOString();

    insights.push(this.generateDailySummary(input.twin, audience, now));

    for (const score of input.twin.unifiedScores) {
      insights.push({
        id: `insight_score_${score.key}`,
        audience,
        category: 'trend',
        title: this.scoreTitle(score.key),
        body: score.explanation,
        generatedAt: now,
        tier: 'free',
        visualizations: [
          {
            type: 'ring',
            metricKeys: [score.key],
            windowDays: 1,
            title: this.scoreTitle(score.key),
          },
        ],
      });
    }

    if (tierAllowsFeature(ctx.tier, 'pro')) {
      for (const pred of input.predictions) {
        insights.push({
          id: `insight_pred_${pred.id}`,
          audience: pred.actionableBy === 'client' ? 'client' : 'coach',
          category: 'prediction',
          title: this.predictionTitle(pred.type),
          body: `${pred.description} (${pred.timeline}, confidence: ${Math.round(pred.confidence * 100)}%)`,
          generatedAt: now,
          tier: 'pro',
        });
      }
    }

    for (const anomaly of input.anomalies.filter((a) => a.severity !== 'info')) {
      insights.push({
        id: `insight_anom_${anomaly.id}`,
        audience: anomaly.severity === 'critical' ? 'coach' : 'both',
        category: 'alert',
        title: anomaly.title,
        body: anomaly.description,
        generatedAt: now,
        tier: 'pro',
      });
    }

    for (const adapt of input.adaptations) {
      insights.push({
        id: `insight_adapt_${adapt.id}`,
        audience: 'both',
        category: 'recommendation',
        title: `Adaptation: ${adapt.type}`,
        body: `${adapt.description} — ${adapt.rationale}`,
        generatedAt: now,
        tier: 'free',
      });
    }

    const visualizations = this.buildDashboardVisualizations(input.twin);
    const coachingSummary = this.buildCoachingSummary(input);

    return { insights, visualizations, coachingSummary };
  }

  private generateDailySummary(
    twin: DigitalTwinState,
    audience: BioInsight['audience'],
    now: string
  ): BioInsight {
    const recovery = twin.unifiedScores.find((s) => s.key === 'recovery_score');
    const load = twin.unifiedScores.find((s) => s.key === 'load_score');

    const readiness =
      recovery && recovery.value > 70
        ? 'well-recovered and ready for training'
        : recovery && recovery.value > 40
          ? 'moderately recovered — consider adjusting intensity'
          : 'showing signs of fatigue — prioritize recovery today';

    return {
      id: `insight_daily_${Date.now()}`,
      audience,
      category: 'summary',
      title: 'Daily Bio Summary',
      body: `Recovery: ${recovery?.value ?? 'N/A'}% | Load: ${load?.value ?? 'N/A'}%. You are ${readiness}. Sleep debt: ${twin.recovery.sleepDebtHours}h.`,
      generatedAt: now,
      tier: 'free',
      visualizations: [
        { type: 'ring', metricKeys: ['recovery_score', 'load_score'], windowDays: 1, title: 'Today' },
      ],
    };
  }

  private buildDashboardVisualizations(twin: DigitalTwinState): VisualizationSpec[] {
    return [
      {
        type: 'ring',
        metricKeys: ['recovery_score', 'load_score', 'readiness_score', 'sleep_quality_score'],
        windowDays: 1,
        title: 'Daily Progress',
      },
      {
        type: 'bar_chart',
        metricKeys: ['strain', 'active_calories'],
        windowDays: 7,
        title: 'Weekly Workouts',
      },
      {
        type: 'line_chart',
        metricKeys: ['hrv', 'body_weight'],
        windowDays: 30,
        title: 'Trends',
      },
      {
        type: 'sparkline',
        metricKeys: ['overtraining_risk'],
        windowDays: 14,
        title: 'Risk Monitor',
      },
    ];
  }

  private buildCoachingSummary(input: InsightInput): string {
    const parts: string[] = [];
    const recovery = input.twin.unifiedScores.find((s) => s.key === 'recovery_score');

    parts.push(`Client ${input.clientId} — Digital Twin v${input.twin.version}`);
    parts.push(`Recovery: ${recovery?.value ?? 'N/A'}% | Soreness: ${input.twin.recovery.sorenessLevel}/10`);

    if (input.predictions.length > 0) {
      parts.push(`Active predictions: ${input.predictions.map((p) => p.type).join(', ')}`);
    }
    if (input.anomalies.filter((a) => a.severity !== 'info').length > 0) {
      parts.push(
        `Alerts: ${input.anomalies
          .filter((a) => a.severity !== 'info')
          .map((a) => a.title)
          .join('; ')}`
      );
    }
    if (input.adaptations.length > 0) {
      parts.push(
        `Pending adaptations: ${input.adaptations.map((a) => a.description).join('; ')}`
      );
    }

    return parts.join('\n');
  }

  private scoreTitle(key: string): string {
    const titles: Record<string, string> = {
      recovery_score: 'Recovery Score',
      load_score: 'Training Load',
      body_comp_delta: 'Body Composition Change',
      overtraining_risk: 'Overtraining Risk',
    };
    return titles[key] ?? key;
  }

  private predictionTitle(type: string): string {
    const titles: Record<string, string> = {
      plateau: 'Plateau Forecast',
      overtraining: 'Overtraining Alert',
      supercompensation: 'Super-Compensation Window',
      body_comp_change: 'Body Composition Forecast',
      performance_trend: 'Performance Trend',
      injury_risk: 'Injury Risk',
    };
    return titles[type] ?? type;
  }
}

export const insightAgent = new InsightVisualizationAgent();
