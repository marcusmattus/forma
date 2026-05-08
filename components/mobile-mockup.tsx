'use client';

import { useEffect, useRef } from 'react';

// Generates pseudo-random values to avoid hydration errors compared to Math.random() in render
const deterministicRandoms = Array.from({ length: 30 }, (_, i) => {
  const seed = (i * 137) % 100;
  return (seed / 100) * 80 + 20; // 20 to 100
});

export function MobileMockup() {
  return (
    <div className="relative w-[360px] h-[740px] bg-ink rounded-[40px] border-[6px] border-[#1e1e2d] shadow-2xl overflow-hidden shadow-[0_0_56px_rgba(79,70,229,0.2)] shrink-0">
      {/* Dynamic Header / Notch area */}
      <div className="absolute top-0 inset-x-0 h-7 flex justify-center z-20">
        <div className="w-32 h-6 bg-[#1e1e2d] rounded-b-[18px]"></div>
      </div>
      
      {/* Status bar */}
      <div className="absolute top-2 inset-x-0 px-6 flex justify-between z-10 font-mono text-[10px] text-text-dim">
        <span>9:41</span>
        <div className="flex gap-1.5 items-center">
           <span>5G</span>
           <div className="flex gap-0.5 items-end h-2.5">
             <div className="w-[2px] h-[40%] bg-text-dim"></div>
             <div className="w-[2px] h-[60%] bg-text-dim"></div>
             <div className="w-[2px] h-[80%] bg-text-dim"></div>
             <div className="w-[2px] h-[100%] bg-text-dim"></div>
           </div>
        </div>
      </div>

      {/* Screen Content - Live Workout Archetype */}
      <div className="pt-16 pb-8 px-6 h-full flex flex-col">
        <div className="flex justify-between items-center mb-8">
           <span className="text-[10px] text-violet-400 font-bold uppercase tracking-widest">Push Strength</span>
           <span className="text-[10px] text-white/50 font-mono tracking-widest">45:12</span>
        </div>

        {/* Circular Progress (Rep visualizer) */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          <svg width="200" height="200" className="rotate-[-90deg]">
            <defs>
              <linearGradient id="rep-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                 <stop offset="0%" stopColor="#4f46e5" />
                 <stop offset="50%" stopColor="#3b82f6" />
                 <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <circle 
              cx="100" cy="100" r="90" fill="none" 
              stroke="url(#rep-grad)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray="565.48" strokeDashoffset="113.1" // 80% progress
              className="drop-shadow-[0_0_16px_rgba(79,70,229,0.5)]"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
             <span className="text-[10px] text-white/50 font-bold tracking-widest mb-1 uppercase">Reps</span>
             <span className="text-6xl font-light tracking-tighter text-white">12</span>
             <span className="font-mono text-[10px] text-white/30 tracking-[0.18em] mt-1">/15</span>
          </div>
        </div>

        {/* AI Coaching Text */}
        <div className="text-center mb-12">
          <p className="text-lg font-light tracking-tight text-white whitespace-pre-line leading-relaxed">
            Great depth.{"\n"}Keep pushing.
          </p>
        </div>

        {/* Voice Waveform */}
        <div className="flex items-center justify-center h-16 gap-1 mb-6">
          {deterministicRandoms.map((height, i) => (
             <div 
               key={i} 
               className="w-1 bg-violet-400 rounded-full eq-bar"
               style={{ 
                 height: `${height}%`,
                 animationDelay: `${i * 0.07}s`,
                 background: `linear-gradient(to top, rgba(79,70,229,0.2), #6366f1)`
               }}
             />
          ))}
        </div>
      </div>
    </div>
  )
}
