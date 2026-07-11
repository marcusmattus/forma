import { NextRequest, NextResponse } from 'next/server';
import { ingestBioData } from '@/lib/bio/engine';
import type { IngestPayload } from '@/types/bio';
import type { AgentTier } from '@/types/agent';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as IngestPayload & { tier?: AgentTier };
    const { tier, ...payload } = body;

    if (!payload.clientId || !payload.source || !payload.readings?.length) {
      return NextResponse.json(
        { error: 'clientId, source, and readings are required' },
        { status: 400 }
      );
    }

    const result = await ingestBioData(payload, tier ?? 'free');

    return NextResponse.json({
      success: true,
      context: result.context,
      trace: result.trace,
      actions: result.downstreamActions,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ingestion failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/bio/ingest',
    method: 'POST',
    description: 'Ingest biometric data from wearables, manual logs, or voice',
    schema: {
      clientId: 'string',
      source: 'oura | whoop | apple_health | garmin | manual | voice | ...',
      readings: [{ metricKey: 'string', value: 'number', unit: 'string?', recordedAt: 'ISO?' }],
      voiceTranscript: 'string?',
      tier: 'free | pro | coach | enterprise',
    },
  });
}
