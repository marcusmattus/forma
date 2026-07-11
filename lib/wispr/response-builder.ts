/**
 * Wispr Response Builder — templates + bio context interpolation
 */

import { getIntentDefinition } from '@/lib/wispr/intent-registry';
import type { IntentDetection } from '@/lib/wispr/intent-detector';
import type { VoiceSessionState, WisprIntentResult } from '@/types/wispr';

interface BioContext {
  recovery_score?: number;
  load_score?: number;
  hrv?: number;
  hrv_baseline?: number;
  sleep_hours?: number;
  sleep_debt?: number;
  body_comp_delta?: number;
  workouts_completed?: number;
  trend?: string;
  remaining_calories?: number;
}

const VISUAL_MAP: Record<string, WisprIntentResult['output']['visual_updates']> = {
  im_sore: ['adaptation_card', 'recovery_gauge', 'workout_card'],
  knee_hurts: ['adaptation_card', 'workout_card'],
  back_tight: ['adaptation_card', 'workout_card'],
  injury_location_followup: ['adaptation_card', 'workout_card'],
  only_20_minutes: ['workout_card'],
  quick_session: ['workout_card'],
  traveling_this_week: ['workout_card', 'dashboard'],
  hotel_workout: ['workout_card'],
  progress_check: ['dashboard', 'recovery_gauge'],
  how_am_i_doing: ['dashboard'],
  why_hrv_low: ['recovery_gauge', 'adaptation_card'],
  why_tired: ['recovery_gauge', 'nutrition_card'],
  what_to_eat: ['nutrition_card'],
  craving_carbs: ['nutrition_card'],
  log_sleep: ['recovery_gauge', 'dashboard'],
  log_weight: ['dashboard'],
  build_program: ['builder_studio'],
  feeling_low_energy: ['adaptation_card', 'recovery_gauge', 'nutrition_card'],
  proactive_recovery: ['recovery_gauge', 'adaptation_card'],
  confirm_adaptation: ['workout_card'],
  adjust_tomorrow: ['workout_card'],
  unknown: [],
};

export function buildIntentResponse(
  detection: IntentDetection,
  session: VoiceSessionState,
  bioContext?: BioContext
): WisprIntentResult {
  const definition = getIntentDefinition(detection.intent_id);
  const ctx = bioContext ?? {};

  if (!definition || detection.intent_id === 'unknown') {
    return {
      system: 'MotionOS_WisprIntent_v1.0',
      intent_id: 'unknown',
      category: 'health_soreness',
      pattern: 'status_update_adaptation',
      confidence: 0,
      utterance: detection.utterance,
      session_id: session.session_id,
      turn_index: session.turns.length,
      awaiting_clarification: false,
      extracted_entities: detection.entities,
      hermes_routing: {
        supervisor: 'BioModelingSupervisor',
        triggered_agents: ['insight-visualization'],
        downstream_actions: [],
      },
      output: {
        spoken_response:
          "I didn't quite catch that. Try telling me how you're feeling, or ask about your progress.",
        visual_updates: [],
        data_updates: [],
      },
    };
  }

  let spoken = definition.spoken_response_template;
  spoken = interpolate(spoken, {
    recovery_score: String(ctx.recovery_score ?? 68),
    load_score: String(ctx.load_score ?? 55),
    hrv: String(ctx.hrv ?? 52),
    hrv_vs_baseline: ctx.hrv && ctx.hrv_baseline
      ? `${Math.round((ctx.hrv / ctx.hrv_baseline) * 100)}% of baseline`
      : 'below baseline',
    sleep_hours: String(detection.entities.sleep_hours ?? ctx.sleep_hours ?? 6.2),
    sleep_debt: String(ctx.sleep_debt ?? 1.5),
    body_comp_delta: String(ctx.body_comp_delta ?? 0),
    workouts_completed: String(ctx.workouts_completed ?? 4),
    trend: ctx.trend ?? 'improving',
    remaining_calories: String(ctx.remaining_calories ?? 450),
    body_parts: detection.entities.body_parts?.join(' and ') ?? 'affected areas',
  });

  const followUp =
    detection.intent_id === 'im_sore' && !session.awaiting_clarification
      ? 'Want me to adjust tomorrow too?'
      : undefined;

  if (followUp) spoken += ` ${followUp}`;

  return {
    system: 'MotionOS_WisprIntent_v1.0',
    intent_id: detection.intent_id,
    category: definition.category,
    pattern: definition.pattern,
    confidence: detection.confidence,
    utterance: detection.utterance,
    session_id: session.session_id,
    turn_index: session.turns.length,
    awaiting_clarification: false,
    extracted_entities: { ...session.extracted_entities, ...detection.entities },
    hermes_routing: definition.hermes_routing,
    output: {
      spoken_response: spoken,
      visual_updates: VISUAL_MAP[detection.intent_id] ?? ['dashboard'],
      data_updates: definition.hermes_routing.downstream_actions,
      follow_up_prompt: followUp,
    },
    multi_turn: {
      active: session.turns.length > 1,
      turns: session.turns,
    },
  };
}

function interpolate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}
