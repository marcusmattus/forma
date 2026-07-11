/**
 * MotionOS Bio Document Builder
 * Converts pipeline context → MotionOS_BioTracking_v1.0 JSON contract
 */

import type { BioTrackingContext } from '@/types/bio';
import type { MotionOSBioDocument, WisprVoiceLayer } from '@/types/motionos';
import type { OrchestrationTrace } from '@/types/agent';
import type { ProofingResult } from '@/lib/bio/fitness-proofing';
import { DEFAULT_PROOFING } from '@/lib/bio/fitness-proofing';

export function buildMotionOSDocument(
  context: BioTrackingContext,
  options?: {
    correlationId?: string;
    voiceLayer?: Partial<WisprVoiceLayer>;
    proofing?: ProofingResult;
    trace?: OrchestrationTrace;
  }
): MotionOSBioDocument {
  const twin = context.twin;
  const recovery = twin.recovery;
  const structural = twin.structural;

  return {
    system: 'MotionOS_BioTracking_v1.0',
    client_id: context.clientId,
    timestamp: new Date().toISOString(),
    orchestration: {
      layer: 'Hermes',
      supervisor: 'BioModelingSupervisor',
      main_orchestrator: 'FitnessSupervisor',
      memory_store: 'HermesLongTermMemory',
      context_sharing: 'structured_context_passing',
      correlation_id: options?.correlationId,
      pipeline_status: options?.trace?.finalStatus ?? 'completed',
    },
    voice_layer: options?.voiceLayer
      ? {
          provider: 'Wispr',
          capabilities: [
            'natural_language_updates',
            'real_time_adaptation_triggers',
            'spoken_coaching_feedback',
            'intent_detection',
          ],
          ...options.voiceLayer,
        }
      : undefined,
    bio_profile: {
      structural: {
        weight_kg: structural.weight ?? undefined,
        body_fat_pct: structural.bodyFatPct ?? undefined,
        muscle_mass_kg: structural.muscleMass ?? undefined,
        measurements: structural.measurements,
      },
      performance: {
        strength_trend: twin.performance.strengthTrend,
        volume_tolerance_pct: twin.performance.volumeTolerance,
        recent_prs: twin.performance.recentPRs,
        plateau_risk_pct: twin.performance.plateauRisk,
      },
      recovery: {
        hrv: recovery.hrvCurrent ?? undefined,
        hrv_baseline: recovery.hrvBaseline ?? undefined,
        sleep_debt_hours: recovery.sleepDebtHours,
        soreness: recovery.sorenessLevel,
        stress: recovery.stressLevel,
        recovery_score: twin.unifiedScores.find((s) => s.key === 'recovery_score')?.value,
        readiness_score: recovery.readinessScore,
      },
      contextual: {
        injuries: twin.injuryFlags.map((f) => ({
          id: f.id,
          body_part: f.bodyPart,
          severity: f.severity,
          detected_at: f.detectedAt,
          source: f.source,
          resolved: f.resolved,
        })),
        travel: twin.constraints.some((c) => c.type === 'travel' && c.active),
        menstrual_phase: null,
        voice_notes: [],
      },
    },
    digital_twin: {
      status: options?.proofing?.proofing.halt_training ? 'halted' : 'active',
      version: twin.version,
      last_synced: twin.updatedAt,
      model_confidence: 0.75,
      unified_scores: twin.unifiedScores.map((s) => ({
        key: s.key,
        value: s.value,
        scale: s.scale,
        confidence: s.confidence,
        explanation: s.explanation,
        computed_at: s.computedAt,
      })),
      predictions: context.predictions.map((p) => ({
        id: p.id,
        type: p.type,
        confidence: p.confidence,
        timeline: p.timeline,
        description: p.description,
        actionable_by: p.actionableBy,
        recommended_actions: p.recommendedActions,
      })),
      simulations: [],
      trends: Object.fromEntries(
        Object.entries(twin.trends).map(([k, v]) => [
          k,
          { slope: v.slope, direction: v.direction, window_days: v.windowDays, confidence: v.confidence },
        ])
      ),
    },
    adaptation_log: options?.proofing?.logEntries ?? [],
    fitness_proofing: options?.proofing?.proofing ?? DEFAULT_PROOFING,
    downstream_actions: context.adaptations.flatMap((a) =>
      a.affectedDomains.map((domain) => ({
        target_agent: (domain === 'workout'
          ? 'workout-programming'
          : domain === 'habits'
            ? 'habit-coach'
            : domain) as 'workout-programming' | 'nutrition' | 'habit-coach',
        action_type: `adapt_${a.type}`,
        payload: { adaptation: a },
        priority: (a.magnitude === 'major' ? 'high' : 'medium') as 'high' | 'medium',
        requires_approval: a.requiresCoachApproval,
      }))
    ),
  };
}
