/**
 * Wispr Voice Intent Types — MotionOS AI Coach
 */

export type WisprIntent =
  | 'im_sore'
  | 'knee_hurts'
  | 'back_tight'
  | 'injury_location_followup'
  | 'only_20_minutes'
  | 'quick_session'
  | 'traveling_this_week'
  | 'hotel_workout'
  | 'progress_check'
  | 'how_am_i_doing'
  | 'why_hrv_low'
  | 'why_tired'
  | 'what_to_eat'
  | 'craving_carbs'
  | 'log_sleep'
  | 'log_weight'
  | 'log_soreness'
  | 'build_program'
  | 'feeling_low_energy'
  | 'proactive_recovery'
  | 'confirm_adaptation'
  | 'adjust_tomorrow'
  | 'unknown';

export type IntentCategory =
  | 'health_soreness'
  | 'time_schedule'
  | 'travel_environment'
  | 'progress_check'
  | 'nutrition'
  | 'data_logging'
  | 'program_creation'
  | 'recovery_deep_dive'
  | 'proactive_coaching'
  | 'confirmation';

export type VoicePattern =
  | 'status_update_adaptation'      // Pattern A
  | 'constraint_based_planning'     // Pattern B
  | 'progress_motivation'           // Pattern C
  | 'deep_query'                    // Pattern D
  | 'proactive_coaching'            // Pattern E
  | 'multi_turn_clarification'
  | 'hybrid_confirm';

export type HermesAgentTarget =
  | 'ingestion-normalization'
  | 'digital-twin-modeler'
  | 'predictive-analytics'
  | 'recovery-adaptation'
  | 'anomaly-risk-detection'
  | 'insight-visualization'
  | 'workout-programming'
  | 'nutrition'
  | 'habit-coach'
  | 'progress-analyst'
  | 'builder-studio';

export interface ExtractedEntities {
  body_parts?: string[];
  available_minutes?: number;
  sleep_hours?: number;
  weight_kg?: number;
  soreness_level?: number;
  location?: 'gym' | 'hotel' | 'home' | 'outdoor';
  program_duration_weeks?: number;
  confirmation?: boolean;
}

export interface HermesRouting {
  supervisor: 'BioModelingSupervisor';
  triggered_agents: HermesAgentTarget[];
  downstream_actions: string[];
}

export interface VoiceOutput {
  spoken_response: string;
  visual_updates: Array<
    'workout_card' | 'recovery_gauge' | 'adaptation_card' | 'dashboard' | 'nutrition_card' | 'builder_studio'
  >;
  data_updates: string[];
  follow_up_prompt?: string;
}

export interface ConversationTurn {
  role: 'user' | 'coach';
  text: string;
  timestamp: string;
  intent?: WisprIntent;
}

export interface VoiceSessionState {
  session_id: string;
  client_id: string;
  active: boolean;
  pending_intent?: WisprIntent;
  awaiting_clarification: boolean;
  clarification_prompt?: string;
  turns: ConversationTurn[];
  extracted_entities: ExtractedEntities;
  mode: 'client' | 'coach';
  started_at: string;
  last_updated: string;
}

export interface WisprIntentResult {
  system: 'MotionOS_WisprIntent_v1.0';
  intent_id: WisprIntent;
  category: IntentCategory;
  pattern: VoicePattern;
  confidence: number;
  utterance: string;
  session_id: string;
  turn_index: number;
  awaiting_clarification: boolean;
  clarification_prompt?: string;
  extracted_entities: ExtractedEntities;
  hermes_routing: HermesRouting;
  output: VoiceOutput;
  multi_turn?: {
    active: boolean;
    pending_intent?: WisprIntent;
    turns: ConversationTurn[];
  };
}

export interface IntentDefinition {
  intent_id: WisprIntent;
  category: IntentCategory;
  pattern: VoicePattern;
  example_utterances: string[];
  keywords: string[];
  requires_clarification?: boolean;
  clarification_prompt?: string;
  hermes_routing: HermesRouting;
  spoken_response_template: string;
}
