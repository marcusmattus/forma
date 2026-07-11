/**
 * Fitness Proofing — Safety guardrails for bio-driven adaptations
 * MotionOS / Hermes Fit
 */

import type { AdaptationRecommendation, DigitalTwinState, InjuryFlag } from '@/types/bio';
import type { AdaptationLogEntry, FitnessProofingState } from '@/types/motionos';

export const MEDICAL_DISCLAIMER =
  'MotionOS adaptations are coaching suggestions, not medical advice. Consult a healthcare professional for pain, injury, or health concerns.';

export const DEFAULT_PROOFING: FitnessProofingState = {
  safety_mechanisms: {
    human_coach_override: true,
    medical_disclaimer_on_adaptations: true,
    progressive_overload_limits: {
      max_weekly_volume_increase_pct: 10,
      max_intensity_increase_pct: 5,
    },
    injury_history_weighting: 0.85,
  },
  robustness: {
    offline_mode_fallback: true,
    data_validation: true,
    multi_source_cross_checking: true,
    confidence_scoring_on_all_predictions: true,
  },
  halt_training: false,
  blocked_adaptations: [],
};

export interface ProofingResult {
  approved: AdaptationRecommendation[];
  blocked: Array<{ adaptation: AdaptationRecommendation; reason: string }>;
  modified: AdaptationRecommendation[];
  proofing: FitnessProofingState;
  logEntries: AdaptationLogEntry[];
}

export function applyFitnessProofing(
  adaptations: AdaptationRecommendation[],
  twin: DigitalTwinState,
  options?: {
    coachOverride?: boolean;
    trigger?: AdaptationLogEntry['trigger'];
    voiceIntent?: AdaptationLogEntry['voice_intent'];
  }
): ProofingResult {
  const proofing = { ...DEFAULT_PROOFING };
  const approved: AdaptationRecommendation[] = [];
  const blocked: Array<{ adaptation: AdaptationRecommendation; reason: string }> = [];
  const modified: AdaptationRecommendation[] = [];
  const logEntries: AdaptationLogEntry[] = [];

  const activeInjuries = twin.injuryFlags.filter((f) => !f.resolved);
  const highSeverityInjuries = activeInjuries.filter((f) => f.severity === 'high');

  if (highSeverityInjuries.length > 0) {
    proofing.halt_training = true;
  }

  for (const adaptation of adaptations) {
    let current = { ...adaptation };
    let blocked_reason: string | null = null;

    if (proofing.halt_training && current.type !== 'recovery') {
      blocked_reason = 'Training halted due to active high-severity injury';
    }

    if (current.magnitude === 'major' && !options?.coachOverride) {
      current = { ...current, autoApply: false, requiresCoachApproval: true };
    }

    if (current.type === 'volume' && !wouldPassOverloadLimits(twin, current)) {
      current = {
        ...current,
        description: current.description.replace(/\d+%/, '10%'),
        magnitude: 'minor',
        rationale: `${current.rationale} [Capped by progressive overload limits]`,
      };
      modified.push(current);
    }

    if (involvesInjuredArea(current, activeInjuries)) {
      current = {
        ...current,
        autoApply: false,
        requiresCoachApproval: true,
        rationale: `${current.rationale} [Injury history weighting applied]`,
      };
      modified.push(current);
    }

    if (blocked_reason) {
      blocked.push({ adaptation: current, reason: blocked_reason });
      proofing.blocked_adaptations.push(current.id);
    } else {
      approved.push(current);
    }

    logEntries.push({
      id: `log_${current.id}`,
      type: current.type,
      description: current.description,
      magnitude: current.magnitude,
      trigger: options?.trigger ?? 'voice_intent',
      voice_intent: options?.voiceIntent,
      auto_applied: current.autoApply && !current.requiresCoachApproval,
      requires_coach_approval: current.requiresCoachApproval,
      coach_approved: options?.coachOverride ? true : null,
      applied_at: new Date().toISOString(),
      affected_domains: current.affectedDomains,
      safety_check_passed: !blocked_reason,
      medical_disclaimer_shown: DEFAULT_PROOFING.safety_mechanisms.medical_disclaimer_on_adaptations,
      rationale: current.rationale,
    });
  }

  return { approved, blocked, modified, proofing, logEntries };
}

function wouldPassOverloadLimits(
  twin: DigitalTwinState,
  adaptation: AdaptationRecommendation
): boolean {
  if (adaptation.type !== 'volume') return true;
  const volumeMatch = adaptation.description.match(/(\d+)%/);
  if (!volumeMatch) return true;
  const proposedIncrease = parseInt(volumeMatch[1], 10);
  return proposedIncrease <= DEFAULT_PROOFING.safety_mechanisms.progressive_overload_limits.max_weekly_volume_increase_pct;
}

function involvesInjuredArea(
  adaptation: AdaptationRecommendation,
  injuries: InjuryFlag[]
): boolean {
  if (injuries.length === 0) return false;
  const desc = adaptation.description.toLowerCase();
  return injuries.some((inj) => desc.includes(inj.bodyPart.toLowerCase()));
}

export function validateBioReading(
  metricKey: string,
  value: number,
  source: string
): { valid: boolean; confidence: number; reason?: string } {
  const ranges: Record<string, { min: number; max: number }> = {
    hrv: { min: 10, max: 200 },
    sleep_score: { min: 0, max: 100 },
    soreness: { min: 0, max: 10 },
    stress: { min: 0, max: 10 },
    body_weight: { min: 30, max: 300 },
    resting_hr: { min: 30, max: 120 },
  };

  const range = ranges[metricKey];
  if (!range) return { valid: true, confidence: source === 'manual' ? 0.9 : 0.85 };

  if (value < range.min || value > range.max) {
    return { valid: false, confidence: 0, reason: `${metricKey} value ${value} outside valid range` };
  }

  const confidence = source === 'voice' ? 0.7 : source === 'manual' ? 0.9 : 0.85;
  return { valid: true, confidence };
}
