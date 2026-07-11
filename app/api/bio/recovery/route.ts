import { NextRequest, NextResponse } from 'next/server';
import { getBioDashboard } from '@/lib/bio/engine';
import type { AgentTier } from '@/types/agent';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const tier = (searchParams.get('tier') ?? 'free') as AgentTier;

    if (!clientId) {
      return NextResponse.json({ error: 'clientId query param required' }, { status: 400 });
    }

    const result = await getBioDashboard(clientId, tier);
    const recovery = result.context.twin.unifiedScores.find((s) => s.key === 'recovery_score');
    const load = result.context.twin.unifiedScores.find((s) => s.key === 'load_score');
    const overtraining = result.context.twin.unifiedScores.find(
      (s) => s.key === 'overtraining_risk'
    );

    return NextResponse.json({
      recoveryScore: recovery?.value ?? null,
      loadScore: load?.value ?? null,
      overtrainingRisk: overtraining?.value ?? null,
      readiness: result.context.twin.recovery.readinessScore,
      sleepDebtHours: result.context.twin.recovery.sleepDebtHours,
      sorenessLevel: result.context.twin.recovery.sorenessLevel,
      adaptations: result.context.adaptations,
      recommendations: result.context.adaptations.map((a) => ({
        type: a.type,
        description: a.description,
        autoApply: a.autoApply,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Recovery fetch failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
