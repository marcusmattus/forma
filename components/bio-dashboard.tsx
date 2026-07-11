'use client';

import { useEffect, useState } from 'react';
import { Activity, Moon, Footprints, Heart, Mic, RefreshCw } from 'lucide-react';

interface UnifiedScore {
  key: string;
  value: number;
  explanation: string;
  confidence: number;
}

interface BioInsight {
  id: string;
  title: string;
  body: string;
  category: string;
}

interface TwinResponse {
  twin: {
    recovery: { readinessScore: number; sleepDebtHours: number; sorenessLevel: number };
    unifiedScores: UnifiedScore[];
  };
  insights: BioInsight[];
}

const SCORE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  recovery_score: { label: 'Recovery', icon: <Heart className="w-4 h-4" />, color: '#22C55E' },
  load_score: { label: 'Workouts', icon: <Activity className="w-4 h-4" />, color: '#7C3AED' },
  sleep_quality_score: { label: 'Sleep', icon: <Moon className="w-4 h-4" />, color: '#22D3EE' },
  overtraining_risk: { label: 'Risk', icon: <Footprints className="w-4 h-4" />, color: '#F59E0B' },
};

function ProgressRing({
  value,
  label,
  icon,
  color,
  size = 80,
}: {
  value: number;
  label: string;
  icon: React.ReactNode;
  color: string;
  size?: number;
}) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(124,58,237,0.15)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-white">{value}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 text-xs text-[var(--color-text-dim)]">
        {icon}
        <span>{label}</span>
      </div>
    </div>
  );
}

async function seedDemoData() {
  await fetch('/api/bio/demo', { method: 'POST' });
}

export function BioDashboard() {
  const [data, setData] = useState<TwinResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [voiceInput, setVoiceInput] = useState('');
  const [voiceResult, setVoiceResult] = useState<string | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bio/twin?clientId=demo_client&tier=pro');
      const json = await res.json();
      if (json.twin) setData(json as TwinResponse);
    } catch {
      /* demo fallback */
    }
    setLoading(false);
  };

  useEffect(() => {
    seedDemoData().then(loadDashboard);
  }, []);

  const handleVoice = async () => {
    if (!voiceInput.trim()) return;
    const res = await fetch('/api/bio/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: 'demo_client',
        transcript: voiceInput,
        tier: 'pro',
      }),
    });
    const json = await res.json();
    const adaptations = json.adaptations?.map((a: { description: string }) => a.description).join('; ');
    setVoiceResult(adaptations ?? 'No adaptations triggered');
    setVoiceInput('');
    loadDashboard();
  };

  const scores = data?.twin?.unifiedScores ?? [];

  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm text-[var(--color-violet-400)] font-mono uppercase tracking-widest mb-2">
              Bio Tracking · Digital Twin
            </p>
            <h2 className="text-3xl font-bold text-white">Today&apos;s Plan</h2>
          </div>
          <button
            onClick={loadDashboard}
            className="p-2 rounded-lg border border-[var(--line)] hover:border-[var(--line-strong)] transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-5 h-5 text-[var(--color-violet-400)] ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--color-ink)] p-8 mb-6">
          <h3 className="text-sm font-mono text-[var(--color-text-mute)] uppercase tracking-wider mb-6">
            Daily Progress
          </h3>
          <div className="flex justify-around flex-wrap gap-6">
            {scores.length > 0 ? (
              scores.map((score) => {
                const config = SCORE_CONFIG[score.key] ?? {
                  label: score.key,
                  icon: <Activity className="w-4 h-4" />,
                  color: '#7C3AED',
                };
                return (
                  <ProgressRing
                    key={score.key}
                    value={score.value}
                    label={config.label}
                    icon={config.icon}
                    color={config.color}
                  />
                );
              })
            ) : (
              <p className="text-[var(--color-text-mute)]">Loading bio data...</p>
            )}
          </div>
        </div>

        {data?.insights && data.insights.length > 0 && (
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--color-ink)] p-6 mb-6">
            <h3 className="text-sm font-mono text-[var(--color-text-mute)] uppercase tracking-wider mb-4">
              AI Coach Summary
            </h3>
            {data.insights.slice(0, 3).map((insight) => (
              <div key={insight.id} className="mb-3 last:mb-0">
                <p className="text-sm font-medium text-[var(--color-violet-300)]">{insight.title}</p>
                <p className="text-sm text-[var(--color-text-dim)]">{insight.body}</p>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--color-ink)] p-6">
          <h3 className="text-sm font-mono text-[var(--color-text-mute)] uppercase tracking-wider mb-4">
            Voice Adaptation (Wispr)
          </h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={voiceInput}
              onChange={(e) => setVoiceInput(e.target.value)}
              placeholder={"Try: \"I'm sore and only have 20 minutes\""}
              className="flex-1 bg-[var(--color-ink-2)] border border-[var(--line)] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[var(--color-text-mute)] focus:outline-none focus:border-[var(--color-violet-500)]"
            />
            <button
              onClick={handleVoice}
              className="px-4 py-3 rounded-lg bg-[var(--color-violet-600)] hover:bg-[var(--color-violet-500)] transition-colors flex items-center gap-2 text-white text-sm font-medium"
            >
              <Mic className="w-4 h-4" />
              Speak
            </button>
          </div>
          {voiceResult && (
            <p className="mt-3 text-sm text-[var(--color-success)]">→ {voiceResult}</p>
          )}
        </div>
      </div>
    </section>
  );
}
