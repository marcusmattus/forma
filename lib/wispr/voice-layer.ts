/**
 * Wispr Voice Layer — Intent detection & spoken coaching feedback
 * MotionOS / Hermes Fit
 */

import type { WisprIntent } from '@/types/wispr';
import type { AdaptationRecommendation, BioReading } from '@/types/bio';

type LegacyVoiceIntent = Extract<
  WisprIntent,
  'im_sore' | 'traveling_this_week' | 'only_20_minutes' | 'knee_hurts' | 'feeling_low_energy'
>;

export interface WisprIntentMatch {
  intent: WisprIntent;
  confidence: number;
  matchedKeywords: string[];
  extractedMetrics?: Partial<Record<string, number>>;
}

export interface WisprAdaptationSpec {
  intent: WisprIntent;
  adaptations: Partial<AdaptationRecommendation>[];
  spokenFeedback: string;
  bioUpdates?: Array<{ metricKey: BioReading['metricKey']; value: number }>;
  downstreamAgents: Array<'workout-programming' | 'nutrition' | 'habit-coach'>;
}

const INTENT_PATTERNS: Record<
  LegacyVoiceIntent,
  { keywords: string[]; bodyParts?: string[]; timePatterns?: RegExp[] }
> = {
  im_sore: {
    keywords: ['sore', 'aching', 'tight', 'stiff', 'hurts a bit'],
  },
  traveling_this_week: {
    keywords: ['travel', 'travelling', 'hotel', 'away', 'no gym', 'on the road', 'airport'],
  },
  only_20_minutes: {
    keywords: ['20 minutes', '20 min', '30 minutes', '30 min', 'short on time', 'only have', 'quick workout', 'pressed for time'],
    timePatterns: [/(\d+)\s*min/i],
  },
  knee_hurts: {
    keywords: ['knee', 'knees hurt', 'knee pain', 'bad knee'],
    bodyParts: ['knee', 'knees'],
  },
  feeling_low_energy: {
    keywords: ['low energy', 'no energy', 'exhausted', 'fatigued', 'drained', 'wiped out', 'tired'],
  },
};

const WISPR_ADAPTATION_MAP: Record<LegacyVoiceIntent, WisprAdaptationSpec> = {
  im_sore: {
    intent: 'im_sore',
    adaptations: [
      {
        type: 'volume',
        description: 'Reduce training volume by 20% and add mobility finisher',
        magnitude: 'moderate',
        autoApply: true,
        requiresCoachApproval: false,
        affectedDomains: ['workout', 'recovery'],
        rationale: 'Voice: soreness reported — prioritizing recovery',
      },
      {
        type: 'exercise_swap',
        description: 'Swap high-impact exercises for lower-stress alternatives',
        magnitude: 'moderate',
        autoApply: true,
        requiresCoachApproval: false,
        affectedDomains: ['workout'],
        rationale: 'Reduce eccentric load on sore muscle groups',
      },
    ],
    spokenFeedback:
      "Got it — I've reduced today's volume and added mobility work. Listen to your body and skip anything that aggravates the soreness.",
    bioUpdates: [{ metricKey: 'soreness', value: 7 }],
    downstreamAgents: ['workout-programming', 'habit-coach'],
  },
  traveling_this_week: {
    intent: 'traveling_this_week',
    adaptations: [
      {
        type: 'exercise_swap',
        description: 'Generate hotel-friendly bodyweight workout for travel week',
        magnitude: 'moderate',
        autoApply: true,
        requiresCoachApproval: false,
        affectedDomains: ['workout'],
        rationale: 'Travel constraint detected via voice',
      },
      {
        type: 'schedule',
        description: 'Shift to 3x/week travel-friendly sessions',
        magnitude: 'minor',
        autoApply: true,
        requiresCoachApproval: false,
        affectedDomains: ['workout', 'habits'],
        rationale: 'Maintain consistency during travel',
      },
    ],
    spokenFeedback:
      "Travel mode activated. I've swapped your program to hotel-friendly workouts — no equipment needed. Safe travels!",
    downstreamAgents: ['workout-programming', 'habit-coach'],
  },
  only_20_minutes: {
    intent: 'only_20_minutes',
    adaptations: [
      {
        type: 'schedule',
        description: 'Compress session to 20 minutes — supersets, maintain intensity',
        magnitude: 'minor',
        autoApply: true,
        requiresCoachApproval: false,
        affectedDomains: ['workout'],
        rationale: 'Time constraint: compress without dropping intensity',
      },
    ],
    spokenFeedback:
      "20-minute power session ready. I've cut rest periods and paired exercises — you'll hit the same muscle groups efficiently.",
    downstreamAgents: ['workout-programming'],
  },
  knee_hurts: {
    intent: 'knee_hurts',
    adaptations: [
      {
        type: 'exercise_swap',
        description: 'Remove squats, lunges, and leg press — substitute with hip-dominant alternatives',
        magnitude: 'major',
        autoApply: false,
        requiresCoachApproval: true,
        affectedDomains: ['workout', 'recovery'],
        rationale: 'Knee pain reported — injury-aware exercise removal',
      },
    ],
    spokenFeedback:
      "I've flagged your knee concern and removed squatting movements. Your coach will review alternatives — try RDLs and glute bridges in the meantime. If pain persists, please see a medical professional.",
    bioUpdates: [{ metricKey: 'soreness', value: 6 }],
    downstreamAgents: ['workout-programming'],
  },
  feeling_low_energy: {
    intent: 'feeling_low_energy',
    adaptations: [
      {
        type: 'intensity',
        description: 'Reduce workout intensity by 25% — check HRV and sleep data',
        magnitude: 'moderate',
        autoApply: true,
        requiresCoachApproval: false,
        affectedDomains: ['workout', 'recovery'],
        rationale: 'Low energy voice report — cross-reference biometric data',
      },
      {
        type: 'nutrition',
        description: 'Review caloric intake — possible under-fueling detected',
        magnitude: 'minor',
        autoApply: false,
        requiresCoachApproval: true,
        affectedDomains: ['nutrition'],
        rationale: 'Low energy may indicate nutritional deficit',
      },
    ],
    spokenFeedback:
      "Energy's low — I've dialed back intensity today. I'm also checking your nutrition targets. Consider an extra 200-300 calories if you've been in a deficit.",
    bioUpdates: [{ metricKey: 'stress', value: 6 }],
    downstreamAgents: ['workout-programming', 'nutrition', 'habit-coach'],
  },
};

export function detectWisprIntent(transcript: string): WisprIntentMatch {
  const lower = transcript.toLowerCase().trim();
  let bestMatch: WisprIntentMatch = { intent: 'unknown', confidence: 0, matchedKeywords: [] };

  for (const [intent, pattern] of Object.entries(INTENT_PATTERNS) as Array<
    [LegacyVoiceIntent, (typeof INTENT_PATTERNS)[LegacyVoiceIntent]]
  >) {
    const matched = pattern.keywords.filter((kw) => lower.includes(kw));
    if (matched.length === 0) continue;

    const confidence = Math.min(0.95, 0.5 + matched.length * 0.15);
    if (confidence > bestMatch.confidence) {
      bestMatch = { intent, confidence, matchedKeywords: matched };
    }
  }

  if (bestMatch.intent === 'only_20_minutes') {
    const timeMatch = lower.match(/(\d+)\s*min/);
    if (timeMatch) {
      bestMatch.extractedMetrics = { available_minutes: parseInt(timeMatch[1], 10) };
    }
  }

  return bestMatch;
}

export function getWisprAdaptations(intent: WisprIntent): WisprAdaptationSpec | null {
  if (intent === 'unknown') return null;
  return WISPR_ADAPTATION_MAP[intent as LegacyVoiceIntent] ?? null;
}

export function buildWisprVoiceLayer(
  transcript: string,
  sessionId: string
): {
  provider: 'Wispr';
  session_id: string;
  transcript: string;
  detected_intent: WisprIntent;
  confidence: number;
  spoken_feedback: string;
  capabilities: WisprVoiceLayer['capabilities'];
} {
  const match = detectWisprIntent(transcript);
  const spec = getWisprAdaptations(match.intent);

  return {
    provider: 'Wispr',
    session_id: sessionId,
    transcript,
    detected_intent: match.intent,
    confidence: match.confidence,
    spoken_feedback: spec?.spokenFeedback ?? "I didn't quite catch that. Could you tell me how you're feeling or what you need today?",
    capabilities: [
      'natural_language_updates',
      'real_time_adaptation_triggers',
      'spoken_coaching_feedback',
      'intent_detection',
    ],
  };
}

type WisprVoiceLayer = import('@/types/motionos').WisprVoiceLayer;

export function wisprAdaptationsToRecommendations(
  spec: WisprAdaptationSpec,
  transcript: string
): AdaptationRecommendation[] {
  return spec.adaptations.map((partial, i) => ({
    id: `wispr_${spec.intent}_${Date.now()}_${i}`,
    type: partial.type!,
    description: partial.description!,
    magnitude: partial.magnitude!,
    autoApply: partial.autoApply!,
    requiresCoachApproval: partial.requiresCoachApproval!,
    rationale: partial.rationale ?? `Wispr intent: ${spec.intent}`,
    affectedDomains: partial.affectedDomains!,
  }));
}
