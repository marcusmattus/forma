/**
 * Anomaly & Risk Detection Agent
 * Flags unusual patterns, injury risks, and escalates appropriately
 */

import { BaseAgent } from '@/lib/hermes/agent-base';
import type { AgentAction, AgentContext } from '@/types/agent';
import type { AnomalyAlert, BioReading, DigitalTwinState } from '@/types/bio';

export interface AnomalyInput {
  clientId: string;
  twin: DigitalTwinState;
  readings: BioReading[];
}

export interface AnomalyResult {
  anomalies: AnomalyAlert[];
  escalations: AgentAction[];
  shouldHaltTraining: boolean;
}

export class AnomalyRiskAgent extends BaseAgent<AnomalyInput, AnomalyResult> {
  id = 'anomaly-risk-detection' as const;
  name = 'Anomaly & Risk Detection Agent';
  description = 'Detects unusual patterns, injury risks, and health anomalies';
  tier = 'pro' as const;

  async run(input: AnomalyInput, ctx: AgentContext): Promise<AnomalyResult> {
    const anomalies: AnomalyAlert[] = [];

    anomalies.push(...this.detectHRVAnomalies(input.twin, input.readings));
    anomalies.push(...this.detectSleepAnomalies(input.twin, input.readings));
    anomalies.push(...this.detectHeartRateAnomalies(input.readings));
    anomalies.push(...this.detectInjuryRisk(input.twin));
    anomalies.push(...this.detectDataQuality(input.readings));

    const critical = anomalies.filter((a) => a.severity === 'critical');
    const escalations: AgentAction[] = critical.map((a) => ({
      type: 'escalate_anomaly',
      target: 'coach',
      payload: a,
      requiresApproval: false,
      priority: 'critical' as const,
    }));

    const shouldHaltTraining = critical.some(
      (a) => a.category === 'health' || a.category === 'injury_risk'
    );

    return { anomalies, escalations, shouldHaltTraining };
  }

  private detectHRVAnomalies(twin: DigitalTwinState, readings: BioReading[]): AnomalyAlert[] {
    const alerts: AnomalyAlert[] = [];
    const hrvReadings = readings.filter((r) => r.metricKey === 'hrv');
    if (hrvReadings.length === 0) return alerts;

    const latest = hrvReadings.sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    )[0];
    const baseline = twin.recovery.hrvBaseline ?? twin.baselines.hrv;

    if (baseline && latest.value < baseline * 0.7) {
      alerts.push({
        id: `anom_hrv_${Date.now()}`,
        severity: 'warning',
        category: 'pattern',
        title: 'HRV Significantly Below Baseline',
        description: `Current HRV (${latest.value}ms) is >30% below baseline (${baseline}ms). May indicate illness, overtraining, or poor recovery.`,
        detectedAt: new Date().toISOString(),
        escalated: false,
        metrics: ['hrv'],
      });
    }

    if (baseline && latest.value < baseline * 0.5) {
      alerts.push({
        id: `anom_hrv_crit_${Date.now()}`,
        severity: 'critical',
        category: 'health',
        title: 'Critical HRV Drop',
        description: `HRV at ${latest.value}ms is 50%+ below baseline. Recommend rest and medical consultation if persistent.`,
        detectedAt: new Date().toISOString(),
        escalated: true,
        metrics: ['hrv'],
      });
    }

    return alerts;
  }

  private detectSleepAnomalies(twin: DigitalTwinState, readings: BioReading[]): AnomalyAlert[] {
    const alerts: AnomalyAlert[] = [];
    const sleepReadings = readings.filter((r) => r.metricKey === 'sleep_duration');

    if (sleepReadings.length >= 3) {
      const recent = sleepReadings.slice(-3);
      const allLow = recent.every((r) => r.value < 5);
      if (allLow) {
        alerts.push({
          id: `anom_sleep_${Date.now()}`,
          severity: 'warning',
          category: 'pattern',
          title: 'Chronic Sleep Deprivation',
          description: 'Sleep below 5 hours for 3+ consecutive days. Recovery and performance will be compromised.',
          detectedAt: new Date().toISOString(),
          escalated: false,
          metrics: ['sleep_duration'],
        });
      }
    }

    if (twin.recovery.sleepDebtHours > 10) {
      alerts.push({
        id: `anom_sleepdebt_${Date.now()}`,
        severity: 'warning',
        category: 'pattern',
        title: 'Severe Sleep Debt',
        description: `Accumulated sleep debt: ${twin.recovery.sleepDebtHours}h. Prioritize recovery.`,
        detectedAt: new Date().toISOString(),
        escalated: false,
        metrics: ['sleep_duration'],
      });
    }

    return alerts;
  }

  private detectHeartRateAnomalies(readings: BioReading[]): AnomalyAlert[] {
    const alerts: AnomalyAlert[] = [];
    const rhr = readings.filter((r) => r.metricKey === 'resting_hr');
    if (rhr.length < 2) return alerts;

    const latest = rhr.sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    )[0];
    const previous = rhr.sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    )[1];

    if (latest.value > previous.value * 1.15 && latest.value > 80) {
      alerts.push({
        id: `anom_rhr_${Date.now()}`,
        severity: 'warning',
        category: 'health',
        title: 'Elevated Resting Heart Rate',
        description: `RHR jumped from ${previous.value} to ${latest.value} bpm. May indicate illness or overtraining.`,
        detectedAt: new Date().toISOString(),
        escalated: false,
        metrics: ['resting_hr'],
      });
    }

    return alerts;
  }

  private detectInjuryRisk(twin: DigitalTwinState): AnomalyAlert[] {
    const alerts: AnomalyAlert[] = [];

    for (const flag of twin.injuryFlags.filter((f) => !f.resolved)) {
      if (flag.severity === 'high') {
        alerts.push({
          id: `anom_inj_${flag.id}`,
          severity: 'critical',
          category: 'injury_risk',
          title: `Active Injury: ${flag.bodyPart}`,
          description: `High-severity injury flag active since ${flag.detectedAt}. Training modifications required.`,
          detectedAt: new Date().toISOString(),
          escalated: true,
          metrics: [],
        });
      }
    }

    if (twin.recovery.sorenessLevel > 8 && twin.performance.volumeTolerance < 30) {
      alerts.push({
        id: `anom_inj_risk_${Date.now()}`,
        severity: 'warning',
        category: 'injury_risk',
        title: 'Elevated Injury Risk',
        description: 'High soreness combined with low volume tolerance suggests injury risk.',
        detectedAt: new Date().toISOString(),
        escalated: false,
        metrics: ['soreness'],
      });
    }

    return alerts;
  }

  private detectDataQuality(readings: BioReading[]): AnomalyAlert[] {
    const alerts: AnomalyAlert[] = [];
    const lowConfidence = readings.filter((r) => r.confidence < 0.3);

    if (lowConfidence.length > readings.length * 0.5 && readings.length > 0) {
      alerts.push({
        id: `anom_dq_${Date.now()}`,
        severity: 'info',
        category: 'data_quality',
        title: 'Low Data Confidence',
        description: `${lowConfidence.length}/${readings.length} readings have low confidence. Consider manual verification.`,
        detectedAt: new Date().toISOString(),
        escalated: false,
        metrics: [],
      });
    }

    return alerts;
  }
}

export const anomalyAgent = new AnomalyRiskAgent();
