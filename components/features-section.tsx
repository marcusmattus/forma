'use client';

import { motion } from 'motion/react';
import { Camera, Volume2, Target, BarChart2, MapPin, Utensils, Activity } from 'lucide-react';

export function FeaturesSection() {
  const features = [
    {
      icon: <Volume2 className="text-violet-400" strokeWidth={1.5} />,
      title: 'VOICE INTEL',
      desc: 'No menus. No typing. Converse with your AI coach to adjust sets, report exhaustion, or switch routines instantly.'
    },
    {
      icon: <Camera className="text-violet-400" strokeWidth={1.5} />,
      title: 'EXTERNAL VISION',
      desc: 'Pair a laptop or tablet via session ID. MoveNet tracks your form, squat depth, and reps locally—zero cloud video processing.'
    },
    {
      icon: <Target className="text-violet-400" strokeWidth={1.5} />,
      title: 'AGENT FLEET',
      desc: 'Routine, Performance, Vision, Voice, and Optimization agents. They argue, synthesize, and adapt your next movement.'
    },
    {
      icon: <BarChart2 className="text-violet-400" strokeWidth={1.5} />,
      title: 'ANALYTICS & PROGRESS',
      desc: 'Historical tracking of strength, side-by-side posture comparisons, and volume ceilings mapped against your recovery data.'
    },
    {
      icon: <Utensils className="text-violet-400" strokeWidth={1.5} />,
      title: 'GEMINI NUTRITION SCAN',
      desc: 'Upload a meal photo. Gemini 1.5 Flash instantly identifies ingredients, estimates macros, and adapts your caloric goals to match your workout intensity.'
    },
    {
      icon: <MapPin className="text-violet-400" strokeWidth={1.5} />,
      title: 'GPS ROUTE TRACKER',
      desc: 'Advanced geo-tracking for outdoor cardio. Calculates Pace, Elevation Gain, and Splits with a dark neobrutalist map interface.'
    }
  ];

  return (
    <section id="vision" className="max-w-7xl mx-auto px-6 py-32 relative z-10 z-10">
      <div className="mb-16 md:mb-20 text-center md:text-left">
        <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 uppercase">
          Architecture of<br/>
          <span className="text-transparent" style={{ WebkitTextStroke: '1px #fff', opacity: 0.8 }}>Performance</span>
        </h2>
        <p className="font-body text-white/50 text-base max-w-xl">
          FORMA dismantles the traditional fitness tracker. It watches, listens, and recalibrates parameters through an ensemble of specialized AI agents.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-px bg-white/10 relative border border-white/10">
        {features.map((feat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            className="bg-[#050508] p-8 md:p-12 group hover:bg-white/[0.02] transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-sm bg-violet-600/10 flex items-center justify-center mb-8 border border-violet-500/20 group-hover:bg-violet-600/20 transition-colors">
                {feat.icon}
              </div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4 text-violet-100">
                {feat.title}
              </h3>
              <p className="font-light text-white/50 leading-relaxed text-sm">
                {feat.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
