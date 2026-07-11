/**
 * Wispr Intent Detector — registry-based NLP matching
 */

import { INTENT_REGISTRY } from '@/lib/wispr/intent-registry';
import type { ExtractedEntities, WisprIntent } from '@/types/wispr';

export interface IntentDetection {
  intent_id: WisprIntent;
  confidence: number;
  utterance: string;
  entities: ExtractedEntities;
  matched_keywords: string[];
}

export function detectIntentFromRegistry(utterance: string): IntentDetection {
  const lower = utterance.toLowerCase().trim();
  let best: IntentDetection = {
    intent_id: 'unknown',
    confidence: 0,
    utterance,
    entities: {},
    matched_keywords: [],
  };

  for (const def of INTENT_REGISTRY) {
    if (def.keywords.length === 0) continue;

    const matched = def.keywords.filter((kw) => lower.includes(kw));
    if (matched.length === 0) continue;

    const confidence = Math.min(0.95, 0.45 + matched.length * 0.12 + (matched[0].length > 8 ? 0.1 : 0));
    if (confidence > best.confidence) {
      best = {
        intent_id: def.intent_id,
        confidence,
        utterance,
        entities: extractEntities(lower, def.intent_id),
        matched_keywords: matched,
      };
    }
  }

  return best;
}

function extractEntities(lower: string, intentId: WisprIntent): ExtractedEntities {
  const entities: ExtractedEntities = {};

  const timeMatch = lower.match(/(\d+)\s*min/);
  if (timeMatch) entities.available_minutes = parseInt(timeMatch[1], 10);

  const sleepMatch = lower.match(/(\d+(?:\.\d+)?)\s*hours?\s*(?:of\s*)?sleep|slept\s*(\d+(?:\.\d+)?)\s*hours?/);
  if (sleepMatch) entities.sleep_hours = parseFloat(sleepMatch[1] ?? sleepMatch[2]);

  const weightKg = lower.match(/(\d+(?:\.\d+)?)\s*kg/);
  if (weightKg) entities.weight_kg = parseFloat(weightKg[1]);

  const weekMatch = lower.match(/(\d+)\s*week/);
  if (weekMatch) entities.program_duration_weeks = parseInt(weekMatch[1], 10);

  if (['yes', 'yeah', 'sure', 'confirm', 'do it', 'go ahead', 'sounds good'].some((w) => lower.includes(w))) {
    entities.confirmation = true;
  }

  const bodyParts: string[] = [];
  const parts = ['quads', 'hamstrings', 'shoulders', 'lower back', 'glutes', 'knees', 'calves', 'chest'];
  for (const p of parts) {
    if (lower.includes(p)) bodyParts.push(p);
  }
  if (bodyParts.length > 0) entities.body_parts = bodyParts;

  if (intentId === 'hotel_workout' || lower.includes('hotel')) entities.location = 'hotel';
  if (lower.includes('home')) entities.location = 'home';

  return entities;
}
