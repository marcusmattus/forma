/**
 * Bio Score Normalization — unified metric computation
 */

import type {
  BioMetricKey,
  BioReading,
  DigitalTwinState,
  TrendVector,
  UnifiedScore,
  UnifiedScoreKey,
} from '@/types/bio';

const METRIC_RANGES: Partial<Record<BioMetricKey, { min: number; max: number }>> = {
  hrv: { min: 20, max: 120 },
  resting_hr: { min: 40, max: 100 },
  sleep_duration: { min: 4, max: 10 },
  sleep_score: { min: 0, max: 100 },
  steps: { min: 0, max: 20000 },
  soreness: { min: 0, max: 10 },
  stress: { min: 0, max: 10 },
  body_weight: { min: 40, max: 200 },
  body_fat_pct: { min: 5, max: 50 },
  readiness: { min: 0, max: 100 },
  recovery_score: { min: 0, max: 100 },
  strain: { min: 0, max: 21 },
};

export function normalizeToScale(value: number, key: BioMetricKey): number {
  const range = METRIC_RANGES[key];
  if (!range) return Math.min(100, Math.max(0, value));
  const normalized = ((value - range.min) / (range.max - range.min)) * 100;
  return Math.min(100, Math.max(0, normalized));
}

export function computeTrend(readings: BioReading[], windowDays = 7): TrendVector {
  if (readings.length < 2) {
    return { slope: 0, direction: 'stable', windowDays, confidence: 0.2 };
  }

  const sorted = [...readings].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );
  const n = sorted.length;
  const xMean = (n - 1) / 2;
  const yMean = sorted.reduce((s, r) => s + r.value, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (sorted[i].value - yMean);
    denominator += (i - xMean) ** 2;
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const direction: TrendVector['direction'] =
    slope > 0.05 ? 'improving' : slope < -0.05 ? 'declining' : 'stable';

  return {
    slope,
    direction,
    windowDays,
    confidence: Math.min(0.95, 0.3 + n * 0.1),
  };
}

export function getLatestReading(
  readings: BioReading[],
  key: BioMetricKey
): BioReading | undefined {
  return readings
    .filter((r) => r.metricKey === key)
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0];
}

export function computeRecoveryScore(readings: BioReading[], twin: DigitalTwinState): UnifiedScore {
  const hrv = getLatestReading(readings, 'hrv');
  const sleep = getLatestReading(readings, 'sleep_score');
  const soreness = getLatestReading(readings, 'soreness');
  const readiness = getLatestReading(readings, 'readiness');

  const components: number[] = [];
  const inputs: string[] = [];

  if (hrv) {
    const hrvScore = normalizeToScale(hrv.value, 'hrv');
    const baseline = twin.baselines.hrv ?? hrv.value;
    const hrvRatio = baseline > 0 ? (hrv.value / baseline) * 50 : hrvScore;
    components.push(Math.min(100, hrvRatio));
    inputs.push('hrv');
  }
  if (sleep) {
    components.push(normalizeToScale(sleep.value, 'sleep_score'));
    inputs.push('sleep_score');
  }
  if (soreness) {
    components.push(100 - normalizeToScale(soreness.value, 'soreness'));
    inputs.push('soreness');
  }
  if (readiness) {
    components.push(normalizeToScale(readiness.value, 'readiness'));
    inputs.push('readiness');
  }

  const value =
    components.length > 0 ? components.reduce((a, b) => a + b, 0) / components.length : 50;

  return {
    key: 'recovery_score',
    value: Math.round(value),
    scale: '0-100',
    confidence: inputs.length > 0 ? Math.min(0.9, 0.3 + inputs.length * 0.15) : 0.2,
    computedAt: new Date().toISOString(),
    inputs,
    explanation: `Recovery score based on ${inputs.join(', ') || 'defaults'}. Higher = better readiness.`,
  };
}

export function computeLoadScore(readings: BioReading[]): UnifiedScore {
  const strain = getLatestReading(readings, 'strain');
  const steps = getLatestReading(readings, 'steps');
  const activeCal = getLatestReading(readings, 'active_calories');

  const components: number[] = [];
  const inputs: string[] = [];

  if (strain) {
    components.push(normalizeToScale(strain.value, 'strain'));
    inputs.push('strain');
  }
  if (steps) {
    components.push(normalizeToScale(steps.value, 'steps'));
    inputs.push('steps');
  }
  if (activeCal) {
    components.push(Math.min(100, (activeCal.value / 800) * 100));
    inputs.push('active_calories');
  }

  const value =
    components.length > 0 ? components.reduce((a, b) => a + b, 0) / components.length : 30;

  return {
    key: 'load_score',
    value: Math.round(value),
    scale: '0-100',
    confidence: inputs.length > 0 ? Math.min(0.85, 0.3 + inputs.length * 0.15) : 0.2,
    computedAt: new Date().toISOString(),
    inputs,
    explanation: `Training load derived from ${inputs.join(', ') || 'estimated activity'}.`,
  };
}

export function computeBodyCompDelta(readings: BioReading[], twin: DigitalTwinState): UnifiedScore {
  const weight = getLatestReading(readings, 'body_weight');
  const bodyFat = getLatestReading(readings, 'body_fat_pct');
  const baselineWeight = twin.baselines.body_weight;

  let delta = 0;
  const inputs: string[] = [];

  if (weight && baselineWeight) {
    delta = ((weight.value - baselineWeight) / baselineWeight) * 100;
    inputs.push('body_weight');
  }
  if (bodyFat) {
    const baselineBF = twin.baselines.body_fat_pct;
    if (baselineBF) {
      delta = (delta + (bodyFat.value - baselineBF)) / 2;
      inputs.push('body_fat_pct');
    }
  }

  return {
    key: 'body_comp_delta',
    value: Math.round(delta * 10) / 10,
    scale: 'delta',
    confidence: inputs.length > 0 ? 0.7 : 0.1,
    computedAt: new Date().toISOString(),
    inputs,
    explanation: `Body composition change vs baseline (${inputs.join(', ') || 'no data'}).`,
  };
}

export function computeOvertrainingRisk(
  recovery: UnifiedScore,
  load: UnifiedScore,
  twin: DigitalTwinState
): UnifiedScore {
  const loadRecoveryRatio = load.value / Math.max(recovery.value, 1);
  const sorenessBoost = twin.recovery.sorenessLevel > 7 ? 15 : 0;
  const sleepDebtBoost = twin.recovery.sleepDebtHours > 5 ? 10 : 0;

  const risk = Math.min(100, loadRecoveryRatio * 40 + sorenessBoost + sleepDebtBoost);

  return {
    key: 'overtraining_risk',
    value: Math.round(risk),
    scale: '0-100',
    confidence: 0.75,
    computedAt: new Date().toISOString(),
    inputs: ['recovery_score', 'load_score', 'soreness', 'sleep_debt'],
    explanation:
      risk > 70
        ? 'Elevated overtraining risk — consider deload or extra recovery.'
        : risk > 40
          ? 'Moderate load-recovery imbalance detected.'
          : 'Load and recovery appear balanced.',
  };
}

export function computeAllUnifiedScores(
  readings: BioReading[],
  twin: DigitalTwinState
): UnifiedScore[] {
  const recovery = computeRecoveryScore(readings, twin);
  const load = computeLoadScore(readings);
  const bodyComp = computeBodyCompDelta(readings, twin);
  const overtraining = computeOvertrainingRisk(recovery, load, twin);

  return [recovery, load, bodyComp, overtraining];
}

export function createEmptyTwin(clientId: string): DigitalTwinState {
  return {
    clientId,
    version: 1,
    updatedAt: new Date().toISOString(),
    structural: {
      weight: null,
      bodyFatPct: null,
      muscleMass: null,
      measurements: {},
      photoProgressDelta: null,
      lastUpdated: new Date().toISOString(),
    },
    performance: {
      strengthTrend: 0,
      volumeTolerance: 50,
      recentPRs: [],
      plateauRisk: 0,
      lastUpdated: new Date().toISOString(),
    },
    recovery: {
      hrvBaseline: null,
      hrvCurrent: null,
      sleepDebtHours: 0,
      sorenessLevel: 0,
      stressLevel: 0,
      readinessScore: 50,
      lastUpdated: new Date().toISOString(),
    },
    metabolic: {
      estimatedTDEE: null,
      caloricBalance: null,
      macroAdherence: 0,
      hydrationLevel: null,
      lastUpdated: new Date().toISOString(),
    },
    unifiedScores: [],
    baselines: {} as Record<BioMetricKey, number>,
    trends: {} as Record<BioMetricKey, TrendVector>,
    constraints: [],
    injuryFlags: [],
  };
}
