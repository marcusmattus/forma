'use client';

import { AlertTriangle, Check, Clock, Zap } from 'lucide-react';
import { MOTIONOS_DESIGN_TOKENS } from '@/types/motionos';

interface AdaptationCardProps {
  type: string;
  description: string;
  magnitude: 'minor' | 'moderate' | 'major';
  autoApply: boolean;
  requiresCoachApproval: boolean;
  rationale?: string;
  spokenFeedback?: string;
  medicalDisclaimer?: string;
}

const MAGNITUDE_COLORS = {
  minor: MOTIONOS_DESIGN_TOKENS.accentCyan,
  moderate: MOTIONOS_DESIGN_TOKENS.warnAmber,
  major: MOTIONOS_DESIGN_TOKENS.alertPink,
};

export function AdaptationCard({
  type,
  description,
  magnitude,
  autoApply,
  requiresCoachApproval,
  rationale,
  spokenFeedback,
  medicalDisclaimer,
}: AdaptationCardProps) {
  const accent = MAGNITUDE_COLORS[magnitude];

  return (
    <div
      className="rounded-xl p-4 border transition-all hover:border-opacity-60"
      style={{
        backgroundColor: MOTIONOS_DESIGN_TOKENS.bgCard,
        borderColor: `${accent}30`,
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${accent}20` }}
          >
            <Zap className="w-4 h-4" style={{ color: accent }} />
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-wider" style={{ color: accent }}>
              {type.replace('_', ' ')}
            </p>
            <p className="text-sm font-medium" style={{ color: MOTIONOS_DESIGN_TOKENS.textPrimary }}>
              {description}
            </p>
          </div>
        </div>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full font-mono uppercase"
          style={{ backgroundColor: `${accent}15`, color: accent }}
        >
          {magnitude}
        </span>
      </div>

      {rationale && (
        <p className="text-xs mb-3" style={{ color: MOTIONOS_DESIGN_TOKENS.textDim }}>
          {rationale}
        </p>
      )}

      {spokenFeedback && (
        <div
          className="rounded-lg p-3 mb-3 text-sm italic"
          style={{ backgroundColor: `${MOTIONOS_DESIGN_TOKENS.primaryPurple}15`, color: MOTIONOS_DESIGN_TOKENS.textDim }}
        >
          &ldquo;{spokenFeedback}&rdquo;
        </div>
      )}

      <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-wider">
        {autoApply && !requiresCoachApproval ? (
          <span className="flex items-center gap-1" style={{ color: MOTIONOS_DESIGN_TOKENS.successGreen }}>
            <Check className="w-3 h-3" /> Auto-applied
          </span>
        ) : (
          <span className="flex items-center gap-1" style={{ color: MOTIONOS_DESIGN_TOKENS.warnAmber }}>
            <Clock className="w-3 h-3" /> Coach review
          </span>
        )}
      </div>

      {medicalDisclaimer && (
        <div className="flex items-start gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'rgba(124,58,237,0.12)' }}>
          <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" style={{ color: MOTIONOS_DESIGN_TOKENS.warnAmber }} />
          <p className="text-[10px] leading-relaxed" style={{ color: MOTIONOS_DESIGN_TOKENS.textMute }}>
            {medicalDisclaimer}
          </p>
        </div>
      )}
    </div>
  );
}
