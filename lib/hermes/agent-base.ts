/**
 * Hermes Agent Base — shared execution utilities
 */

import type {
  AgentContext,
  AgentError,
  AgentId,
  AgentResult,
  AgentStatus,
  HermesAgent,
} from '@/types/agent';

export function createCorrelationId(): string {
  return `corr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createAgentResult<T>(
  agentId: AgentId,
  data: T,
  options?: {
    status?: AgentStatus;
    confidence?: number;
    reasoning?: string;
    errors?: AgentError[];
    startTime?: number;
  }
): AgentResult<T> {
  return {
    agentId,
    status: options?.status ?? 'completed',
    data,
    confidence: options?.confidence,
    reasoning: options?.reasoning,
    errors: options?.errors,
    durationMs: options?.startTime ? Date.now() - options.startTime : 0,
  };
}

export function createFailedResult<T>(
  agentId: AgentId,
  errors: AgentError[],
  startTime: number
): AgentResult<T> {
  return {
    agentId,
    status: 'failed',
    data: null as T,
    errors,
    durationMs: Date.now() - startTime,
  };
}

export abstract class BaseAgent<TInput, TOutput> implements HermesAgent {
  abstract id: AgentId;
  abstract name: string;
  abstract description: string;
  tier: HermesAgent['tier'] = 'free';
  tools: HermesAgent['tools'] = [];

  abstract run(input: TInput, ctx: AgentContext): Promise<TOutput>;

  async execute(input: unknown, ctx: AgentContext): Promise<AgentResult<TOutput>> {
    const startTime = Date.now();
    try {
      const data = await this.run(input as TInput, ctx);
      return createAgentResult(this.id, data, { startTime });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown agent error';
      return createFailedResult<TOutput>(
        this.id,
        [{ code: 'AGENT_EXECUTION_ERROR', message, recoverable: true }],
        startTime
      );
    }
  }
}

export function tierAllowsFeature(
  userTier: AgentContext['tier'],
  requiredTier: AgentContext['tier']
): boolean {
  const hierarchy: AgentContext['tier'][] = ['free', 'pro', 'coach', 'enterprise'];
  return hierarchy.indexOf(userTier) >= hierarchy.indexOf(requiredTier);
}
