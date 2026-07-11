import { Navbar } from "@/components/navbar"
import { MobileMockup } from "@/components/mobile-mockup"
import { FeaturesSection } from "@/components/features-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import { WaitlistSection } from "@/components/waitlist-section"
import { AlgorithmicCanvas } from "@/components/algorithmic-canvas"
import { BioDashboard } from "@/components/bio-dashboard"
import { Mic, Apple, Play } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-void selection:bg-violet-600 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] pt-32 overflow-hidden flex flex-col md:flex-row items-center">
        {/* Background Canvas */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 pointer-events-none opacity-30 bg-grid-overlay" />
          <AlgorithmicCanvas />
          <div className="absolute inset-0 bg-gradient-to-b from-void/80 via-transparent to-void z-10" />
        </div>

        <div className="max-w-7xl mx-auto px-6 w-full relative z-20 flex flex-col lg:flex-row items-center gap-16">
          
          <div className="flex-1 text-center lg:text-left mt-12 lg:mt-0">
            <div className="inline-block px-3 py-1.5 rounded-full bg-[rgba(167,139,250,0.08)] border border-[rgba(167,139,250,0.28)] font-mono text-[9px] uppercase tracking-[0.2em] text-violet-300 mb-8">
              System Online v0.9.4
            </div>
            
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-[0.85] tracking-tighter mb-6 uppercase">
              TRAIN SMARTER.<br/>
              <span className="text-transparent" style={{ WebkitTextStroke: '1px #fff', opacity: 0.8 }}>MOVE BETTER.</span><br/>
              BECOME FORMA.
            </h1>
            
            <p className="font-body text-text-dim text-lg md:text-xl max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed">
              The first voice-driven AI coaching system. Connect a camera, start talking, and let the agent fleet adapt your workout in real-time. Friction approaches zero.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <a
                href="#voice"
                className="px-8 py-4 bg-violet-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-violet-500 transition-colors flex items-center justify-center gap-3"
              >
                <Mic size={18} strokeWidth={2.5} />
                START VOICE ONBOARDING
              </a>
              
              <button className="px-8 py-4 border border-white/20 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-colors inline-block">
                See Documentation
              </button>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <button className="flex items-center gap-3 px-6 py-3 border border-white/10 bg-white/5 hover:bg-white/10 hover:border-violet-500/50 transition-colors">
                <Apple size={22} className="text-white fill-white" />
                <div className="text-left">
                  <div className="text-[8px] uppercase tracking-[0.2em] text-white/50">Download on the</div>
                  <div className="text-xs font-bold tracking-widest">App Store</div>
                </div>
              </button>
              
              <button className="flex items-center gap-3 px-6 py-3 border border-white/10 bg-white/5 hover:bg-white/10 hover:border-violet-500/50 transition-colors">
                <Play size={22} className="text-white fill-white" />
                <div className="text-left">
                  <div className="text-[8px] uppercase tracking-[0.2em] text-white/50">Get it on</div>
                  <div className="text-xs font-bold tracking-widest">Google Play</div>
                </div>
              </button>
            </div>
          </div>

          <div className="flex-1 flex justify-center lg:justify-end relative">
             {/* The ORB hovering behind the mockup */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 mix-blend-screen scale-150 opacity-40">
                <div className="orb"></div>
             </div>
             
             <MobileMockup />
          </div>

        </div>
      </section>

      <BioDashboard />

      <FeaturesSection />
      
      {/* Visual Break / Quote */}
      <section className="py-24 border-y border-[rgba(167,139,250,0.12)] bg-ink relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(109,40,217,0.15)_0%,transparent_60%)]" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
           <div className="orb mx-auto mb-10 scale-75"></div>
           <h3 className="font-display text-2xl md:text-4xl text-text-main leading-snug">
             &quot;Most fitness apps are glorified spreadsheets. FORMA is a cybernetic extension of your nervous system.&quot;
           </h3>
        </div>
      </section>

      <TestimonialsSection />

      <WaitlistSection />

      <footer className="border-t border-[rgba(167,139,250,0.12)] bg-[#050508] py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="font-display text-xl tracking-wide text-violet-400">FORMA</span>
            </div>
            <div className="flex items-center gap-4 border-l border-white/10 pl-6">
              <a href="#" className="font-mono text-[10px] uppercase tracking-widest text-white/50 hover:text-violet-400 transition-colors">App Store</a>
              <a href="#" className="font-mono text-[10px] uppercase tracking-widest text-white/50 hover:text-violet-400 transition-colors">Google Play</a>
            </div>
          </div>
          <div className="font-mono text-[10px] uppercase text-text-mute tracking-[0.18em]">
            © 2026 FORMA SYSTEMS. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </main>
  )
}
