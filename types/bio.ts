/**
 * Bio Tracking & Digital Twin — Domain Types
 * MotionOS / Hermes Fit
 */

export type BioSource =
  | 'oura'
  | 'whoop'
  | 'apple_health'
  | 'garmin'
  | 'fitbit'
  | 'manual'
  | 'voice'
  | 'progress_photo'
  | 'coach_entry'
  | 'lab'
  | 'smart_scale';

export type BioMetricKey =
  | 'hrv'
  | 'resting_hr'
  | 'sleep_duration'
  | 'sleep_score'
  | 'deep_sleep_pct'
  | 'rem_sleep_pct'
  | 'steps'
  | 'active_calories'
  | 'strain'
  | 'recovery_score'
  | 'body_weight'
  | 'body_fat_pct'
  | 'muscle_mass'
  | 'soreness'
  | 'stress'
  | 'readiness'
  | 'vo2_max'
  | 'blood_pressure_systolic'
  | 'blood_pressure_diastolic'
  | 'hydration'
  | 'custom';

export type UnifiedScoreKey =
  | 'recovery_score'
  | 'load_score'
  | 'body_comp_delta'
  | 'readiness_score'
  | 'sleep_quality_score'
  | 'stress_load_score'
  | 'performance_trend'
  | 'overtraining_risk'
  | 'supercompensation_window';

export interface BioMetricDefinition {
  key: BioMetricKey;
  displayName: string;
  unit: string;
  minValue?: number;
  maxValue?: number;
  sources: BioSource[];
  category: 'recovery' | 'performance' | 'structural' | 'metabolic' | 'subjective';
}

export interface BioReading {
  id: string;
  clientId: string;
  metricKey: BioMetricKey;
  value: number;
  unit: string;
  source: BioSource;
  recordedAt: string;
  ingestedAt: string;
  confidence: number;
  rawPayload?: Record<string, unknown>;
  normalized: boolean;
}

export interface UnifiedScore {
  key: UnifiedScoreKey;
  value: number;
  scale: '0-100' | 'delta' | 'trend';
  confidence: number;
  computedAt: string;
  inputs: string[];
  explanation: string;
}

export interface DigitalTwinState {
  clientId: string;
  version: number;
  updatedAt: string;
  structural: StructuralProfile;
  performance: PerformanceProfile;
  recovery: RecoveryProfile;
  metabolic: MetabolicProfile;
  unifiedScores: UnifiedScore[];
  baselines: Record<BioMetricKey, number>;
  trends: Record<BioMetricKey, TrendVector>;
  constraints: TwinConstraint[];
  injuryFlags: InjuryFlag[];
}

export interface StructuralProfile {
  weight: number | null;
  bodyFatPct: number | null;
  muscleMass: number | null;
  measurements: Record<string, number>;
  photoProgressDelta: number | null;
  lastUpdated: string;
}

export interface PerformanceProfile {
  strengthTrend: number;
  volumeTolerance: number;
  recentPRs: string[];
  plateauRisk: number;
  lastUpdated: string;
}

export interface RecoveryProfile {
  hrvBaseline: number | null;
  hrvCurrent: number | null;
  sleepDebtHours: number;
  sorenessLevel: number;
  stressLevel: number;
  readinessScore: number;
  lastUpdated: string;
}

export interface MetabolicProfile {
  estimatedTDEE: number | null;
  caloricBalance: number | null;
  macroAdherence: number;
  hydrationLevel: number | null;
  lastUpdated: string;
}

export interface TrendVector {
  slope: number;
  direction: 'improving' | 'stable' | 'declining';
  windowDays: number;
  confidence: number;
}

export interface TwinConstraint {
  type: 'injury' | 'travel' | 'equipment' | 'time' | 'preference' | 'medical';
  description: string;
  active: boolean;
  expiresAt?: string;
  source: BioSource | 'coach' | 'voice';
}

export interface InjuryFlag {
  id: string;
  bodyPart: string;
  severity: 'low' | 'medium' | 'high';
  detectedAt: string;
  source: 'anomaly' | 'voice' | 'coach' | 'self_report';
  resolved: boolean;
}

export interface Prediction {
  id: string;
  type:
    | 'plateau'
    | 'overtraining'
    | 'supercompensation'
    | 'body_comp_change'
    | 'performance_trend'
    | 'injury_risk';
  confidence: number;
  timeline: string;
  description: string;
  actionableBy: string;
  recommendedActions: string[];
}

export interface AdaptationRecommendation {
  id: string;
  type: 'volume' | 'intensity' | 'exercise_swap' | 'deload' | 'nutrition' | 'recovery' | 'schedule';
  description: string;
  magnitude: 'minor' | 'moderate' | 'major';
  autoApply: boolean;
  requiresCoachApproval: boolean;
  rationale: string;
  affectedDomains: ('workout' | 'nutrition' | 'recovery' | 'habits')[];
}

export interface AnomalyAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  category: 'pattern' | 'injury_risk' | 'health' | 'data_quality';
  title: string;
  description: string;
  detectedAt: string;
  escalated: boolean;
  metrics: BioMetricKey[];
}

export interface BioInsight {
  id: string;
  audience: 'client' | 'coach' | 'both';
  category: 'summary' | 'trend' | 'prediction' | 'recommendation' | 'alert';
  title: string;
  body: string;
  visualizations?: VisualizationSpec[];
  generatedAt: string;
  tier: 'free' | 'pro';
}

export interface VisualizationSpec {
  type: 'ring' | 'bar_chart' | 'line_chart' | 'sparkline' | 'heatmap';
  metricKeys: (BioMetricKey | UnifiedScoreKey)[];
  windowDays: number;
  title: string;
}

export interface WhatIfScenario {
  id: string;
  name: string;
  changes: WhatIfChange[];
  projectedOutcome: Record<UnifiedScoreKey, number>;
  confidence: number;
}

export interface WhatIfChange {
  variable: string;
  currentValue: number;
  proposedValue: number;
  durationDays: number;
}

export interface BioTrackingContext {
  clientId: string;
  twin: DigitalTwinState;
  recentReadings: BioReading[];
  predictions: Prediction[];
  adaptations: AdaptationRecommendation[];
  anomalies: AnomalyAlert[];
  insights: BioInsight[];
  memorySnippets: string[];
}

export interface IngestPayload {
  clientId: string;
  source: BioSource;
  readings: Array<{
    metricKey: BioMetricKey;
    value: number;
    unit?: string;
    recordedAt?: string;
    rawPayload?: Record<string, unknown>;
  }>;
  voiceTranscript?: string;
}

export interface VoiceAdaptationRequest {
  clientId: string;
  transcript: string;
  sessionId: string;
}
