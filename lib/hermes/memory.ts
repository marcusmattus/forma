/**
 * Hermes Long-Term Memory
 * Shared context store for all agents — client history, preferences, patterns
 */

import type { BioReading, DigitalTwinState, TwinConstraint, InjuryFlag } from '@/types/bio';

export interface MemoryEntry {
  id: string;
  clientId: string;
  category: MemoryCategory;
  key: string;
  value: unknown;
  source: string;
  createdAt: string;
  expiresAt?: string;
  relevance: number;
}

export type MemoryCategory =
  | 'preference'
  | 'injury_history'
  | 'pattern'
  | 'baseline'
  | 'coach_note'
  | 'voice_context'
  | 'adaptation_history'
  | 'missing_data_imputation';

export interface ClientMemoryProfile {
  clientId: string;
  entries: MemoryEntry[];
  lastAccessedAt: string;
}

const memoryStore = new Map<string, ClientMemoryProfile>();

export function getClientMemory(clientId: string): ClientMemoryProfile {
  const existing = memoryStore.get(clientId);
  if (existing) {
    existing.lastAccessedAt = new Date().toISOString();
    return existing;
  }
  const profile: ClientMemoryProfile = {
    clientId,
    entries: [],
    lastAccessedAt: new Date().toISOString(),
  };
  memoryStore.set(clientId, profile);
  return profile;
}

export function storeMemory(
  clientId: string,
  category: MemoryCategory,
  key: string,
  value: unknown,
  source: string,
  options?: { expiresAt?: string; relevance?: number }
): MemoryEntry {
  const profile = getClientMemory(clientId);
  const entry: MemoryEntry = {
    id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    clientId,
    category,
    key,
    value,
    source,
    createdAt: new Date().toISOString(),
    expiresAt: options?.expiresAt,
    relevance: options?.relevance ?? 1,
  };
  profile.entries.push(entry);
  return entry;
}

export function queryMemory(
  clientId: string,
  filters?: { category?: MemoryCategory; key?: string; minRelevance?: number }
): MemoryEntry[] {
  const profile = getClientMemory(clientId);
  return profile.entries.filter((e) => {
    if (filters?.category && e.category !== filters.category) return false;
    if (filters?.key && e.key !== filters.key) return false;
    if (filters?.minRelevance && e.relevance < filters.minRelevance) return false;
    if (e.expiresAt && new Date(e.expiresAt) < new Date()) return false;
    return true;
  });
}

export function getMemorySnippets(clientId: string, limit = 10): string[] {
  const entries = queryMemory(clientId)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
  return entries.map((e) => `[${e.category}] ${e.key}: ${JSON.stringify(e.value)}`);
}

/**
 * Impute missing biometric data using historical patterns from memory
 */
export function imputeMissingMetric(
  clientId: string,
  metricKey: string,
  recentReadings: BioReading[]
): { value: number; confidence: number; source: 'imputed' } | null {
  const baseline = queryMemory(clientId, { category: 'baseline', key: metricKey });
  if (baseline.length > 0) {
    const val = baseline[0].value as number;
    return { value: val, confidence: 0.4, source: 'imputed' };
  }

  const sameMetric = recentReadings.filter((r) => r.metricKey === metricKey);
  if (sameMetric.length >= 3) {
    const avg = sameMetric.reduce((s, r) => s + r.value, 0) / sameMetric.length;
    return { value: avg, confidence: 0.6, source: 'imputed' };
  }

  const patterns = queryMemory(clientId, { category: 'pattern', key: metricKey });
  if (patterns.length > 0) {
    const pattern = patterns[0].value as { typicalValue: number };
    return { value: pattern.typicalValue, confidence: 0.3, source: 'imputed' };
  }

  return null;
}

export function updateTwinInMemory(twin: DigitalTwinState): void {
  storeMemory(twin.clientId, 'baseline', 'digital_twin', twin, 'digital-twin-modeler', {
    relevance: 1,
  });
}

export function recordAdaptation(
  clientId: string,
  adaptation: { type: string; description: string; appliedAt: string }
): void {
  storeMemory(clientId, 'adaptation_history', adaptation.type, adaptation, 'recovery-adaptation');
}

export function recordVoiceContext(clientId: string, transcript: string, intent: string): void {
  storeMemory(clientId, 'voice_context', intent, { transcript, intent }, 'voice', {
    relevance: 0.8,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
}

export function getActiveConstraints(clientId: string): TwinConstraint[] {
  const twinEntry = queryMemory(clientId, { category: 'baseline', key: 'digital_twin' });
  if (twinEntry.length === 0) return [];
  const twin = twinEntry[0].value as DigitalTwinState;
  return twin.constraints.filter((c) => c.active);
}

export function getInjuryHistory(clientId: string): InjuryFlag[] {
  const twinEntry = queryMemory(clientId, { category: 'baseline', key: 'digital_twin' });
  if (twinEntry.length === 0) return [];
  const twin = twinEntry[0].value as DigitalTwinState;
  return twin.injuryFlags;
}
