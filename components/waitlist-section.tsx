'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Check } from 'lucide-react';

export function WaitlistSection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail('');
    }
  };

  return (
    <section id="waitlist" className="py-32 border-t border-white/10 bg-[#050508] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-grid-overlay" />
      
      <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
        <div className="inline-block px-3 py-1.5 rounded-none border border-violet-500/30 bg-violet-600/10 font-mono text-[9px] uppercase tracking-[0.2em] text-violet-300 mb-8">
          Beta Protocol Active
        </div>
        
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter mb-6 uppercase">
          SECURE YOUR <span className="text-transparent" style={{ WebkitTextStroke: '1px #a5b4fc', opacity: 0.9 }}>ACCESS</span>
        </h2>
        
        <p className="font-body text-white/50 text-base max-w-xl mx-auto mb-10">
          FORMA is currently rolling out in phases. Join the waitlist to receive your priority access key and initial calibration instructions.
        </p>

        {submitted ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center p-8 border border-green-500/20 bg-green-500/5 max-w-md mx-auto relative"
          >
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-green-500/50" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-green-500/50" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-green-500/50" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-green-500/50" />
            
            <div className="w-12 h-12 bg-green-500/20 flex items-center justify-center rounded-sm mb-4 border border-green-500/30">
              <Check className="text-green-400" size={24} />
            </div>
            <h3 className="text-green-400 font-bold uppercase tracking-widest text-sm mb-2">Access Requested</h3>
            <p className="text-white/50 text-xs font-mono">SYS_MSG: Email logged to queue.</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-0 max-w-lg mx-auto relative">
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ENTER_EMAIL_ADDRESS" 
              className="flex-1 bg-white/5 border border-white/20 px-6 py-4 text-xs font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 transition-colors rounded-none"
            />
            <button 
              type="submit" 
              className="px-8 py-4 bg-violet-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-violet-500 transition-colors flex items-center justify-center gap-2 rounded-none whitespace-nowrap"
            >
              Enqueue <ArrowRight size={16} />
            </button>
            <div className="absolute -inset-1 bg-violet-500/20 blur opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
          </form>
        )}
      </div>
    </section>
  );
}
