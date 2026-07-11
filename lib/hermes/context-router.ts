/**
 * Hermes Context Router
 * Central intelligence middleware — enriches, detects, routes, prioritizes, resolves conflicts
 */

import { createCorrelationId } from '@/lib/hermes/agent-base';
import {
  getClientMemory,
  getMemorySnippets,
  getInjuryHistory,
  getActiveConstraints,
  queryMemory,
} from '@/lib/hermes/memory';
import { getIntentDefinition } from '@/lib/wispr/intent-registry';
import type { AgentId, AgentTier, AgentTrigger } from '@/types/agent';
import type {
  AgentRoute,
  BioStateSnapshot,
  ConflictRecord,
  ContextRouterDecision,
  EnrichedHermesContext,
  HermesMemorySnapshot,
  InputModality,
  RoutingPriority,
  SafetyGate,
} from '@/types/hermes-context';
import type { NormalizedHermesInput } from '@/lib/hermes/multimodal';
import { suggestMultimodalHandoff } from '@/lib/hermes/multimodal';

const INJURY_INTENTS = new Set(['knee_hurts', 'back_tight', 'im_sore', 'injury_location_followup']);
const NUTRITION_INTENTS = new Set(['what_to_eat', 'craving_carbs', 'feeling_low_energy']);
const WORKOUT_INTENTS = new Set([
  'im_sore', 'knee_hurts', 'back_tight', 'injury_location_followup',
  'only_20_minutes', 'quick_session', 'traveling_this_week', 'hotel_workout',
  'feeling_low_energy', 'confirm_adaptation', 'adjust_tomorrow',
]);
const PROGRESS_INTENTS = new Set(['progress_check', 'how_am_i_doing']);
const BIO_ALWAYS = true;

export interface RouterInput {
  normalized: NormalizedHermesInput;
  tier?: AgentTier;
  mode?: 'client' | 'coach';
  coach_override?: boolean;
  bio_state?: BioStateSnapshot;
}

export class HermesContextRouter {
  id = 'context-router' as const;

  route(input: RouterInput): ContextRouterDecision {
    const startMs = Date.now();
    const correlationId = createCorrelationId();
    const decisionId = `dec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const enriched = this.enrichContext(input, correlationId);
    const safety = this.evaluateSafety(enriched);
    const routes = this.buildAgentRoutes(enriched, input.normalized, safety);
    const conflicts = this.resolveConflicts(routes, enriched, safety);
    const executionPlan = this.selectExecutionPlan(enriched, routes);
    const handoff = suggestMultimodalHandoff(
      input.normalized.modality,
      input.normalized.detected_intent
    );

    const profile = getClientMemory(input.normalized.client_id);

    return {
      system: 'HermesContextRouter_v1.0',
      decision_id: decisionId,
      correlation_id: correlationId,
      created_at: new Date().toISOString(),
      enriched_context: enriched,
      routing: {
        primary_supervisor: this.selectSupervisor(enriched),
        agent_routes: routes,
        execution_plan: executionPlan,
      },
      safety,
      conflicts_resolved: conflicts,
      multimodal_handoff: {
        from: input.normalized.modality,
        ...handoff,
      },
      observability: {
        router_latency_ms: Date.now() - startMs,
        memory_entries_loaded: profile.entries.length,
      },
    };
  }

  private enrichContext(input: RouterInput, correlationId: string): EnrichedHermesContext {
    const { normalized } = input;
    const injuries = getInjuryHistory(normalized.client_id);
    const constraints = getActiveConstraints(normalized.client_id);
    const prefs = queryMemory(normalized.client_id, { category: 'preference' });
    const adaptHistory = queryMemory(normalized.client_id, { category: 'adaptation_history' });
    const voiceCtx = queryMemory(normalized.client_id, { category: 'voice_context' });

    const memory: HermesMemorySnapshot = {
      client_id: normalized.client_id,
      snippets: getMemorySnippets(normalized.client_id, 12),
      injury_flags: injuries.map((i) => ({
        body_part: i.bodyPart,
        severity: i.severity,
        resolved: i.resolved,
      })),
      active_constraints: constraints.map((c) => ({
        type: c.type,
        description: c.description,
      })),
      preferences: Object.fromEntries(prefs.map((p) => [p.key, p.value])),
      adaptation_history_count: adaptHistory.length,
      strength_history_summary: this.getStrengthSummary(normalized.client_id),
      recovery_patterns: this.getRecoveryPattern(normalized.client_id),
      last_voice_intent: voiceCtx[0]?.key as import('@/types/wispr').WisprIntent | undefined,
    };

    return {
      correlation_id: correlationId,
      client_id: normalized.client_id,
      session_id: normalized.session_id,
      tier: input.tier ?? 'free',
      trigger: normalized.trigger,
      timestamp: new Date().toISOString(),
      input_modality: normalized.modality,
      detected_intent: normalized.detected_intent,
      intent_confidence: normalized.intent_confidence,
      memory,
      bio_state: input.bio_state ?? {},
      coach_override: input.coach_override,
      mode: input.mode ?? 'client',
    };
  }

  private evaluateSafety(ctx: EnrichedHermesContext): SafetyGate {
    const activeInjuries = ctx.memory.injury_flags.filter((i) => !i.resolved);
    const highSeverity = activeInjuries.filter((i) => i.severity === 'high');
    const intent = ctx.detected_intent ?? '';
    const injuryIntent = INJURY_INTENTS.has(intent);
    const lowConfidence = (ctx.intent_confidence ?? 1) < 0.4;

    return {
      passed: highSeverity.length === 0 || injuryIntent,
      halt_training: highSeverity.length > 0 && !injuryIntent,
      requires_coach_approval:
        injuryIntent && ['knee_hurts', 'back_tight'].includes(intent) && !ctx.coach_override,
      blocked_actions: highSeverity.length > 0 ? ['increase_volume', 'max_effort'] : [],
      medical_disclaimer_required: injuryIntent,
      injury_aware_routing: activeInjuries.length > 0 || injuryIntent,
      confidence_floor: lowConfidence ? 0.4 : 0.6,
    };
  }

  private buildAgentRoutes(ctx: EnrichedHermesContext, normalized: NormalizedHermesInput, safety: SafetyGate): AgentRoute[] {
    const routes: AgentRoute[] = [];
    const intent = ctx.detected_intent ?? 'unknown';

    if (BIO_ALWAYS || normalized.ingest || normalized.modality === 'wearable' || normalized.modality === 'voice') {
      routes.push(
        route('ingestion-normalization', 'high', 'Bio data ingest or voice bio updates', 1),
        route('digital-twin-modeler', 'high', 'Maintain physiological model', 1),
        route('anomaly-risk-detection', 'high', 'Safety guard — parallel with predictive', 2),
        route('predictive-analytics', 'normal', 'Forecasts if Pro tier', 2),
        route('recovery-adaptation', 'high', 'Recovery analysis + adaptations', 3),
        route('insight-visualization', 'normal', 'Client/coach summaries', 4)
      );
    }

    if (WORKOUT_INTENTS.has(intent) || ctx.memory.injury_flags.some((i) => !i.resolved)) {
      routes.push(route('workout-programming', 'high', `Workout adaptation for intent: ${intent}`, 5));
    }

    if (NUTRITION_INTENTS.has(intent)) {
      routes.push(route('nutrition', 'normal', `Nutrition response for: ${intent}`, 5));
    }

    if (PROGRESS_INTENTS.has(intent)) {
      routes.push(route('progress-analyst', 'high', 'Progress summary requested', 5));
    }

    if (intent === 'build_program' || ctx.mode === 'coach') {
      routes.push(route('builder-studio', 'high', 'Program generation', 5));
    }

    if (normalized.modality === 'photo' || normalized.modality === 'video') {
      routes.push(route('ingestion-normalization', 'normal', 'Visual progress/form ingest', 1));
      routes.push(route('progress-analyst', 'normal', 'Posture/progress comparison', 5));
    }

    if (normalized.touch_action?.confirmed) {
      routes.push(route('recovery-adaptation', 'critical', 'Touch confirmation — apply adaptation', 5));
      routes.push(route('workout-programming', 'critical', 'Execute confirmed workout change', 5));
    }

    if (safety.halt_training) {
      routes.push(route('anomaly-risk-detection', 'critical', 'Halt training — escalate', 0));
    }

    return dedupeRoutes(routes);
  }

  private resolveConflicts(
    routes: AgentRoute[],
    ctx: EnrichedHermesContext,
    safety: SafetyGate
  ): ConflictRecord[] {
    const conflicts: ConflictRecord[] = [];
    const hasWorkout = routes.some((r) => r.agent_id === 'workout-programming');
    const hasRecovery = routes.some((r) => r.agent_id === 'recovery-adaptation');

    if (hasWorkout && hasRecovery && ctx.bio_state.overtraining_risk && ctx.bio_state.overtraining_risk > 60) {
      conflicts.push({
        agents: ['workout-programming', 'recovery-adaptation'],
        conflict_type: 'volume_vs_recovery',
        resolution: 'safety_overrides_performance',
        winning_action: 'reduce_volume',
        rationale: `Overtraining risk ${ctx.bio_state.overtraining_risk}% — recovery agent wins`,
      });
    }

    if (safety.requires_coach_approval && hasWorkout) {
      conflicts.push({
        agents: ['workout-programming', 'recovery-adaptation'],
        conflict_type: 'injury_auto_apply',
        resolution: 'defer_to_human',
        winning_action: 'coach_review',
        rationale: 'Injury intent detected — coach approval required before workout changes',
      });
    }

    if (ctx.coach_override) {
      conflicts.push({
        agents: ['hermes-fitness-supervisor' as AgentId],
        conflict_type: 'coach_override',
        resolution: 'coach_override_wins',
        rationale: 'Coach override active — human decision takes precedence',
      });
    }

    return conflicts;
  }

  private selectExecutionPlan(ctx: EnrichedHermesContext, routes: AgentRoute[]): ContextRouterDecision['routing']['execution_plan'] {
    const hasBio = routes.some((r) =>
      ['ingestion-normalization', 'digital-twin-modeler'].includes(r.agent_id)
    );
    const hasPeers = routes.some((r) =>
      ['workout-programming', 'nutrition', 'progress-analyst'].includes(r.agent_id)
    );

    if (hasBio && hasPeers) return 'parallel_bio_then_peers';
    if (hasPeers && !hasBio) return 'peer_only';
    return 'sequential';
  }

  private selectSupervisor(ctx: EnrichedHermesContext): ContextRouterDecision['routing']['primary_supervisor'] {
    const intent = ctx.detected_intent ?? '';
    const def = getIntentDefinition(intent as import('@/types/wispr').WisprIntent);
    if (def?.hermes_routing.triggered_agents.some((a) =>
      ['workout-programming', 'nutrition', 'builder-studio'].includes(a)
    ) && ctx.bio_state.recovery_score === undefined) {
      return 'hermes-fitness-supervisor';
    }
    return 'bio-modeling-supervisor';
  }

  private getStrengthSummary(clientId: string): string | undefined {
    const twin = queryMemory(clientId, { category: 'baseline', key: 'digital_twin' });
    if (twin.length === 0) return undefined;
    const state = twin[0].value as { performance?: { recentPRs?: string[] } };
    const prs = state.performance?.recentPRs;
    return prs?.length ? `Recent PRs: ${prs.join(', ')}` : undefined;
  }

  private getRecoveryPattern(clientId: string): string | undefined {
    const patterns = queryMemory(clientId, { category: 'pattern', key: 'recovery_trend' });
    if (patterns.length === 0) return undefined;
    return JSON.stringify(patterns[0].value);
  }
}

function route(
  agentId: AgentId,
  priority: RoutingPriority,
  reason: string,
  parallelGroup: number
): AgentRoute {
  return { agent_id: agentId, priority, reason, parallel_group: parallelGroup };
}

function dedupeRoutes(routes: AgentRoute[]): AgentRoute[] {
  const seen = new Set<string>();
  return routes.filter((r) => {
    if (seen.has(r.agent_id)) return false;
    seen.add(r.agent_id);
    return true;
  });
}

export const contextRouter = new HermesContextRouter();
