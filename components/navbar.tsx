'use client'

import { Activity } from 'lucide-react'

export function Navbar() {
  return (
    <nav className="fixed top-0 w-full border-b border-white/10 bg-[#050508]/80 backdrop-blur-md z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-violet-600 rounded-sm flex items-center justify-center font-bold italic tracking-tighter text-xl text-white pt-0.5">F</div>
          <span className="font-bold tracking-widest text-sm text-white">FORMA</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-[10px] uppercase tracking-[0.2em] font-semibold text-white/50">
          <a href="#vision" className="hover:text-violet-400 transition-colors">Vision System</a>
          <a href="#voice" className="hover:text-violet-400 transition-colors">Voice Coach</a>
          <a href="#app" className="hover:text-violet-400 transition-colors">The App</a>
        </div>
        <a href="#waitlist" className="px-6 py-2 border border-violet-500/50 rounded-full text-[10px] font-bold tracking-widest text-white/80 hover:bg-violet-500/10 transition-colors uppercase">
          Join Waitlist
        </a>
      </div>
    </nav>
  )
}

export function Logo() {
  return (
    <svg width="32" height="32" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="forma-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      <path d="M16 22 L72 22 L80 30 L80 38 L74 44 L22 44 Z" fill="url(#forma-grad)"/>
      <path d="M16 50 L62 50 L70 58 L70 66 L64 72 L22 72 Z" fill="url(#forma-grad)"/>
      <circle cx="34" cy="84" r="5.5" fill="url(#forma-grad)"/>
    </svg>
  )
}
