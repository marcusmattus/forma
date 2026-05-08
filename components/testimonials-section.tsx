'use client';

import { motion } from 'motion/react';

export function TestimonialsSection() {
  const testimonials = [
    {
      text: "I was skeptical of AI fitness bros. But FORMA caught my left hip shift during heavy lunges, told me to drop the weight mid-set, and my knee pain vanished. It actually coaches.",
      author: "MARCUS T",
      detail: "Age 34 • 4x/Week"
    },
    {
      text: "No more tapping tiny buttons with sweaty hands. I just say 'Too easy' and the Optimization Agent adds 10lbs to the next set. Friction approaches zero.",
      author: "SARAH L",
      detail: "Age 29 • Strength Bias"
    },
    {
      text: "The web-camera pairing is brilliant. I set my laptop on a bench, open the app, and it just watches. No awkward phone leaning against a water bottle.",
      author: "JAMES P",
      detail: "Age 41 • Garage Gym"
    }
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 py-32 relative z-10 border-t border-[rgba(167,139,250,0.12)]">
      <div className="text-center md:text-left mb-16">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 uppercase">
          System Verification
        </h2>
        <p className="text-xs font-bold uppercase tracking-widest text-white/50">
          Network Feedback & Logs
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-px bg-white/10 border border-white/10">
        {testimonials.map((t, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15, duration: 0.5 }}
            className="flex flex-col bg-[#050508] p-8 md:p-10"
          >
            <div className="border-l border-violet-500 pl-6 flex-1 flex flex-col justify-between">
              <p className="text-sm italic text-white/70 font-light leading-relaxed mb-8">
                &quot;{t.text}&quot;
              </p>
              <div>
                <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-1">
                  {t.author}
                </p>
                <p className="text-[9px] text-white/40 uppercase tracking-widest">
                  {t.detail}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
