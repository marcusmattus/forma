/**
 * Wispr Intent Registry — all voice commands + Hermes routing
 */

import type { IntentDefinition, WisprIntent } from '@/types/wispr';

export const INTENT_REGISTRY: IntentDefinition[] = [
  {
    intent_id: 'im_sore',
    category: 'health_soreness',
    pattern: 'status_update_adaptation',
    example_utterances: ["I'm sore", "I'm sore today", "Feeling achy"],
    keywords: ['sore', 'aching', 'achy', 'stiff'],
    requires_clarification: true,
    clarification_prompt: 'Where exactly are you sore?',
    hermes_routing: {
      supervisor: 'BioModelingSupervisor',
      triggered_agents: ['ingestion-normalization', 'recovery-adaptation', 'workout-programming'],
      downstream_actions: ['modify_workout', 'log_soreness'],
    },
    spoken_response_template:
      "Got it. I've reduced volume and added mobility work. Your recovery score is now {recovery_score}. Want me to adjust tomorrow too?",
  },
  {
    intent_id: 'knee_hurts',
    category: 'health_soreness',
    pattern: 'status_update_adaptation',
    example_utterances: ['My knee hurts', 'Knee pain', 'Bad knee today'],
    keywords: ['knee', 'knees hurt', 'knee pain'],
    hermes_routing: {
      supervisor: 'BioModelingSupervisor',
      triggered_agents: ['ingestion-normalization', 'recovery-adaptation', 'anomaly-risk-detection', 'workout-programming'],
      downstream_actions: ['remove_squats', 'flag_injury', 'coach_escalation'],
    },
    spoken_response_template:
      "I've reduced lower-body volume and swapped squats for Romanian deadlifts. Your coach will review. Recovery score: {recovery_score}.",
  },
  {
    intent_id: 'back_tight',
    category: 'health_soreness',
    pattern: 'status_update_adaptation',
    example_utterances: ['Back is tight', 'Lower back sore', 'My back hurts'],
    keywords: ['back', 'lower back', 'spine'],
    hermes_routing: {
      supervisor: 'BioModelingSupervisor',
      triggered_agents: ['ingestion-normalization', 'recovery-adaptation', 'workout-programming'],
      downstream_actions: ['reduce_spinal_load', 'add_mobility'],
    },
    spoken_response_template:
      "Back tightness noted. I've removed heavy deadlifts and added cat-cow and bird-dog warmups.",
  },
  {
    intent_id: 'injury_location_followup',
    category: 'health_soreness',
    pattern: 'multi_turn_clarification',
    example_utterances: ['Quads and lower back', 'Just my shoulders', 'Hamstrings'],
    keywords: ['quads', 'hamstrings', 'shoulders', 'lower back', 'glutes', 'calves', 'arms'],
    hermes_routing: {
      supervisor: 'BioModelingSupervisor',
      triggered_agents: ['recovery-adaptation', 'workout-programming'],
      downstream_actions: ['targeted_exercise_swap'],
    },
    spoken_response_template:
      "Thanks — I've applied targeted adaptations for {body_parts}. Avoid aggravating movements today.",
  },
  {
    intent_id: 'only_20_minutes',
    category: 'time_schedule',
    pattern: 'constraint_based_planning',
    example_utterances: ['I only have 20 minutes', '20 min workout', 'Quick session'],
    keywords: ['20 minutes', '20 min', 'only have', 'short on time'],
    hermes_routing: {
      supervisor: 'BioModelingSupervisor',
      triggered_agents: ['digital-twin-modeler', 'recovery-adaptation', 'workout-programming'],
      downstream_actions: ['compress_workout'],
    },
    spoken_response_template:
      "20-minute power session ready — supersets, minimal rest. Visual workout updated on your screen.",
  },
  {
    intent_id: 'quick_session',
    category: 'time_schedule',
    pattern: 'constraint_based_planning',
    example_utterances: ['Quick workout', 'Short session', 'Pressed for time'],
    keywords: ['quick', 'short session', 'pressed for time'],
    hermes_routing: {
      supervisor: 'BioModelingSupervisor',
      triggered_agents: ['workout-programming'],
      downstream_actions: ['compress_workout'],
    },
    spoken_response_template: "Compressed session generated based on your current recovery. Check the workout card.",
  },
  {
    intent_id: 'traveling_this_week',
    category: 'travel_environment',
    pattern: 'constraint_based_planning',
    example_utterances: ["I'm traveling this week", 'On the road', 'Away from gym'],
    keywords: ['travel', 'travelling', 'hotel', 'away', 'on the road'],
    hermes_routing: {
      supervisor: 'BioModelingSupervisor',
      triggered_agents: ['recovery-adaptation', 'workout-programming', 'habit-coach'],
      downstream_actions: ['generate_travel_workout'],
    },
    spoken_response_template:
      "Travel mode on. Hotel-friendly bodyweight program loaded. Bio model checked your energy — you're good for moderate intensity.",
  },
  {
    intent_id: 'hotel_workout',
    category: 'travel_environment',
    pattern: 'constraint_based_planning',
    example_utterances: ['Hotel workout', 'No gym available', 'Workout in my room'],
    keywords: ['hotel workout', 'no gym', 'my room'],
    hermes_routing: {
      supervisor: 'BioModelingSupervisor',
      triggered_agents: ['workout-programming'],
      downstream_actions: ['generate_travel_workout'],
    },
    spoken_response_template: "Hotel workout ready — zero equipment, 30 minutes, full body.",
  },
  {
    intent_id: 'progress_check',
    category: 'progress_check',
    pattern: 'progress_motivation',
    example_utterances: ['How am I doing?', "How's my progress?", 'Update me'],
    keywords: ['how am i doing', 'how is my progress', 'update me', 'progress'],
    hermes_routing: {
      supervisor: 'BioModelingSupervisor',
      triggered_agents: ['insight-visualization', 'digital-twin-modeler', 'progress-analyst'],
      downstream_actions: ['update_dashboard'],
    },
    spoken_response_template:
      "This week: {workouts_completed} workouts, recovery averaging {recovery_score}. Strength trend is {trend}. Dashboard updated.",
  },
  {
    intent_id: 'how_am_i_doing',
    category: 'progress_check',
    pattern: 'progress_motivation',
    example_utterances: ['Am I on track?', 'Give me a summary'],
    keywords: ['on track', 'summary', 'how am i'],
    hermes_routing: {
      supervisor: 'BioModelingSupervisor',
      triggered_agents: ['insight-visualization', 'progress-analyst'],
      downstream_actions: ['spoken_summary', 'update_dashboard'],
    },
    spoken_response_template:
      "You're on track. Recovery {recovery_score}%, load balanced, sleep debt {sleep_debt}h. Keep it up.",
  },
  {
    intent_id: 'why_hrv_low',
    category: 'recovery_deep_dive',
    pattern: 'deep_query',
    example_utterances: ['Why is my HRV low?', 'HRV dropped', 'Heart rate variability'],
    keywords: ['hrv', 'heart rate variability', 'hrv low', 'hrv dropped'],
    hermes_routing: {
      supervisor: 'BioModelingSupervisor',
      triggered_agents: ['predictive-analytics', 'recovery-adaptation', 'insight-visualization'],
      downstream_actions: ['explain_metric', 'recommend_recovery'],
    },
    spoken_response_template:
      "HRV is {hrv}% below baseline. Likely causes: {sleep_debt}h sleep debt, recent high load. I recommend an extra rest day and earlier bedtime.",
  },
  {
    intent_id: 'why_tired',
    category: 'recovery_deep_dive',
    pattern: 'deep_query',
    example_utterances: ['Why am I tired?', 'Why do I feel exhausted?'],
    keywords: ['why am i tired', 'why tired', 'feel exhausted', 'why exhausted'],
    hermes_routing: {
      supervisor: 'BioModelingSupervisor',
      triggered_agents: ['predictive-analytics', 'recovery-adaptation', 'nutrition'],
      downstream_actions: ['explain_recovery', 'check_nutrition'],
    },
    spoken_response_template:
      "Fatigue factors: sleep {sleep_hours}h, HRV {hrv_vs_baseline}, training load {load_score}. Consider deload or nutrition check.",
  },
  {
    intent_id: 'what_to_eat',
    category: 'nutrition',
    pattern: 'deep_query',
    example_utterances: ['What should I eat?', 'Meal ideas', 'Post-workout food'],
    keywords: ['what should i eat', 'meal ideas', 'what to eat', 'post workout food'],
    hermes_routing: {
      supervisor: 'BioModelingSupervisor',
      triggered_agents: ['nutrition', 'digital-twin-modeler'],
      downstream_actions: ['meal_suggestions'],
    },
    spoken_response_template:
      "Based on today's workout and {remaining_calories} kcal remaining: lean protein + complex carbs. Nutrition card updated.",
  },
  {
    intent_id: 'craving_carbs',
    category: 'nutrition',
    pattern: 'status_update_adaptation',
    example_utterances: ["I'm craving carbs", 'Want something sweet', 'Need carbs'],
    keywords: ['craving carbs', 'craving sugar', 'want carbs', 'something sweet'],
    hermes_routing: {
      supervisor: 'BioModelingSupervisor',
      triggered_agents: ['nutrition', 'digital-twin-modeler'],
      downstream_actions: ['adjust_macros', 'meal_suggestions'],
    },
    spoken_response_template:
      "Carb craving may signal under-fueling after training. I've suggested a balanced meal — check nutrition card.",
  },
  {
    intent_id: 'log_sleep',
    category: 'data_logging',
    pattern: 'status_update_adaptation',
    example_utterances: ['I slept 8 hours', 'Got 6 hours sleep', 'Slept badly'],
    keywords: ['slept', 'sleep', 'hours sleep'],
    hermes_routing: {
      supervisor: 'BioModelingSupervisor',
      triggered_agents: ['ingestion-normalization', 'digital-twin-modeler'],
      downstream_actions: ['log_bio_metric'],
    },
    spoken_response_template: "Logged {sleep_hours} hours of sleep. Recovery score updated to {recovery_score}.",
  },
  {
    intent_id: 'log_weight',
    category: 'data_logging',
    pattern: 'status_update_adaptation',
    example_utterances: ['Weighed 82kg', 'I weigh 180 pounds', 'Scale says 78.5'],
    keywords: ['weighed', 'weigh', 'kg', 'pounds', 'scale'],
    hermes_routing: {
      supervisor: 'BioModelingSupervisor',
      triggered_agents: ['ingestion-normalization', 'digital-twin-modeler'],
      downstream_actions: ['log_bio_metric'],
    },
    spoken_response_template: "Logged {weight_kg}kg. Body comp trend: {body_comp_delta}%.",
  },
  {
    intent_id: 'build_program',
    category: 'program_creation',
    pattern: 'constraint_based_planning',
    example_utterances: ['Build me a 4 week plan', 'Create a muscle program', '12 week program for women over 40'],
    keywords: ['build me', 'create a', 'week plan', 'week program', 'generate program'],
    hermes_routing: {
      supervisor: 'BioModelingSupervisor',
      triggered_agents: ['builder-studio', 'digital-twin-modeler'],
      downstream_actions: ['generate_program'],
    },
    spoken_response_template:
      "Opening Builder Studio with your bio profile. I'll factor in recovery, injuries, and goals. Describe any specifics?",
  },
  {
    intent_id: 'feeling_low_energy',
    category: 'health_soreness',
    pattern: 'status_update_adaptation',
    example_utterances: ['Low energy', 'No energy today', 'Feeling drained'],
    keywords: ['low energy', 'no energy', 'drained', 'wiped out', 'exhausted'],
    hermes_routing: {
      supervisor: 'BioModelingSupervisor',
      triggered_agents: ['ingestion-normalization', 'recovery-adaptation', 'nutrition', 'workout-programming'],
      downstream_actions: ['reduce_intensity', 'check_hrv', 'adjust_nutrition'],
    },
    spoken_response_template:
      "Energy's low — intensity reduced 25%. Checking HRV and nutrition. Recovery score: {recovery_score}.",
  },
  {
    intent_id: 'proactive_recovery',
    category: 'proactive_coaching',
    pattern: 'proactive_coaching',
    example_utterances: [],
    keywords: [],
    hermes_routing: {
      supervisor: 'BioModelingSupervisor',
      triggered_agents: ['anomaly-risk-detection', 'recovery-adaptation', 'insight-visualization'],
      downstream_actions: ['offer_recovery_protocol'],
    },
    spoken_response_template:
      "Your sleep was only {sleep_hours} hours last night. Would you like a quick recovery protocol?",
  },
  {
    intent_id: 'confirm_adaptation',
    category: 'confirmation',
    pattern: 'hybrid_confirm',
    example_utterances: ['Yes', 'Sounds good', 'Do it', 'Confirm'],
    keywords: ['yes', 'sounds good', 'do it', 'confirm', 'go ahead'],
    hermes_routing: {
      supervisor: 'BioModelingSupervisor',
      triggered_agents: ['recovery-adaptation', 'workout-programming'],
      downstream_actions: ['apply_adaptation'],
    },
    spoken_response_template: "Done — adaptation applied. Your workout is updated.",
  },
  {
    intent_id: 'adjust_tomorrow',
    category: 'confirmation',
    pattern: 'hybrid_confirm',
    example_utterances: ['Adjust tomorrow too', 'Yes for tomorrow', 'Apply to tomorrow'],
    keywords: ['tomorrow', 'next session', 'adjust tomorrow'],
    hermes_routing: {
      supervisor: 'BioModelingSupervisor',
      triggered_agents: ['recovery-adaptation', 'workout-programming', 'habit-coach'],
      downstream_actions: ['schedule_adaptation'],
    },
    spoken_response_template: "Tomorrow's session adjusted to match today's recovery plan.",
  },
];

export function getIntentDefinition(intentId: WisprIntent): IntentDefinition | undefined {
  return INTENT_REGISTRY.find((d) => d.intent_id === intentId);
}

export function getIntentsByCategory(category: IntentDefinition['category']): IntentDefinition[] {
  return INTENT_REGISTRY.filter((d) => d.category === category);
}
