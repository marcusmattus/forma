import { NextRequest, NextResponse } from 'next/server';
import { hermesSupervisor } from '@/lib/hermes/supervisor';
import { contextRouter } from '@/lib/hermes/context-router';
import { normalizeMultimodalInput } from '@/lib/hermes/multimodal';
import type { HermesRequest } from '@/lib/hermes/supervisor';
import type { MultimodalInput } from '@/types/hermes-context';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as HermesRequest | MultimodalInput;

    // Direct multimodal input (new primary API shape)
    if ('modality' in body && 'client_id' in body) {
      const result = await hermesSupervisor.handle({
        clientId: body.client_id,
        intent: 'multimodal',
        payload: body as MultimodalInput,
        tier: (body as MultimodalInput & { tier?: string }).tier as HermesRequest['tier'],
        mode: (body as MultimodalInput & { mode?: 'client' | 'coach' }).mode,
      });
      return NextResponse.json(result);
    }

    const req = body as HermesRequest;
    if (!req.clientId || !req.intent) {
      return NextResponse.json({ error: 'clientId and intent are required' }, { status: 400 });
    }

    const result = await hermesSupervisor.handle(req);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Hermes orchestration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const preview = searchParams.get('preview_router');

  if (preview === 'true') {
    const sample = normalizeMultimodalInput({
      modality: 'voice',
      client_id: 'demo_client',
      session_id: 'preview',
      timestamp: new Date().toISOString(),
      payload: { type: 'voice', transcript: searchParams.get('utterance') ?? 'My knee hurts' },
    });
    const decision = contextRouter.route({ normalized: sample, tier: 'pro' });
    return NextResponse.json({ decision });
  }

  return NextResponse.json({
    system: 'HermesIntegrationLayer_v1.0',
    supervisor: 'hermes-fitness-supervisor',
    middleware: ['context-router'],
    sub_supervisors: ['bio-modeling-supervisor'],
    bio_agents: [
      'ingestion-normalization',
      'digital-twin-modeler',
      'predictive-analytics',
      'recovery-adaptation',
      'anomaly-risk-detection',
      'insight-visualization',
    ],
    peer_agents: [
      'assessment',
      'workout-programming',
      'nutrition',
      'progress-analyst',
      'habit-coach',
      'builder-studio',
    ],
    intents: ['bio_sync', 'bio_ingest', 'voice_adapt', 'builder_insights', 'full_pipeline', 'multimodal'],
    modalities: ['voice', 'wearable', 'photo', 'video', 'manual', 'text', 'touch'],
    schemas: [
      'schemas/motionos-bio-tracking.schema.json',
      'schemas/wispr-intent.schema.json',
      'schemas/hermes-context-router.schema.json',
    ],
    docs: 'docs/hermes-integration-layer.md',
    router_preview: 'GET ?preview_router=true&utterance=My+knee+hurts',
  });
}
