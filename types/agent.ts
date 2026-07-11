/**
 * Hermes Agent Framework — Core Types
 * MotionOS / Hermes Fit orchestration layer
 */

export type AgentId =
  | 'hermes-fitness-supervisor'
  | 'bio-modeling-supervisor'
  | 'ingestion-normalization'
  | 'digital-twin-modeler'
  | 'predictive-analytics'
  | 'recovery-adaptation'
  | 'anomaly-risk-detection'
  | 'insight-visualization'
  | 'assessment'
  | 'workout-programming'
  | 'nutrition'
  | 'progress-analyst'
  | 'habit-coach'
  | 'builder-studio';

export type AgentTier = 'free' | 'pro' | 'coach' | 'enterprise';

export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed' | 'escalated';

export interface AgentContext {
  clientId: string;
  sessionId: string;
  tier: AgentTier;
  timestamp: string;
  voiceInput?: string;
  trigger: AgentTrigger;
  metadata?: Record<string, unknown>;
}

export type AgentTrigger =
  | 'scheduled_sync'
  | 'manual_log'
  | 'wearable_webhook'
  | 'voice_command'
  | 'workout_complete'
  | 'coach_override'
  | 'anomaly_detected'
  | 'builder_studio_request'
  | 'marketplace_purchase';

export interface AgentMessage {
  id: string;
  from: AgentId;
  to: AgentId | AgentId[];
  type: 'request' | 'response' | 'event' | 'escalation';
  payload: unknown;
  timestamp: string;
  correlationId: string;
}

export interface AgentResult<T = unknown> {
  agentId: AgentId;
  status: AgentStatus;
  data: T;
  confidence?: number;
  reasoning?: string;
  actions?: AgentAction[];
  errors?: AgentError[];
  durationMs: number;
}

export interface AgentAction {
  type: string;
  target: AgentId | 'client' | 'coach' | 'system';
  payload: unknown;
  requiresApproval: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface AgentError {
  code: string;
  message: string;
  recoverable: boolean;
  fallback?: unknown;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: (args: Record<string, unknown>, ctx: AgentContext) => Promise<unknown>;
}

export interface HermesAgent {
  id: AgentId;
  name: string;
  description: string;
  tier: AgentTier;
  tools: AgentTool[];
  execute(input: unknown, ctx: AgentContext): Promise<AgentResult>;
}

export interface SupervisorConfig {
  id: AgentId;
  childAgents: AgentId[];
  maxConcurrency: number;
  escalationThreshold: number;
}

export interface OrchestrationTrace {
  correlationId: string;
  clientId: string;
  startedAt: string;
  completedAt?: string;
  steps: OrchestrationStep[];
  finalStatus: AgentStatus;
}

export interface OrchestrationStep {
  agentId: AgentId;
  status: AgentStatus;
  startedAt: string;
  completedAt?: string;
  input?: unknown;
  output?: unknown;
  error?: AgentError;
}
