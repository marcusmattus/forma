'use client';

import { useEffect, useState } from 'react';
import { Activity, Heart, Moon, RefreshCw, Footprints } from 'lucide-react';
import { RecoveryGauge, AdaptationCard, VoiceButton, BioTrendsChart } from '@/components/motionos';
import { MOTIONOS_DESIGN_TOKENS } from '@/types/motionos';
import type { MotionOSBioDocument } from '@/types/motionos';

const GAUGE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  recovery_score: { label: 'Recovery', icon: <Heart className="w-3.5 h-3.5" />, color: MOTIONOS_DESIGN_TOKENS.successGreen },
  load_score: { label: 'Workouts', icon: <Activity className="w-3.5 h-3.5" />, color: MOTIONOS_DESIGN_TOKENS.primaryPurple },
  overtraining_risk: { label: 'Risk', icon: <Footprints className="w-3.5 h-3.5" />, color: MOTIONOS_DESIGN_TOKENS.warnAmber },
};

const WEEKLY_MOCK = [
  { label: 'Mon', value: 72 },
  { label: 'Tue', value: 85 },
  { label: 'Wed', value: 45 },
  { label: 'Thu', value: 78 },
  { label: 'Fri', value: 90 },
  { label: 'Sat', value: 60 },
  { label: 'Sun', value: 76 },
];

async function seedDemoData() {
  await fetch('/api/bio/demo', { method: 'POST' });
}

export function BioDashboard() {
  const [document, setDocument] = useState<MotionOSBioDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const [spokenFeedback, setSpokenFeedback] = useState<string | null>(null);
  const [followUpPrompt, setFollowUpPrompt] = useState<string | null>(null);
  const [sessionId] = useState(() => `web_${Date.now()}`);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bio/twin?clientId=demo_client&tier=pro');
      const json = await res.json();
      if (json.document) setDocument(json.document);
    } catch { /* demo fallback */ }
    setLoading(false);
  };

  useEffect(() => {
    seedDemoData().then(loadDashboard);
  }, []);

  const handleVoice = async (transcript: string) => {
    setVoiceProcessing(true);
    try {
      const res = await fetch('/api/bio/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: 'demo_client',
          transcript,
          sessionId,
          tier: 'pro',
        }),
      });
      const json = await res.json();
      if (json.document) setDocument(json.document);
      setSpokenFeedback(json.spokenFeedback ?? json.intentResult?.output?.spoken_response ?? null);
      setFollowUpPrompt(json.intentResult?.output?.follow_up_prompt ?? json.intentResult?.clarification_prompt ?? null);
    } finally {
      setVoiceProcessing(false);
    }
  };

  const scores = document?.digital_twin.unified_scores ?? [];
  const adaptations = document?.adaptation_log ?? [];

  return (
    <section
      className="py-24 px-6 relative"
      style={{ backgroundColor: MOTIONOS_DESIGN_TOKENS.bgPrimary }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p
              className="text-sm font-mono uppercase tracking-widest mb-2"
              style={{ color: MOTIONOS_DESIGN_TOKENS.primaryPurple }}
            >
              MotionOS · Bio Tracking · Hermes + Wispr
            </p>
            <h2 className="text-3xl font-bold" style={{ color: MOTIONOS_DESIGN_TOKENS.textPrimary }}>
              Hey Alex — Today&apos;s Plan
            </h2>
          </div>
          <button
            onClick={loadDashboard}
            className="p-2 rounded-lg border transition-colors"
            style={{ borderColor: 'rgba(124,58,237,0.2)' }}
            aria-label="Refresh"
          >
            <RefreshCw
              className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
              style={{ color: MOTIONOS_DESIGN_TOKENS.primaryPurple }}
            />
          </button>
        </div>

        {/* Recovery Dashboard — 4 ring gauges */}
        <div
          className="rounded-2xl border p-8 mb-6"
          style={{ backgroundColor: MOTIONOS_DESIGN_TOKENS.bgCard, borderColor: 'rgba(124,58,237,0.15)' }}
        >
          <h3 className="text-xs font-mono uppercase tracking-wider mb-6" style={{ color: MOTIONOS_DESIGN_TOKENS.textMute }}>
            Daily Progress
          </h3>
          <div className="flex justify-around flex-wrap gap-6">
            {scores.length > 0 ? (
              scores.slice(0, 4).map((score) => {
                const config = GAUGE_CONFIG[score.key] ?? {
                  label: score.key,
                  icon: <Moon className="w-3.5 h-3.5" />,
                  color: MOTIONOS_DESIGN_TOKENS.accentCyan,
                };
                return (
                  <RecoveryGauge
                    key={score.key}
                    value={Math.round(score.value)}
                    label={config.label}
                    icon={config.icon}
                    color={config.color}
                  />
                );
              })
            ) : (
              <p style={{ color: MOTIONOS_DESIGN_TOKENS.textMute }}>Syncing digital twin...</p>
            )}
          </div>
        </div>

        {/* Weekly trends bar chart */}
        <div className="mb-6">
          <BioTrendsChart title="Weekly Recovery Trend" data={WEEKLY_MOCK} color={MOTIONOS_DESIGN_TOKENS.successGreen} />
        </div>

        {/* AI Coach spoken feedback */}
        {spokenFeedback && (
          <div
            className="rounded-2xl border p-6 mb-6"
            style={{ backgroundColor: `${MOTIONOS_DESIGN_TOKENS.primaryPurple}10`, borderColor: 'rgba(124,58,237,0.25)' }}
          >
            <h3 className="text-xs font-mono uppercase tracking-wider mb-3" style={{ color: MOTIONOS_DESIGN_TOKENS.accentCyan }}>
              AI Coach (Wispr)
            </h3>
            <p className="text-sm italic" style={{ color: MOTIONOS_DESIGN_TOKENS.textDim }}>
              &ldquo;{spokenFeedback}&rdquo;
            </p>
            {followUpPrompt && (
              <p className="text-xs mt-3" style={{ color: MOTIONOS_DESIGN_TOKENS.accentCyan }}>
                → {followUpPrompt}
              </p>
            )}
          </div>
        )}

        {/* Adaptation suggestions */}
        {adaptations.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-mono uppercase tracking-wider mb-4" style={{ color: MOTIONOS_DESIGN_TOKENS.textMute }}>
              Adaptation Suggestions
            </h3>
            <div className="grid gap-3">
              {adaptations.slice(0, 3).map((a) => (
                <AdaptationCard
                  key={a.id}
                  type={a.type}
                  description={a.description}
                  magnitude={a.magnitude}
                  autoApply={a.auto_applied}
                  requiresCoachApproval={a.requires_coach_approval}
                  rationale={a.rationale}
                  medicalDisclaimer={a.medical_disclaimer_shown ? 'Coaching suggestion, not medical advice.' : undefined}
                />
              ))}
            </div>
          </div>
        )}

        {/* AI Coach screen mock — waveform + voice */}
        <div
          className="rounded-2xl border p-8 text-center relative overflow-hidden"
          style={{ backgroundColor: MOTIONOS_DESIGN_TOKENS.bgCard, borderColor: 'rgba(124,58,237,0.15)' }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(circle at center, ${MOTIONOS_DESIGN_TOKENS.primaryPurple}40, transparent 70%)`,
            }}
          />
          <h3 className="text-xs font-mono uppercase tracking-wider mb-2 relative" style={{ color: MOTIONOS_DESIGN_TOKENS.textMute }}>
            Talk to Coach
          </h3>
          <p className="text-sm mb-6 relative" style={{ color: MOTIONOS_DESIGN_TOKENS.textDim }}>
            I&apos;m your AI Coach. How can I help you today?
          </p>
          <div className="flex justify-center relative">
            <div className="orb scale-50 mb-4" />
          </div>
          <p className="text-[10px] font-mono uppercase tracking-widest mb-6 relative" style={{ color: MOTIONOS_DESIGN_TOKENS.textMute }}>
            Tap to speak
          </p>
          <VoiceButton onTranscript={handleVoice} isProcessing={voiceProcessing} size="lg" />
        </div>
      </div>

      <VoiceButton onTranscript={handleVoice} isProcessing={voiceProcessing} floating />
    </section>
  );
}
