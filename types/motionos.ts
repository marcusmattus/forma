/**
 * MotionOS Bio Tracking v1.0 — Core Data Contract
 * Mirrors schemas/motionos-bio-tracking.schema.json
 */

import type { WisprIntent } from '@/types/wispr';

export type { WisprIntent };

export type MenstrualPhase = 'follicular' | 'ovulation' | 'luteal' | 'menstrual' | null;

export type TwinStatus = 'active' | 'stale' | 'initializing' | 'halted';

export type AdaptationTrigger =
  | 'voice_intent'
  | 'hrv_drop'
  | 'soreness_spike'
  | 'prediction'
  | 'coach_override'
  | 'anomaly';

export interface MotionOSOrchestration {
  layer: 'Hermes';
  supervisor: 'BioModelingSupervisor';
  main_orchestrator: 'FitnessSupervisor';
  memory_store: 'HermesLongTermMemory';
  context_sharing: 'structured_context_passing';
  correlation_id?: string;
  pipeline_status?: 'idle' | 'running' | 'completed' | 'failed' | 'escalated';
}

export interface WisprVoiceLayer {
  provider: 'Wispr';
  session_id?: string;
  transcript?: string;
  detected_intent?: WisprIntent;
  confidence?: number;
  spoken_feedback?: string;
  capabilities: Array<
    | 'natural_language_updates'
    | 'real_time_adaptation_triggers'
    | 'spoken_coaching_feedback'
    | 'intent_detection'
  >;
}

export interface InjuryRecord {
  id: string;
  body_part: string;
  severity: 'low' | 'medium' | 'high';
  detected_at: string;
  source: 'anomaly' | 'voice' | 'coach' | 'self_report';
  resolved: boolean;
  restricted_movements?: string[];
}

export interface BioProfileStructural {
  weight_kg?: number;
  body_fat_pct?: number;
  muscle_mass_kg?: number;
  measurements?: Record<string, number>;
  progress_photos?: Array<{
    url: string;
    captured_at: string;
    body_comp_delta_pct?: number;
  }>;
}

export interface BioProfilePerformance {
  strength_trend?: number;
  weekly_volume_sets?: number;
  avg_rpe?: number;
  volume_tolerance_pct?: number;
  recent_prs?: string[];
  plateau_risk_pct?: number;
}

export interface BioProfileRecovery {
  hrv?: number;
  hrv_baseline?: number;
  sleep_score?: number;
  sleep_duration_hours?: number;
  sleep_debt_hours?: number;
  soreness?: number;
  stress?: number;
  resting_hr?: number;
  recovery_score?: number;
  readiness_score?: number;
}

export interface BioProfileContextual {
  injuries: InjuryRecord[];
  travel: boolean;
  menstrual_phase: MenstrualPhase;
  voice_notes: Array<{
    transcript: string;
    intent: WisprIntent;
    recorded_at: string;
  }>;
  active_constraints?: Array<{
    type: string;
    description: string;
    active: boolean;
    expires_at?: string;
    source: string;
  }>;
}

export interface BioProfile {
  structural: BioProfileStructural;
  performance: BioProfilePerformance;
  recovery: BioProfileRecovery;
  metabolic?: {
    estimated_tdee_kcal?: number;
    caloric_balance?: number;
    macro_adherence_pct?: number;
    hydration_level_pct?: number;
  };
  contextual: BioProfileContextual;
}

export interface MotionOSDigitalTwin {
  status: TwinStatus;
  version: number;
  last_synced: string;
  model_confidence: number;
  unified_scores: Array<{
    key: string;
    value: number;
    scale: string;
    confidence: number;
    explanation: string;
    computed_at: string;
  }>;
  predictions: Array<{
    id: string;
    type: string;
    confidence: number;
    timeline: string;
    description: string;
    actionable_by: string;
    recommended_actions: string[];
  }>;
  simulations: Array<{
    id: string;
    name: string;
    projected_outcome: Record<string, number>;
    confidence: number;
    influences_agents: string[];
  }>;
  trends?: Record<string, { slope: number; direction: string; window_days: number; confidence: number }>;
}

export interface AdaptationLogEntry {
  id: string;
  type: string;
  description: string;
  magnitude: 'minor' | 'moderate' | 'major';
  trigger: AdaptationTrigger;
  voice_intent?: WisprIntent;
  auto_applied: boolean;
  requires_coach_approval: boolean;
  coach_approved?: boolean | null;
  applied_at: string;
  affected_domains: Array<'workout' | 'nutrition' | 'recovery' | 'habits'>;
  safety_check_passed: boolean;
  medical_disclaimer_shown: boolean;
  rationale: string;
}

export interface FitnessProofingState {
  safety_mechanisms: {
    human_coach_override: boolean;
    medical_disclaimer_on_adaptations: boolean;
    progressive_overload_limits: {
      max_weekly_volume_increase_pct: number;
      max_intensity_increase_pct: number;
    };
    injury_history_weighting: number;
  };
  robustness: {
    offline_mode_fallback: boolean;
    data_validation: boolean;
    multi_source_cross_checking: boolean;
    confidence_scoring_on_all_predictions: boolean;
  };
  halt_training: boolean;
  blocked_adaptations: string[];
}

export interface DownstreamAction {
  target_agent: 'workout-programming' | 'nutrition' | 'habit-coach' | 'progress-analyst' | 'builder-studio' | 'coach';
  action_type: string;
  payload: Record<string, unknown>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requires_approval: boolean;
}

/** Root MotionOS Bio Tracking document */
export interface MotionOSBioDocument {
  system: 'MotionOS_BioTracking_v1.0';
  client_id: string;
  timestamp: string;
  orchestration: MotionOSOrchestration;
  voice_layer?: WisprVoiceLayer;
  bio_profile: BioProfile;
  digital_twin: MotionOSDigitalTwin;
  adaptation_log: AdaptationLogEntry[];
  fitness_proofing: FitnessProofingState;
  downstream_actions?: DownstreamAction[];
}

export const MOTIONOS_DESIGN_TOKENS = {
  primaryPurple: '#7C3AED',
  accentCyan: '#22D3EE',
  successGreen: '#22C55E',
  warnAmber: '#F59E0B',
  alertPink: '#F43F5E',
  bgPrimary: '#0F0F16',
  bgCard: '#1A1A2E',
  bgElevated: '#252540',
  textPrimary: '#F5F3FF',
  textDim: '#B8B4CC',
  textMute: '#6E6A86',
  fontDisplay: 'Satoshi, sans-serif',
} as const;
