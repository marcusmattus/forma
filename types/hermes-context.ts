/**
 * Hermes Context Router — Decision & Enriched Context Types
 * MotionOS Integration Layer
 */

import type { AgentId, AgentTier, AgentTrigger, OrchestrationTrace } from '@/types/agent';
import type { WisprIntent } from '@/types/wispr';

export type InputModality = 'voice' | 'wearable' | 'photo' | 'video' | 'manual' | 'text' | 'touch';

export type RoutingPriority = 'critical' | 'high' | 'normal' | 'low' | 'deferred';

export type ConflictResolution =
  | 'safety_overrides_performance'
  | 'coach_override_wins'
  | 'higher_confidence_wins'
  | 'merge_adaptations'
  | 'defer_to_human';

export interface MultimodalInput {
  modality: InputModality;
  client_id: string;
  session_id: string;
  timestamp: string;
  payload: MultimodalPayload;
  metadata?: Record<string, unknown>;
}

export type MultimodalPayload =
  | { type: 'voice'; transcript: string; wispr_session_id?: string }
  | { type: 'wearable'; source: string; readings: Array<{ key: string; value: number; unit?: string }> }
  | { type: 'photo'; url: string; category: 'progress' | 'form_check' | 'meal' }
  | { type: 'video'; url: string; category: 'form_check' | 'exercise_demo' }
  | { type: 'manual'; metric_key: string; value: number; unit?: string }
  | { type: 'text'; message: string }
  | { type: 'touch'; action: string; target: string; confirmed: boolean };

export interface HermesMemorySnapshot {
  client_id: string;
  snippets: string[];
  injury_flags: Array<{ body_part: string; severity: string; resolved: boolean }>;
  active_constraints: Array<{ type: string; description: string }>;
  preferences: Record<string, unknown>;
  adaptation_history_count: number;
  strength_history_summary?: string;
  recovery_patterns?: string;
  last_voice_intent?: import('@/types/wispr').WisprIntent;
}

export interface BioStateSnapshot {
  recovery_score?: number;
  load_score?: number;
  overtraining_risk?: number;
  hrv?: number;
  hrv_baseline?: number;
  sleep_debt_hours?: number;
  soreness_level?: number;
  twin_version?: number;
  twin_status?: string;
}

export interface EnrichedHermesContext {
  correlation_id: string;
  client_id: string;
  session_id: string;
  tier: AgentTier;
  trigger: AgentTrigger;
  timestamp: string;
  input_modality: InputModality;
  detected_intent?: WisprIntent | string;
  intent_confidence?: number;
  memory: HermesMemorySnapshot;
  bio_state: BioStateSnapshot;
  coach_override?: boolean;
  mode: 'client' | 'coach';
}

export interface AgentRoute {
  agent_id: AgentId;
  priority: RoutingPriority;
  reason: string;
  input_slice?: Record<string, unknown>;
  parallel_group?: number;
}

export interface SafetyGate {
  passed: boolean;
  halt_training: boolean;
  requires_coach_approval: boolean;
  blocked_actions: string[];
  medical_disclaimer_required: boolean;
  injury_aware_routing: boolean;
  confidence_floor: number;
}

export interface ConflictRecord {
  agents: AgentId[];
  conflict_type: string;
  resolution: ConflictResolution;
  winning_action?: string;
  rationale: string;
}

/** Core Context Router decision object */
export interface ContextRouterDecision {
  system: 'HermesContextRouter_v1.0';
  decision_id: string;
  correlation_id: string;
  created_at: string;
  enriched_context: EnrichedHermesContext;
  routing: {
    primary_supervisor: 'bio-modeling-supervisor' | 'hermes-fitness-supervisor';
    agent_routes: AgentRoute[];
    execution_plan: 'sequential' | 'parallel_bio_then_peers' | 'peer_only';
  };
  safety: SafetyGate;
  conflicts_resolved: ConflictRecord[];
  multimodal_handoff?: {
    from: InputModality;
    suggested_next: InputModality[];
    pending_confirmation: boolean;
  };
  observability: {
    router_latency_ms: number;
    memory_entries_loaded: number;
    intent_detection_ms?: number;
  };
}

export interface HermesIntegrationResult {
  decision: ContextRouterDecision;
  bio_pipeline?: unknown;
  peer_results: Record<string, unknown>;
  spoken_feedback?: string;
  visual_updates: string[];
  actions: import('@/types/agent').AgentAction[];
  traces: OrchestrationTrace[];
  document?: unknown;
  message: string;
}

export interface CoachOverride {
  client_id: string;
  coach_id: string;
  action: 'approve' | 'reject' | 'modify';
  adaptation_id: string;
  modification?: Record<string, unknown>;
  timestamp: string;
}
