import { NextRequest, NextResponse } from 'next/server';
import { processVoiceAdaptation, getBioDashboard } from '@/lib/bio/engine';
import type { AgentTier } from '@/types/agent';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const tier = (searchParams.get('tier') ?? 'free') as AgentTier;
    const audience = (searchParams.get('audience') ?? 'client') as 'client' | 'coach';

    if (!clientId) {
      return NextResponse.json({ error: 'clientId query param required' }, { status: 400 });
    }

    const result = await getBioDashboard(clientId, tier, audience);

    return NextResponse.json({
      insights: result.context.insights,
      predictions: result.context.predictions,
      anomalies: result.context.anomalies,
      coachingSummary: result.context.insights.find((i) => i.category === 'summary')?.body,
      tier: tier === 'free' ? 'basic' : 'advanced',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Insights fetch failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, transcript, sessionId, tier } = body;

    if (!clientId || !transcript) {
      return NextResponse.json(
        { error: 'clientId and transcript are required' },
        { status: 400 }
      );
    }

    const result = await processVoiceAdaptation(
      { clientId, transcript, sessionId: sessionId ?? `voice_${Date.now()}` },
      tier ?? 'free'
    );

    return NextResponse.json({
      success: true,
      adaptations: result.context.adaptations,
      insights: result.context.insights,
      actions: result.downstreamActions,
      trace: result.trace,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Voice adaptation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
