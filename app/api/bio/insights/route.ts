import { NextRequest, NextResponse } from 'next/server';
import { getBioDashboard } from '@/lib/bio/engine';
import { buildMotionOSDocument } from '@/lib/bio/document';
import { processWisprVoice, MEDICAL_DISCLAIMER } from '@/lib/wispr/pipeline';
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
    const document = buildMotionOSDocument(result.context, { trace: result.trace });

    return NextResponse.json({
      document,
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

    const result = await processWisprVoice(
      { clientId, transcript, sessionId: sessionId ?? `wispr_${Date.now()}`, tier: tier ?? 'pro' },
      tier ?? 'pro'
    );

    return NextResponse.json({
      success: true,
      intentResult: result.intentResult,
      document: result.document,
      spokenFeedback: result.spokenFeedback,
      intent: result.intent,
      confidence: result.confidence,
      awaitingClarification: result.awaitingClarification,
      visualUpdates: result.visualUpdates,
      adaptations: result.document.adaptation_log,
      downstreamActions: result.document.downstream_actions,
      medicalDisclaimer: MEDICAL_DISCLAIMER,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Wispr voice adaptation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
