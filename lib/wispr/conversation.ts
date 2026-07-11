/**
 * Wispr Multi-Turn Conversation Manager
 * Hermes Memory-backed session state for clarifying dialogs
 */

import { getClientMemory, storeMemory, queryMemory } from '@/lib/hermes/memory';
import type {
  ConversationTurn,
  ExtractedEntities,
  VoiceSessionState,
  WisprIntent,
  WisprIntentResult,
} from '@/types/wispr';
import { detectIntentFromRegistry } from '@/lib/wispr/intent-detector';
import { getIntentDefinition } from '@/lib/wispr/intent-registry';
import { buildIntentResponse } from '@/lib/wispr/response-builder';

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function getVoiceSession(clientId: string, sessionId: string): VoiceSessionState | null {
  const entries = queryMemory(clientId, { category: 'voice_context', key: `session_${sessionId}` });
  if (entries.length === 0) return null;
  const session = entries[0].value as VoiceSessionState;
  if (Date.now() - new Date(session.last_updated).getTime() > SESSION_TTL_MS) return null;
  return session;
}

export function saveVoiceSession(session: VoiceSessionState): void {
  storeMemory(
    session.client_id,
    'voice_context',
    `session_${session.session_id}`,
    session,
    'wispr',
    { relevance: 0.9, expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString() }
  );
}

export function createVoiceSession(clientId: string, sessionId: string, mode: 'client' | 'coach' = 'client'): VoiceSessionState {
  const now = new Date().toISOString();
  const session: VoiceSessionState = {
    session_id: sessionId,
    client_id: clientId,
    active: true,
    awaiting_clarification: false,
    turns: [],
    extracted_entities: {},
    mode,
    started_at: now,
    last_updated: now,
  };
  saveVoiceSession(session);
  return session;
}

export interface ProcessTurnInput {
  clientId: string;
  sessionId: string;
  utterance: string;
  mode?: 'client' | 'coach';
  bioContext?: {
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
  };
}

export function processVoiceTurn(input: ProcessTurnInput): WisprIntentResult {
  let session = getVoiceSession(input.clientId, input.sessionId);
  if (!session) {
    session = createVoiceSession(input.clientId, input.sessionId, input.mode);
  }

  const userTurn: ConversationTurn = {
    role: 'user',
    text: input.utterance,
    timestamp: new Date().toISOString(),
  };
  session.turns.push(userTurn);

  // Multi-turn: if awaiting clarification, treat as follow-up
  if (session.awaiting_clarification && session.pending_intent) {
    return handleClarificationFollowUp(session, input);
  }

  const detection = detectIntentFromRegistry(input.utterance);
  session.extracted_entities = { ...session.extracted_entities, ...detection.entities };

  const definition = getIntentDefinition(detection.intent_id);

  // Pattern A multi-turn: sore without body part → ask where
  if (definition?.requires_clarification && detection.intent_id === 'im_sore') {
    const hasBodyPart = detection.entities.body_parts && detection.entities.body_parts.length > 0;
    if (!hasBodyPart) {
      session.awaiting_clarification = true;
      session.pending_intent = 'im_sore';
      session.last_updated = new Date().toISOString();

      const prompt = definition.clarification_prompt ?? 'Can you tell me more?';
      const coachTurn: ConversationTurn = {
        role: 'coach',
        text: prompt,
        timestamp: new Date().toISOString(),
        intent: detection.intent_id,
      };
      session.turns.push(coachTurn);
      saveVoiceSession(session);

      return buildClarificationResult(session, detection, prompt);
    }
  }

  const result = buildIntentResponse(detection, session, input.bioContext);
  const coachTurn: ConversationTurn = {
    role: 'coach',
    text: result.output.spoken_response,
    timestamp: new Date().toISOString(),
    intent: detection.intent_id,
  };
  session.turns.push(coachTurn);
  session.awaiting_clarification = false;
  session.pending_intent = undefined;
  session.last_updated = new Date().toISOString();
  saveVoiceSession(session);

  return result;
}

function handleClarificationFollowUp(
  session: VoiceSessionState,
  input: ProcessTurnInput
): WisprIntentResult {
  const bodyParts = extractBodyParts(input.utterance);
  session.extracted_entities.body_parts = bodyParts;
  session.awaiting_clarification = false;

  const detection = detectIntentFromRegistry(input.utterance);
  detection.intent_id = 'injury_location_followup';
  detection.entities.body_parts = bodyParts;
  detection.confidence = 0.85;

  const result = buildIntentResponse(detection, session, input.bioContext);
  result.output.spoken_response = result.output.spoken_response.replace(
    '{body_parts}',
    bodyParts.join(' and ')
  );

  const coachTurn: ConversationTurn = {
    role: 'coach',
    text: result.output.spoken_response,
    timestamp: new Date().toISOString(),
    intent: 'injury_location_followup',
  };
  session.turns.push(coachTurn);
  session.pending_intent = undefined;
  session.last_updated = new Date().toISOString();
  saveVoiceSession(session);

  return result;
}

function buildClarificationResult(
  session: VoiceSessionState,
  detection: ReturnType<typeof detectIntentFromRegistry>,
  prompt: string
): WisprIntentResult {
  const definition = getIntentDefinition(detection.intent_id)!;
  return {
    system: 'MotionOS_WisprIntent_v1.0',
    intent_id: detection.intent_id,
    category: definition.category,
    pattern: 'multi_turn_clarification',
    confidence: detection.confidence,
    utterance: detection.utterance,
    session_id: session.session_id,
    turn_index: session.turns.length - 1,
    awaiting_clarification: true,
    clarification_prompt: prompt,
    extracted_entities: detection.entities,
    hermes_routing: definition.hermes_routing,
    output: {
      spoken_response: prompt,
      visual_updates: [],
      data_updates: [],
      follow_up_prompt: prompt,
    },
    multi_turn: {
      active: true,
      pending_intent: detection.intent_id,
      turns: session.turns,
    },
  };
}

const BODY_PART_KEYWORDS: Record<string, string> = {
  quads: 'quads',
  quad: 'quads',
  hamstrings: 'hamstrings',
  hamstring: 'hamstrings',
  shoulders: 'shoulders',
  shoulder: 'shoulders',
  'lower back': 'lower back',
  back: 'lower back',
  glutes: 'glutes',
  glute: 'glutes',
  calves: 'calves',
  calf: 'calves',
  arms: 'arms',
  biceps: 'arms',
  triceps: 'arms',
  chest: 'chest',
  knees: 'knees',
  knee: 'knees',
};

function extractBodyParts(utterance: string): string[] {
  const lower = utterance.toLowerCase();
  const found = new Set<string>();
  for (const [kw, part] of Object.entries(BODY_PART_KEYWORDS)) {
    if (lower.includes(kw)) found.add(part);
  }
  return [...found];
}

/** Pattern E: Proactive coaching based on bio anomalies */
export function generateProactivePrompt(bioContext: {
  sleep_hours?: number;
  hrv_drop_pct?: number;
  recovery_score?: number;
}): WisprIntentResult | null {
  if (bioContext.sleep_hours !== undefined && bioContext.sleep_hours < 6.5) {
    const definition = getIntentDefinition('proactive_recovery')!;
    return {
      system: 'MotionOS_WisprIntent_v1.0',
      intent_id: 'proactive_recovery',
      category: 'proactive_coaching',
      pattern: 'proactive_coaching',
      confidence: 0.9,
      utterance: '[system-initiated]',
      session_id: 'proactive',
      turn_index: 0,
      awaiting_clarification: false,
      extracted_entities: { sleep_hours: bioContext.sleep_hours },
      hermes_routing: definition.hermes_routing,
      output: {
        spoken_response: definition.spoken_response_template.replace(
          '{sleep_hours}',
          String(bioContext.sleep_hours)
        ),
        visual_updates: ['recovery_gauge', 'adaptation_card'],
        data_updates: ['sleep_alert'],
        follow_up_prompt: 'Say "yes" for a recovery protocol',
      },
    };
  }

  if (bioContext.hrv_drop_pct !== undefined && bioContext.hrv_drop_pct > 20) {
    const definition = getIntentDefinition('why_hrv_low')!;
    return {
      system: 'MotionOS_WisprIntent_v1.0',
      intent_id: 'proactive_recovery',
      category: 'proactive_coaching',
      pattern: 'proactive_coaching',
      confidence: 0.85,
      utterance: '[system-initiated]',
      session_id: 'proactive',
      turn_index: 0,
      awaiting_clarification: false,
      extracted_entities: {},
      hermes_routing: definition.hermes_routing,
      output: {
        spoken_response:
          "I noticed your HRV dropped. Want to talk about last night's sleep?",
        visual_updates: ['recovery_gauge'],
        data_updates: ['hrv_alert'],
        follow_up_prompt: 'Try "Why is my HRV low?" for details',
      },
    };
  }

  return null;
}
