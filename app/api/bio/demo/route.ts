import { NextResponse } from 'next/server';
import { ingestBioData } from '@/lib/bio/engine';

const DEMO_READINGS = [
  { metricKey: 'hrv' as const, value: 52, unit: 'ms' },
  { metricKey: 'sleep_score' as const, value: 78 },
  { metricKey: 'sleep_duration' as const, value: 7.2, unit: 'hours' },
  { metricKey: 'readiness' as const, value: 72 },
  { metricKey: 'steps' as const, value: 8420 },
  { metricKey: 'strain' as const, value: 12.4 },
  { metricKey: 'resting_hr' as const, value: 58, unit: 'bpm' },
  { metricKey: 'body_weight' as const, value: 78.5, unit: 'kg' },
  { metricKey: 'soreness' as const, value: 3 },
  { metricKey: 'stress' as const, value: 4 },
  { metricKey: 'active_calories' as const, value: 520 },
];

export async function POST() {
  const result = await ingestBioData(
    {
      clientId: 'demo_client',
      source: 'oura',
      readings: DEMO_READINGS,
    },
    'pro'
  );

  return NextResponse.json({
    seeded: true,
    recoveryScore: result.context.twin.unifiedScores.find((s) => s.key === 'recovery_score')?.value,
    loadScore: result.context.twin.unifiedScores.find((s) => s.key === 'load_score')?.value,
    insights: result.context.insights.length,
    adaptations: result.context.adaptations.length,
  });
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/bio/demo',
    method: 'POST',
    description: 'Seeds demo_client with sample Oura biometric data',
  });
}
