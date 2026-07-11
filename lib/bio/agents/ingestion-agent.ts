/**
 * Ingestion & Normalization Agent
 * Ingests wearable/manual/voice data → unified scores
 */

import { BaseAgent } from '@/lib/hermes/agent-base';
import { imputeMissingMetric, storeMemory, getClientMemory } from '@/lib/hermes/memory';
import { normalizeToScale } from '@/lib/bio/scores';
import type { AgentContext } from '@/types/agent';
import type { BioReading, BioMetricKey, IngestPayload, UnifiedScore } from '@/types/bio';

export interface IngestionResult {
  readings: BioReading[];
  normalized: BioReading[];
  imputed: BioReading[];
  unifiedScores: UnifiedScore[];
  missingMetrics: BioMetricKey[];
}

const EXPECTED_DAILY_METRICS: BioMetricKey[] = [
  'hrv',
  'sleep_score',
  'steps',
  'resting_hr',
  'body_weight',
];

export class IngestionNormalizationAgent extends BaseAgent<IngestPayload, IngestionResult> {
  id = 'ingestion-normalization' as const;
  name = 'Ingestion & Normalization Agent';
  description = 'Ingests and normalizes biometric data from all sources into unified scores';
  tier = 'free' as const;

  async run(input: IngestPayload, ctx: AgentContext): Promise<IngestionResult> {
    const now = new Date().toISOString();
    const existingReadings = this.getStoredReadings(input.clientId);

    const readings: BioReading[] = input.readings.map((r, i) => ({
      id: `reading_${Date.now()}_${i}`,
      clientId: input.clientId,
      metricKey: r.metricKey,
      value: r.value,
      unit: r.unit ?? this.defaultUnit(r.metricKey),
      source: input.source,
      recordedAt: r.recordedAt ?? now,
      ingestedAt: now,
      confidence: input.source === 'manual' ? 0.9 : 0.85,
      rawPayload: r.rawPayload,
      normalized: false,
    }));

    if (input.voiceTranscript) {
      const voiceReadings = this.parseVoiceInput(input.clientId, input.voiceTranscript, input.source);
      readings.push(...voiceReadings);
    }

    const normalized = readings.map((r) => ({
      ...r,
      normalized: true,
      value: this.normalizeValue(r),
    }));

    const allReadings = [...existingReadings, ...normalized];
    this.storeReadings(input.clientId, allReadings);

    const receivedKeys = new Set(normalized.map((r) => r.metricKey));
    const missingMetrics = EXPECTED_DAILY_METRICS.filter((k) => !receivedKeys.has(k));
    const imputed: BioReading[] = [];

    for (const key of missingMetrics) {
      const imputation = imputeMissingMetric(input.clientId, key, allReadings);
      if (imputation) {
        imputed.push({
          id: `imputed_${Date.now()}_${key}`,
          clientId: input.clientId,
          metricKey: key,
          value: imputation.value,
          unit: this.defaultUnit(key),
          source: 'manual',
          recordedAt: now,
          ingestedAt: now,
          confidence: imputation.confidence,
          normalized: true,
        });
        storeMemory(input.clientId, 'missing_data_imputation', key, imputation, this.id);
      }
    }

    const finalReadings = [...allReadings, ...imputed];

    return {
      readings: normalized,
      normalized,
      imputed,
      unifiedScores: [],
      missingMetrics,
    };
  }

  private parseVoiceInput(
    clientId: string,
    transcript: string,
    source: IngestPayload['source']
  ): BioReading[] {
    const lower = transcript.toLowerCase();
    const now = new Date().toISOString();
    const voiceReadings: BioReading[] = [];

    const sorenessMatch = lower.match(/sore(?:ness)?\s*(?:level\s*)?(\d+)/);
    if (sorenessMatch || lower.includes('sore')) {
      voiceReadings.push({
        id: `voice_${Date.now()}_soreness`,
        clientId,
        metricKey: 'soreness',
        value: sorenessMatch ? parseInt(sorenessMatch[1], 10) : 7,
        unit: '1-10',
        source: 'voice',
        recordedAt: now,
        ingestedAt: now,
        confidence: 0.75,
        normalized: true,
      });
    }

    if (lower.includes('stressed') || lower.includes('stress')) {
      voiceReadings.push({
        id: `voice_${Date.now()}_stress`,
        clientId,
        metricKey: 'stress',
        value: lower.includes('very') ? 8 : 6,
        unit: '1-10',
        source: 'voice',
        recordedAt: now,
        ingestedAt: now,
        confidence: 0.7,
        normalized: true,
      });
    }

    if (lower.includes('slept') || lower.includes('sleep')) {
      const hoursMatch = lower.match(/(\d+(?:\.\d+)?)\s*hours?/);
      voiceReadings.push({
        id: `voice_${Date.now()}_sleep`,
        clientId,
        metricKey: 'sleep_duration',
        value: hoursMatch ? parseFloat(hoursMatch[1]) : 6,
        unit: 'hours',
        source: 'voice',
        recordedAt: now,
        ingestedAt: now,
        confidence: hoursMatch ? 0.8 : 0.5,
        normalized: true,
      });
    }

    return voiceReadings;
  }

  private normalizeValue(reading: BioReading): number {
    if (reading.metricKey === 'body_weight' || reading.metricKey === 'steps') {
      return reading.value;
    }
    return normalizeToScale(reading.value, reading.metricKey);
  }

  private defaultUnit(key: BioMetricKey): string {
    const units: Partial<Record<BioMetricKey, string>> = {
      hrv: 'ms',
      resting_hr: 'bpm',
      sleep_duration: 'hours',
      sleep_score: '0-100',
      steps: 'count',
      body_weight: 'kg',
      body_fat_pct: '%',
      soreness: '1-10',
      stress: '1-10',
      strain: '0-21',
      readiness: '0-100',
    };
    return units[key] ?? 'unit';
  }

  private getStoredReadings(clientId: string): BioReading[] {
    const profile = getClientMemory(clientId);
    const entry = profile.entries.find((e) => e.key === 'bio_readings');
    return (entry?.value as BioReading[]) ?? [];
  }

  private storeReadings(clientId: string, readings: BioReading[]): void {
    storeMemory(clientId, 'pattern', 'bio_readings', readings, this.id);
  }
}

export const ingestionAgent = new IngestionNormalizationAgent();
