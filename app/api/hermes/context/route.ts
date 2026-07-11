import { NextRequest, NextResponse } from 'next/server';
import { contextRouter } from '@/lib/hermes/context-router';
import { normalizeMultimodalInput } from '@/lib/hermes/multimodal';
import type { MultimodalInput } from '@/types/hermes-context';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, tier, mode, coach_override, bio_state } = body;

    if (!input?.modality || !input?.client_id) {
      return NextResponse.json({ error: 'input.modality and input.client_id required' }, { status: 400 });
    }

    const normalized = normalizeMultimodalInput(input as MultimodalInput);
    const decision = contextRouter.route({ normalized, tier, mode, coach_override, bio_state });

    return NextResponse.json({ decision });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Context routing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    agent: 'context-router',
    role: 'Central intelligence middleware',
    capabilities: [
      'Enrich with Hermes Long-Term Memory',
      'Detect intents (Wispr registry)',
      'Route and prioritize agents',
      'Resolve conflicts',
      'Safety gating',
      'Multimodal handoff suggestions',
    ],
    schema: 'schemas/hermes-context-router.schema.json',
  });
}
