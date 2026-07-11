'use client';

import { useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { MOTIONOS_DESIGN_TOKENS } from '@/types/motionos';

interface VoiceButtonProps {
  onTranscript: (transcript: string) => void;
  isProcessing?: boolean;
  size?: 'sm' | 'md' | 'lg';
  floating?: boolean;
}

export function VoiceButton({
  onTranscript,
  isProcessing = false,
  size = 'md',
  floating = false,
}: VoiceButtonProps) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const sizes = { sm: 48, md: 64, lg: 80 };
  const dim = sizes[size];

  const handleToggle = () => {
    if (listening) {
      setListening(false);
      if (transcript.trim()) onTranscript(transcript);
      setTranscript('');
    } else {
      setListening(true);
      setTranscript('');
    }
  };

  const wrapperClass = floating
    ? 'fixed bottom-24 right-6 z-50'
    : 'relative';

  return (
    <div className={wrapperClass}>
      {listening && (
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-30"
          style={{
            background: `linear-gradient(135deg, ${MOTIONOS_DESIGN_TOKENS.accentCyan}, ${MOTIONOS_DESIGN_TOKENS.primaryPurple})`,
            width: dim + 16,
            height: dim + 16,
            top: -8,
            left: -8,
          }}
        />
      )}
      <button
        onClick={handleToggle}
        disabled={isProcessing}
        aria-label={listening ? 'Stop listening' : 'Talk to Coach'}
        className="relative rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
        style={{
          width: dim,
          height: dim,
          background: listening
            ? `linear-gradient(135deg, ${MOTIONOS_DESIGN_TOKENS.alertPink}, ${MOTIONOS_DESIGN_TOKENS.primaryPurple})`
            : `linear-gradient(135deg, ${MOTIONOS_DESIGN_TOKENS.accentCyan}, ${MOTIONOS_DESIGN_TOKENS.primaryPurple})`,
          boxShadow: `0 0 24px ${MOTIONOS_DESIGN_TOKENS.primaryPurple}60, 0 0 48px ${MOTIONOS_DESIGN_TOKENS.accentCyan}20`,
        }}
      >
        {listening ? (
          <Square className="text-white" size={dim * 0.3} fill="white" />
        ) : (
          <Mic className="text-white" size={dim * 0.35} />
        )}
      </button>

      {listening && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <input
            type="text"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleToggle()}
            placeholder="Type or speak..."
            autoFocus
            className="px-3 py-1.5 rounded-full text-xs border text-center w-48"
            style={{
              backgroundColor: MOTIONOS_DESIGN_TOKENS.bgElevated,
              borderColor: `${MOTIONOS_DESIGN_TOKENS.primaryPurple}40`,
              color: MOTIONOS_DESIGN_TOKENS.textPrimary,
            }}
          />
        </div>
      )}

      {!listening && floating && (
        <p
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono uppercase tracking-widest whitespace-nowrap"
          style={{ color: MOTIONOS_DESIGN_TOKENS.textMute }}
        >
          Talk to Coach
        </p>
      )}
    </div>
  );
}
