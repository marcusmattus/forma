/**
 * Bio Tracking Engine — public API for the Bio subsystem
 * Entry point for Hermes Fitness Supervisor and external integrations
 */

import { bioSupervisor } from '@/lib/bio/supervisor';
import { digitalTwinAgent } from '@/lib/bio/agents/digital-twin-agent';
import { getMemorySnippets } from '@/lib/hermes/memory';
import type { AgentContext, AgentTier, AgentTrigger } from '@/types/agent';
import type {
  BioPipelineInput,
  BioPipelineResult,
} from '@/lib/bio/supervisor';
import type { IngestPayload, VoiceAdaptationRequest, WhatIfChange } from '@/types/bio';

export function createBioContext(
  clientId: string,
  options?: {
    tier?: AgentTier;
    trigger?: AgentTrigger;
    sessionId?: string;
    voiceInput?: string;
  }
): AgentContext {
  return {
    clientId,
    sessionId: options?.sessionId ?? `session_${Date.now()}`,
    tier: options?.tier ?? 'free',
    timestamp: new Date().toISOString(),
    trigger: options?.trigger ?? 'manual_log',
    voiceInput: options?.voiceInput,
  };
}

export async function ingestBioData(
  payload: IngestPayload,
  tier: AgentTier = 'free'
): Promise<BioPipelineResult> {
  const ctx = createBioContext(payload.clientId, {
    tier,
    trigger: payload.source === 'voice' ? 'voice_command' : 'wearable_webhook',
    voiceInput: payload.voiceTranscript,
  });

  return bioSupervisor.runPipeline({ ingest: payload }, ctx);
}

export async function processVoiceAdaptation(
  request: VoiceAdaptationRequest,
  tier: AgentTier = 'free'
): Promise<BioPipelineResult> {
  const ctx = createBioContext(request.clientId, {
    tier,
    trigger: 'voice_command',
    sessionId: request.sessionId,
    voiceInput: request.transcript,
  });

  return bioSupervisor.runPipeline({ voiceRequest: request }, ctx);
}

export async function runBioSync(
  clientId: string,
  tier: AgentTier = 'free'
): Promise<BioPipelineResult> {
  const ctx = createBioContext(clientId, { tier, trigger: 'scheduled_sync' });
  return bioSupervisor.runPipeline({}, ctx);
}

export async function runWhatIfSimulation(
  clientId: string,
  changes: WhatIfChange[],
  tier: AgentTier = 'pro'
) {
  const ctx = createBioContext(clientId, { tier, trigger: 'coach_override' });
  const pipeline = await bioSupervisor.runPipeline({}, ctx);
  const result = await digitalTwinAgent.execute(
    { clientId, readings: pipeline.context.recentReadings, whatIf: changes },
    ctx
  );
  return result.data;
}

export async function getBioDashboard(
  clientId: string,
  tier: AgentTier = 'free',
  audience: 'client' | 'coach' = 'client'
): Promise<BioPipelineResult> {
  const ctx = createBioContext(clientId, { tier, trigger: 'manual_log' });
  const result = await bioSupervisor.runPipeline({ audience }, ctx);
  result.context.memorySnippets = getMemorySnippets(clientId);
  return result;
}

export type { BioPipelineInput, BioPipelineResult };
