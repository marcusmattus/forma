import { NextRequest, NextResponse } from 'next/server';
import { processWisprVoice, getProactiveCoaching, MEDICAL_DISCLAIMER } from '@/lib/wispr/pipeline';
import type { AgentTier } from '@/types/agent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, transcript, sessionId, tier, mode } = body;

    if (!clientId || !transcript) {
      return NextResponse.json({ error: 'clientId and transcript are required' }, { status: 400 });
    }

    const result = await processWisprVoice(
      {
        clientId,
        transcript,
        sessionId: sessionId ?? `wispr_${Date.now()}`,
        tier: tier ?? 'pro',
        mode: mode ?? 'client',
      },
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
      medicalDisclaimer: MEDICAL_DISCLAIMER,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Voice turn failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');
  const proactive = searchParams.get('proactive') === 'true';

  if (!clientId) {
    return NextResponse.json({ error: 'clientId required' }, { status: 400 });
  }

  if (proactive) {
    const prompt = await getProactiveCoaching(clientId, (searchParams.get('tier') ?? 'pro') as AgentTier);
    return NextResponse.json({ proactive: prompt });
  }

  return NextResponse.json({
    endpoint: '/api/bio/voice',
    methods: { POST: 'Process voice turn (multi-turn supported)', GET: '?proactive=true for Pattern E' },
    patterns: ['A: status_update_adaptation', 'B: constraint_based_planning', 'C: progress_motivation', 'D: deep_query', 'E: proactive_coaching'],
    schema: 'schemas/wispr-intent.schema.json',
  });
}
