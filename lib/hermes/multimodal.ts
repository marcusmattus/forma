/**
 * Hermes Multimodal Input Handler
 * Normalizes voice, wearables, photos, manual logs, text, touch into unified pipeline input
 */

import type { MultimodalInput, MultimodalPayload, InputModality } from '@/types/hermes-context';
import type { IngestPayload } from '@/types/bio';
import type { AgentTrigger } from '@/types/agent';
import { detectIntentFromRegistry } from '@/lib/wispr/intent-detector';

export interface NormalizedHermesInput {
  modality: InputModality;
  client_id: string;
  session_id: string;
  trigger: AgentTrigger;
  transcript?: string;
  ingest?: IngestPayload;
  touch_action?: { action: string; target: string; confirmed: boolean };
  text_message?: string;
  photo_url?: string;
  photo_category?: string;
  detected_intent?: string;
  intent_confidence?: number;
}

export function normalizeMultimodalInput(input: MultimodalInput): NormalizedHermesInput {
  const base: NormalizedHermesInput = {
    modality: input.modality,
    client_id: input.client_id,
    session_id: input.session_id,
    trigger: mapModalityToTrigger(input.modality),
  };

  switch (input.payload.type) {
    case 'voice': {
      const detection = detectIntentFromRegistry(input.payload.transcript);
      return {
        ...base,
        trigger: 'voice_command',
        transcript: input.payload.transcript,
        detected_intent: detection.intent_id,
        intent_confidence: detection.confidence,
      };
    }

    case 'wearable':
      return {
        ...base,
        trigger: 'wearable_webhook',
        ingest: {
          clientId: input.client_id,
          source: input.payload.source as IngestPayload['source'],
          readings: input.payload.readings.map((r) => ({
            metricKey: r.key as IngestPayload['readings'][0]['metricKey'],
            value: r.value,
            unit: r.unit,
          })),
        },
      };

    case 'manual':
      return {
        ...base,
        trigger: 'manual_log',
        ingest: {
          clientId: input.client_id,
          source: 'manual',
          readings: [
            {
              metricKey: input.payload.metric_key as IngestPayload['readings'][0]['metricKey'],
              value: input.payload.value,
              unit: input.payload.unit,
            },
          ],
        },
      };

    case 'photo':
      return {
        ...base,
        trigger: 'manual_log',
        photo_url: input.payload.url,
        photo_category: input.payload.category,
        ingest: {
          clientId: input.client_id,
          source: 'progress_photo',
          readings: [],
        },
      };

    case 'video':
      return {
        ...base,
        trigger: 'manual_log',
        photo_url: input.payload.url,
        photo_category: input.payload.category,
      };

    case 'text': {
      const detection = detectIntentFromRegistry(input.payload.message);
      return {
        ...base,
        trigger: 'manual_log',
        text_message: input.payload.message,
        transcript: input.payload.message,
        detected_intent: detection.intent_id,
        intent_confidence: detection.confidence,
      };
    }

    case 'touch':
      return {
        ...base,
        trigger: input.payload.confirmed ? 'coach_override' : 'manual_log',
        touch_action: {
          action: input.payload.action,
          target: input.payload.target,
          confirmed: input.payload.confirmed,
        },
      };

    default:
      return base;
  }
}

function mapModalityToTrigger(modality: InputModality): AgentTrigger {
  const map: Record<InputModality, AgentTrigger> = {
    voice: 'voice_command',
    wearable: 'wearable_webhook',
    photo: 'manual_log',
    video: 'manual_log',
    manual: 'manual_log',
    text: 'manual_log',
    touch: 'coach_override',
  };
  return map[modality];
}

/** Suggest next modality for hybrid voice → photo → touch flows */
export function suggestMultimodalHandoff(
  modality: InputModality,
  intent?: string
): { suggested_next: InputModality[]; pending_confirmation: boolean } {
  if (modality === 'voice') {
    const needsConfirm = ['knee_hurts', 'im_sore', 'feeling_low_energy'].includes(intent ?? '');
    return {
      suggested_next: needsConfirm ? ['touch'] : ['touch', 'photo'],
      pending_confirmation: needsConfirm,
    };
  }
  if (modality === 'photo') {
    return { suggested_next: ['touch', 'voice'], pending_confirmation: false };
  }
  if (modality === 'touch') {
    return { suggested_next: [], pending_confirmation: false };
  }
  return { suggested_next: ['voice'], pending_confirmation: false };
}
