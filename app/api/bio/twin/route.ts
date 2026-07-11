import { NextRequest, NextResponse } from 'next/server';
import { getBioDashboard } from '@/lib/bio/engine';
import { buildMotionOSDocument } from '@/lib/bio/document';
import type { AgentTier } from '@/types/agent';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const tier = (searchParams.get('tier') ?? 'free') as AgentTier;

    if (!clientId) {
      return NextResponse.json({ error: 'clientId query param required' }, { status: 400 });
    }

    const result = await getBioDashboard(clientId, tier, 'client');
    const document = buildMotionOSDocument(result.context, { trace: result.trace });

    return NextResponse.json({
      document,
      twin: result.context.twin,
      unifiedScores: result.context.twin.unifiedScores,
      insights: result.context.insights,
      visualizations: result.context.insights
        .flatMap((i) => i.visualizations ?? [])
        .filter((v, idx, arr) => arr.findIndex((x) => x.title === v.title) === idx),
      trace: result.trace,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Twin fetch failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
