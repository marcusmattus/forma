import { NextRequest, NextResponse } from 'next/server';
import { hermesSupervisor } from '@/lib/hermes/supervisor';
import type { HermesRequest } from '@/lib/hermes/supervisor';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as HermesRequest;

    if (!body.clientId || !body.intent) {
      return NextResponse.json(
        { error: 'clientId and intent are required' },
        { status: 400 }
      );
    }

    const result = await hermesSupervisor.handle(body);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Hermes orchestration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    supervisor: 'hermes-fitness-supervisor',
    childSupervisors: ['bio-modeling-supervisor'],
    intents: ['bio_sync', 'bio_ingest', 'voice_adapt', 'builder_insights', 'full_pipeline'],
    bioAgents: [
      'ingestion-normalization',
      'digital-twin-modeler',
      'predictive-analytics',
      'recovery-adaptation',
      'anomaly-risk-detection',
      'insight-visualization',
    ],
    peerAgents: [
      'assessment',
      'workout-programming',
      'nutrition',
      'progress-analyst',
      'habit-coach',
      'builder-studio',
    ],
  });
}
