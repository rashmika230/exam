
import React from 'react';
import { PlanType } from '../types.ts';
import { PRICING_PLANS } from '../constants.ts';
import WhatsAppWidget from '../components/WhatsAppWidget.tsx';

interface LandingPageProps {
  onNavigateToRegister: (plan: PlanType) => void;
  onLogin: () => void;
}

const GraduationCapIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 3L1 9l11 6l9-4.91V17h2V9L12 3z"/>
    <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
  </svg>
);

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToRegister, onLogin }) => {
  const WA_URL = "https://wa.me/94788932009";

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white selection:bg-indigo-500 selection:text-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-10 py-6 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-50">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-900/20 group-hover:rotate-6 transition-transform">
            <GraduationCapIcon className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">Lumina Exam</span>
        </div>
        <div className="flex items-center gap-8">
          <button onClick={onLogin} className="text-slate-400 font-bold hover:text-indigo-400 transition-colors tracking-wide text-sm">Log In</button>
          <button 
            onClick={() => onNavigateToRegister(PlanType.FREE)} 
            className="bg-white text-slate-950 px-8 py-3 rounded-2xl font-bold shadow-xl hover:bg-indigo-50 transition-all active:scale-95 text-sm"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="px-6 pt-32 pb-40 text-center relative overflow-hidden bg-slate-950">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[140px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/5 rounded-full blur-[140px]"></div>
        </div>
        
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="animate-fade-up">
            <span className="inline-block px-6 py-2 mb-8 text-[11px] font-black tracking-[0.3em] uppercase bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 animate-badge-glow">
              National Syllabus Excellence
            </span>
          </div>
          
          <h1 className="text-7xl md:text-8xl font-black mb-10 tracking-tight leading-[1.05] flex flex-col items-center">
            <span className="animate-float block">Learn Faster.</span>
            <span className="animate-float delay-500 block">
              <span className="shimmer-text">Test Smarter.</span>
            </span>
          </h1>

          <p className="text-2xl text-slate-400 max-w-2xl mx-auto mb-14 font-medium leading-relaxed animate-fade-up delay-200">
            Elevate your A/L performance with the most advanced exam engine in Sri Lanka. Tailored for success in every subject stream.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-up delay-300">
            <button 
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-white text-slate-950 px-12 py-5 rounded-[2rem] font-black text-lg shadow-2xl hover:bg-indigo-50 transition-all hover:-translate-y-1"
            >
              Start Free Trial
            </button>
            <button className="bg-slate-900 border border-slate-800 text-slate-300 px-12 py-5 rounded-[2rem] font-bold text-lg backdrop-blur-md hover:bg-slate-800 transition-all">
              Watch Demo
            </button>
          </div>
        </div>
      </header>

      {/* Pricing Section */}
      <section id="pricing" className="py-40 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-24 opacity-0 animate-fade-up">
          <h2 className="text-5xl font-black text-white mb-6 tracking-tight">Flexible Academic Tiers</h2>
          <p className="text-slate-400 font-bold text-lg max-w-lg mx-auto">Scale your preparation with tools designed for every stage of your A/L journey.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-stretch">
          {PRICING_PLANS.map((plan, index) => (
            <div 
              key={plan.type} 
              className={`group bg-slate-900 rounded-[3.5rem] p-12 border flex flex-col transition-all duration-700 hover:-translate-y-3 opacity-0 animate-fade-up shadow-sm hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] ${
                plan.type === PlanType.PRO 
                  ? 'border-indigo-500/30 bg-indigo-950/20 ring-1 ring-indigo-500/10 delay-200 scale-105' 
                  : 'border-slate-800 delay-[100ms] first:delay-0 last:delay-[300ms]'
              }`}
            >
              {plan.type === PlanType.PRO && (
                <div className="mb-6 flex">
                  <span className="bg-indigo-600 text-white px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-900/20">Recommended</span>
                </div>
              )}
              <h3 className="text-3xl font-black text-white mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-2 mb-10">
                <span className="text-5xl font-black text-white">{plan.price}</span>
                <span className="text-slate-500 font-black text-xs uppercase tracking-widest">{plan.duration}</span>
              </div>
              <ul className="space-y-6 mb-12 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-4">
                    <div className="w-6 h-6 bg-indigo-500/10 rounded-full flex items-center justify-center shrink-0 border border-indigo-500/20">
                      <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-slate-400 font-bold text-sm tracking-tight">{feature}</span>
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => onNavigateToRegister(plan.type)}
                className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all ${
                  plan.type === PlanType.PRO 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/20 hover:bg-indigo-700' 
                    : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-10 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                 <GraduationCapIcon className="w-6 h-6" />
               </div>
               <span className="text-2xl font-black tracking-tight text-white">Lumina Exam</span>
            </div>
            <p className="text-slate-500 font-medium text-sm">Empowering the next generation of professionals.</p>
          </div>
          <div className="flex gap-12 font-black text-[10px] uppercase tracking-widest text-slate-500">
            <a href="#" className="hover:text-indigo-400 transition-colors">Curriculum</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Admissions</a>
            <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">Support</a>
          </div>
          <div className="text-right">
             <p className="text-white font-black text-xs">&copy; 2026 Lumina Education.</p>
             <p className="text-slate-600 font-bold text-[10px] mt-1">Made with Excellence in Sri Lanka</p>
             <p className="text-slate-500 font-black text-[9px] mt-1 uppercase tracking-widest">By K.A.V.Rashmika</p>
          </div>
        </div>
      </footer>

      {/* WhatsApp Chat Widget */}
      <WhatsAppWidget />
    </div>
  );
};

export default LandingPage;
