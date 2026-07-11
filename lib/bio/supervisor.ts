/**
 * Bio Modeling Supervisor
 * Orchestrates all 6 bio agents under Hermes Fitness Supervisor
 */

import { createCorrelationId } from '@/lib/hermes/agent-base';
import { ingestionAgent } from '@/lib/bio/agents/ingestion-agent';
import { digitalTwinAgent } from '@/lib/bio/agents/digital-twin-agent';
import { predictiveAgent } from '@/lib/bio/agents/predictive-agent';
import { recoveryAgent } from '@/lib/bio/agents/recovery-agent';
import { anomalyAgent } from '@/lib/bio/agents/anomaly-agent';
import { insightAgent } from '@/lib/bio/agents/insight-agent';
import { getClientMemory } from '@/lib/hermes/memory';
import { createEmptyTwin } from '@/lib/bio/scores';
import type {
  AgentContext,
  AgentResult,
  OrchestrationTrace,
  OrchestrationStep,
  AgentAction,
} from '@/types/agent';
import type {
  BioTrackingContext,
  BioReading,
  IngestPayload,
  VoiceAdaptationRequest,
} from '@/types/bio';

export interface BioPipelineInput {
  ingest?: IngestPayload;
  voiceRequest?: VoiceAdaptationRequest;
  audience?: 'client' | 'coach' | 'both';
}

export interface BioPipelineResult {
  context: BioTrackingContext;
  trace: OrchestrationTrace;
  downstreamActions: AgentAction[];
}

export class BioModelingSupervisor {
  id = 'bio-modeling-supervisor' as const;
  childAgents = [
    'ingestion-normalization',
    'digital-twin-modeler',
    'predictive-analytics',
    'recovery-adaptation',
    'anomaly-risk-detection',
    'insight-visualization',
  ] as const;

  async runPipeline(input: BioPipelineInput, ctx: AgentContext): Promise<BioPipelineResult> {
    const correlationId = createCorrelationId();
    const steps: OrchestrationStep[] = [];
    const downstreamActions: AgentAction[] = [];
    const startTime = new Date().toISOString();

    let readings: BioReading[] = this.getExistingReadings(ctx.clientId);

    if (input.ingest) {
      const ingestResult = await this.runStep(
        steps,
        ingestionAgent.execute(input.ingest, ctx),
        'ingestion-normalization'
      );
      if (ingestResult.status === 'completed') {
        const data = ingestResult.data as { normalized: BioReading[]; imputed: BioReading[] };
        readings = [...readings, ...data.normalized, ...data.imputed];
      }
    }

    const twinResult = await this.runStep(
      steps,
      digitalTwinAgent.execute({ clientId: ctx.clientId, readings }, ctx),
      'digital-twin-modeler'
    );
    const twin =
      twinResult.status === 'completed'
        ? (twinResult.data as { twin: BioTrackingContext['twin'] }).twin
        : createEmptyTwin(ctx.clientId);

    const [predictResult, anomalyResult] = await Promise.all([
      this.runStep(
        steps,
        predictiveAgent.execute({ clientId: ctx.clientId, twin, readings }, ctx),
        'predictive-analytics'
      ),
      this.runStep(
        steps,
        anomalyAgent.execute({ clientId: ctx.clientId, twin, readings }, ctx),
        'anomaly-risk-detection'
      ),
    ]);

    const predictions =
      predictResult.status === 'completed'
        ? (predictResult.data as { predictions: BioTrackingContext['predictions'] }).predictions
        : [];

    const anomalies =
      anomalyResult.status === 'completed'
        ? (anomalyResult.data as { anomalies: BioTrackingContext['anomalies'] }).anomalies
        : [];

    if (anomalyResult.status === 'completed') {
      const anomalyData = anomalyResult.data as {
        escalations: AgentAction[];
        shouldHaltTraining: boolean;
      };
      downstreamActions.push(...anomalyData.escalations);
      if (anomalyData.shouldHaltTraining) {
        downstreamActions.push({
          type: 'halt_training',
          target: 'workout-programming',
          payload: { reason: 'Critical health/injury anomaly detected' },
          requiresApproval: false,
          priority: 'critical',
        });
      }
    }

    const recoveryResult = await this.runStep(
      steps,
      recoveryAgent.execute(
        {
          clientId: ctx.clientId,
          twin,
          predictions,
          voiceRequest: input.voiceRequest,
        },
        ctx
      ),
      'recovery-adaptation'
    );

    const adaptations =
      recoveryResult.status === 'completed'
        ? (recoveryResult.data as { adaptations: BioTrackingContext['adaptations'] }).adaptations
        : [];

    if (recoveryResult.status === 'completed') {
      const recoveryData = recoveryResult.data as { actions: AgentAction[] };
      downstreamActions.push(...recoveryData.actions);
    }

    const insightResult = await this.runStep(
      steps,
      insightAgent.execute(
        {
          clientId: ctx.clientId,
          twin,
          predictions,
          adaptations,
          anomalies,
          audience: input.audience,
        },
        ctx
      ),
      'insight-visualization'
    );

    const insights =
      insightResult.status === 'completed'
        ? (insightResult.data as { insights: BioTrackingContext['insights'] }).insights
        : [];

    const hasFailed = steps.some((s) => s.status === 'failed');

    const trace: OrchestrationTrace = {
      correlationId,
      clientId: ctx.clientId,
      startedAt: startTime,
      completedAt: new Date().toISOString(),
      steps,
      finalStatus: hasFailed ? 'failed' : 'completed',
    };

    const context: BioTrackingContext = {
      clientId: ctx.clientId,
      twin,
      recentReadings: readings,
      predictions,
      adaptations,
      anomalies,
      insights,
      memorySnippets: [],
    };

    return { context, trace, downstreamActions };
  }

  private async runStep(
    steps: OrchestrationStep[],
    promise: Promise<AgentResult>,
    agentId: OrchestrationStep['agentId']
  ): Promise<AgentResult> {
    const stepStart = new Date().toISOString();
    const result = await promise;
    steps.push({
      agentId,
      status: result.status,
      startedAt: stepStart,
      completedAt: new Date().toISOString(),
      output: result.data,
      error: result.errors?.[0],
    });
    return result;
  }

  private getExistingReadings(clientId: string): BioReading[] {
    const profile = getClientMemory(clientId);
    const entry = profile.entries.find((e) => e.key === 'bio_readings');
    return (entry?.value as BioReading[]) ?? [];
  }
}

export const bioSupervisor = new BioModelingSupervisor();
