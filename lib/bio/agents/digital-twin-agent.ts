/**
 * Digital Twin Modeler Agent (Core Agentic Modeling)
 * Maintains dynamic physiological model, runs what-if simulations
 */

import { BaseAgent } from '@/lib/hermes/agent-base';
import { getClientMemory, storeMemory, updateTwinInMemory } from '@/lib/hermes/memory';
import {
  computeAllUnifiedScores,
  computeTrend,
  createEmptyTwin,
  getLatestReading,
} from '@/lib/bio/scores';
import type { AgentContext } from '@/types/agent';
import type {
  BioReading,
  DigitalTwinState,
  WhatIfScenario,
  WhatIfChange,
  UnifiedScoreKey,
} from '@/types/bio';

export interface TwinModelerInput {
  clientId: string;
  readings: BioReading[];
  whatIf?: WhatIfChange[];
}

export interface TwinModelerResult {
  twin: DigitalTwinState;
  whatIfResults?: WhatIfScenario[];
  modelConfidence: number;
}

export class DigitalTwinModelerAgent extends BaseAgent<TwinModelerInput, TwinModelerResult> {
  id = 'digital-twin-modeler' as const;
  name = 'Digital Twin Modeler Agent';
  description = 'Maintains dynamic physiological model and runs what-if simulations';
  tier = 'pro' as const;

  async run(input: TwinModelerInput, ctx: AgentContext): Promise<TwinModelerResult> {
    let twin = this.loadTwin(input.clientId) ?? createEmptyTwin(input.clientId);

    twin = this.updateStructural(twin, input.readings);
    twin = this.updateRecovery(twin, input.readings);
    twin = this.updatePerformance(twin, input.readings);
    twin = this.updateBaselines(twin, input.readings);
    twin = this.updateTrends(twin, input.readings);

    twin.unifiedScores = computeAllUnifiedScores(input.readings, twin);
    twin.version += 1;
    twin.updatedAt = new Date().toISOString();

    updateTwinInMemory(twin);

    let whatIfResults: WhatIfScenario[] | undefined;
    if (input.whatIf && input.whatIf.length > 0) {
      whatIfResults = input.whatIf.map((change) => this.simulateWhatIf(twin, [change]));
    }

    const dataPoints = input.readings.length;
    const modelConfidence = Math.min(0.95, 0.2 + dataPoints * 0.05);

    return { twin, whatIfResults, modelConfidence };
  }

  private loadTwin(clientId: string): DigitalTwinState | null {
    const profile = getClientMemory(clientId);
    const entry = profile.entries.find(
      (e) => e.category === 'baseline' && e.key === 'digital_twin'
    );
    return (entry?.value as DigitalTwinState) ?? null;
  }

  private updateStructural(twin: DigitalTwinState, readings: BioReading[]): DigitalTwinState {
    const weight = getLatestReading(readings, 'body_weight');
    const bodyFat = getLatestReading(readings, 'body_fat_pct');
    const muscle = getLatestReading(readings, 'muscle_mass');

    return {
      ...twin,
      structural: {
        ...twin.structural,
        weight: weight?.value ?? twin.structural.weight,
        bodyFatPct: bodyFat?.value ?? twin.structural.bodyFatPct,
        muscleMass: muscle?.value ?? twin.structural.muscleMass,
        lastUpdated: new Date().toISOString(),
      },
    };
  }

  private updateRecovery(twin: DigitalTwinState, readings: BioReading[]): DigitalTwinState {
    const hrv = getLatestReading(readings, 'hrv');
    const sleep = getLatestReading(readings, 'sleep_duration');
    const soreness = getLatestReading(readings, 'soreness');
    const stress = getLatestReading(readings, 'stress');

    const sleepDebt =
      sleep && sleep.value < 7
        ? twin.recovery.sleepDebtHours + (7 - sleep.value)
        : Math.max(0, twin.recovery.sleepDebtHours - 0.5);

    const recoveryScore = twin.unifiedScores.find((s) => s.key === 'recovery_score');

    return {
      ...twin,
      recovery: {
        hrvBaseline: twin.recovery.hrvBaseline ?? hrv?.value ?? null,
        hrvCurrent: hrv?.value ?? twin.recovery.hrvCurrent,
        sleepDebtHours: Math.round(sleepDebt * 10) / 10,
        sorenessLevel: soreness?.value ?? twin.recovery.sorenessLevel,
        stressLevel: stress?.value ?? twin.recovery.stressLevel,
        readinessScore: recoveryScore?.value ?? twin.recovery.readinessScore,
        lastUpdated: new Date().toISOString(),
      },
    };
  }

  private updatePerformance(twin: DigitalTwinState, readings: BioReading[]): DigitalTwinState {
    const strain = getLatestReading(readings, 'strain');
    const loadScore = twin.unifiedScores.find((s) => s.key === 'load_score');

    const volumeTolerance = strain
      ? Math.min(100, twin.performance.volumeTolerance + (strain.value > 15 ? -5 : 2))
      : twin.performance.volumeTolerance;

    return {
      ...twin,
      performance: {
        ...twin.performance,
        volumeTolerance: Math.max(0, Math.min(100, volumeTolerance)),
        plateauRisk: loadScore && loadScore.value > 70 ? twin.performance.plateauRisk + 3 : 0,
        lastUpdated: new Date().toISOString(),
      },
    };
  }

  private updateBaselines(twin: DigitalTwinState, readings: BioReading[]): DigitalTwinState {
    const baselines = { ...twin.baselines };
    for (const reading of readings) {
      if (!baselines[reading.metricKey]) {
        baselines[reading.metricKey] = reading.value;
      } else {
        baselines[reading.metricKey] =
          baselines[reading.metricKey] * 0.9 + reading.value * 0.1;
      }
    }
    return { ...twin, baselines };
  }

  private updateTrends(twin: DigitalTwinState, readings: BioReading[]): DigitalTwinState {
    const trends = { ...twin.trends };
    const keys = [...new Set(readings.map((r) => r.metricKey))];
    for (const key of keys) {
      const keyReadings = readings.filter((r) => r.metricKey === key);
      trends[key] = computeTrend(keyReadings);
    }
    return { ...twin, trends };
  }

  simulateWhatIf(twin: DigitalTwinState, changes: WhatIfChange[]): WhatIfScenario {
    const projected: Partial<Record<UnifiedScoreKey, number>> = {};

    for (const change of changes) {
      if (change.variable === 'training_volume') {
        const volumeDelta = (change.proposedValue - change.currentValue) / change.currentValue;
        projected.load_score = Math.min(
          100,
          (twin.unifiedScores.find((s) => s.key === 'load_score')?.value ?? 50) *
            (1 + volumeDelta * 0.5)
        );
        projected.recovery_score = Math.max(
          0,
          (twin.unifiedScores.find((s) => s.key === 'recovery_score')?.value ?? 50) *
            (1 - volumeDelta * 0.3)
        );
        projected.overtraining_risk = Math.min(
          100,
          (twin.unifiedScores.find((s) => s.key === 'overtraining_risk')?.value ?? 20) +
            volumeDelta * 30
        );
      }
      if (change.variable === 'sleep_hours') {
        const sleepDelta = change.proposedValue - change.currentValue;
        projected.recovery_score = Math.min(
          100,
          (twin.unifiedScores.find((s) => s.key === 'recovery_score')?.value ?? 50) +
            sleepDelta * 8
        );
      }
      if (change.variable === 'deload') {
        projected.load_score = Math.max(
          0,
          (twin.unifiedScores.find((s) => s.key === 'load_score')?.value ?? 50) * 0.6
        );
        projected.recovery_score = Math.min(
          100,
          (twin.unifiedScores.find((s) => s.key === 'recovery_score')?.value ?? 50) * 1.2
        );
        projected.overtraining_risk = Math.max(
          0,
          (twin.unifiedScores.find((s) => s.key === 'overtraining_risk')?.value ?? 20) * 0.4
        );
      }
    }

    return {
      id: `whatif_${Date.now()}`,
      name: changes.map((c) => c.variable).join(' + '),
      changes,
      projectedOutcome: projected as Record<UnifiedScoreKey, number>,
      confidence: 0.65,
    };
  }
}

export const digitalTwinAgent = new DigitalTwinModelerAgent();
