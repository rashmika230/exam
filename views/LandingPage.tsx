
import React from 'react';
import { PlanType } from '../types';
import { PRICING_PLANS } from '../constants';

interface LandingPageProps {
  onNavigateToRegister: (plan: PlanType) => void;
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToRegister, onLogin }) => {
  return (
    <div className="flex flex-col min-h-screen selection:bg-indigo-100 selection:text-indigo-900">
      <nav className="flex items-center justify-between px-10 py-6 bg-white/70 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200 group-hover:rotate-6 transition-transform">L</div>
          <span className="text-2xl font-black tracking-tight text-slate-900">Lumina Exam</span>
        </div>
        <div className="flex items-center gap-8">
          <button onClick={onLogin} className="text-slate-500 font-bold hover:text-indigo-600 transition-colors tracking-wide">Log In</button>
          <button 
            onClick={() => onNavigateToRegister(PlanType.FREE)} 
            className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-slate-200 hover:bg-indigo-600 hover:shadow-indigo-100 transition-all active:scale-95"
          >
            Get Started
          </button>
        </div>
      </nav>

      <header className="px-6 pt-32 pb-40 bg-[#0a0c10] text-white text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/40 rounded-full blur-[140px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/30 rounded-full blur-[140px]"></div>
        </div>
        
        <div className="max-w-5xl mx-auto relative z-10">
          <span className="inline-block px-6 py-2 mb-8 text-[11px] font-black tracking-[0.3em] uppercase bg-white/5 border border-white/10 rounded-full text-indigo-300 animate-fade-up">
            National Syllabus Excellence
          </span>
          <h1 className="text-7xl md:text-8xl font-black mb-10 tracking-tight leading-[1.05] animate-fade-up delay-100">
            Learn Faster.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-200">Test Smarter.</span>
          </h1>
          <p className="text-2xl text-slate-400 max-w-2xl mx-auto mb-14 font-medium leading-relaxed animate-fade-up delay-200">
            Elevate your A/L performance with the most advanced exam engine in Sri Lanka. Tailored for success in every subject stream.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-up delay-300">
            <button 
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-white text-slate-950 px-12 py-5 rounded-[2rem] font-black text-lg shadow-2xl hover:bg-indigo-50 transition-all hover:-translate-y-1 hover:shadow-white/20"
            >
              Start Free Trial
            </button>
            <button className="bg-white/5 border border-white/10 text-white px-12 py-5 rounded-[2rem] font-bold text-lg backdrop-blur-md hover:bg-white/10 transition-all">
              Watch Demo
            </button>
          </div>
        </div>
      </header>

      <section id="pricing" className="py-40 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-24 opacity-0 animate-fade-up">
          <h2 className="text-5xl font-black text-slate-900 mb-6 tracking-tight">Flexible Academic Tiers</h2>
          <p className="text-slate-500 font-bold text-lg max-w-lg mx-auto">Scale your preparation with tools designed for every stage of your A/L journey.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-stretch">
          {PRICING_PLANS.map((plan, index) => (
            <div 
              key={plan.type} 
              className={`group bg-white rounded-[3.5rem] p-12 border flex flex-col transition-all duration-700 hover:-translate-y-3 opacity-0 animate-fade-up shadow-sm hover:shadow-2xl ${
                plan.type === PlanType.PRO 
                  ? 'border-indigo-100 bg-indigo-50/10 shadow-[0_40px_80px_-20px_rgba(79,70,229,0.12)] ring-1 ring-indigo-50 delay-200 scale-105' 
                  : 'border-slate-100 delay-[100ms] first:delay-0 last:delay-[300ms]'
              }`}
            >
              {plan.type === PlanType.PRO && (
                <div className="mb-6 flex">
                  <span className="bg-indigo-600 text-white px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-100">Recommended</span>
                </div>
              )}
              <h3 className="text-3xl font-black text-slate-900 mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-2 mb-10">
                <span className="text-5xl font-black text-slate-900">{plan.price}</span>
                <span className="text-slate-400 font-black text-xs uppercase tracking-widest">{plan.duration}</span>
              </div>
              <ul className="space-y-6 mb-12 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-4">
                    <div className="w-6 h-6 bg-emerald-50 rounded-full flex items-center justify-center shrink-0 border border-emerald-100">
                      <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-slate-600 font-bold text-sm tracking-tight">{feature}</span>
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => onNavigateToRegister(plan.type)}
                className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all ${
                  plan.type === PlanType.PRO 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700' 
                    : 'bg-slate-50 text-slate-900 border border-slate-100 hover:bg-slate-100'
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>
      </section>

      <footer className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-10 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-bold text-xl">L</div>
               <span className="text-2xl font-black tracking-tight text-slate-900">Lumina Exam</span>
            </div>
            <p className="text-slate-400 font-medium text-sm">Empowering the next generation of professionals.</p>
          </div>
          <div className="flex gap-12 font-black text-[10px] uppercase tracking-widest text-slate-400">
            <a href="#" className="hover:text-indigo-600 transition-colors">Curriculum</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Admissions</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Support</a>
          </div>
          <div className="text-right">
             <p className="text-slate-900 font-black text-xs">&copy; 2026 Lumina Education.</p>
             <p className="text-slate-400 font-bold text-[10px] mt-1">Made with Excellence in Sri Lanka</p>
             <p className="text-slate-500 font-black text-[9px] mt-1 uppercase tracking-widest">By K.A.V.Rashmika</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
