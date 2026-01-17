
import React, { useState, useEffect } from 'react';
import { Medium, PlanType } from '../types.ts';
import { SUBJECTS_BY_STREAM } from '../constants.ts';
import { useAuth } from '../App.tsx';
import WhatsAppWidget from '../components/WhatsAppWidget.tsx';

const GraduationCapIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 3L1 9l11 6l9-4.91V17h2V9L12 3z"/>
    <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
  </svg>
);

interface DashboardProps {
  startExam: (subject: string, topic?: string, type?: 'quick' | 'topic' | 'past' | 'model', timed?: boolean) => void;
  onAdminClick: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ startExam, onAdminClick }) => {
  const { user, logout, updateUser } = useAuth();
  const [selectingTopicFor, setSelectingTopicFor] = useState<string | null>(null);
  const [topicInput, setTopicInput] = useState('');
  const [timedMode, setTimedMode] = useState(false);

  useEffect(() => {
    if (user) {
      const lastReset = new Date(user.lastResetDate);
      const now = new Date();
      if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
        updateUser({
          ...user,
          questionsAnsweredThisMonth: 0,
          papersAnsweredThisMonth: 0,
          lastResetDate: now.toISOString()
        });
      }
    }
  }, [user]);

  if (!user) return null;

  const subjects = SUBJECTS_BY_STREAM[user.subjectStream] || [];
  const UPGRADE_URL = "https://wa.me/94788932009";

  const handleMediumChange = (medium: Medium) => {
    updateUser({ ...user, medium });
  };

  const isLimitReached = () => {
    if (user.plan === PlanType.FREE) return user.questionsAnsweredThisMonth >= 20;
    if (user.plan === PlanType.PRO) return user.papersAnsweredThisMonth >= 10;
    return false;
  };

  const getUsageText = () => {
    if (user.plan === PlanType.FREE) return `${user.questionsAnsweredThisMonth} / 20 questions used`;
    if (user.plan === PlanType.PRO) return `${user.papersAnsweredThisMonth} / 10 papers used`;
    return 'Unlimited Plus Access';
  };

  const getProgressWidth = () => {
    if (user.plan === PlanType.FREE) return `${Math.min((user.questionsAnsweredThisMonth / 20) * 100, 100)}%`;
    if (user.plan === PlanType.PRO) return `${Math.min((user.papersAnsweredThisMonth / 10) * 100, 100)}%`;
    return '100%';
  };

  const isProPlus = user.plan === PlanType.PRO || user.plan === PlanType.PLUS;

  const handleAction = (subject: string, type: 'quick' | 'topic' | 'past' | 'model') => {
    if (isLimitReached()) {
      alert("You have reached your monthly limit. Please upgrade or wait for the next month.");
      window.open(UPGRADE_URL, "_blank");
      return;
    }

    if (type !== 'quick' && !isProPlus) {
      if (confirm(`${type.charAt(0).toUpperCase() + type.slice(1)} practice is exclusive to Pro & Plus members. Would you like to upgrade now?`)) {
        window.open(UPGRADE_URL, "_blank");
      }
      return;
    }

    if (type === 'topic') {
      setSelectingTopicFor(subject);
    } else {
      startExam(subject, undefined, type, timedMode);
    }
  };

  const handleStartTopicExam = () => {
    if (selectingTopicFor && topicInput.trim()) {
      startExam(selectingTopicFor, topicInput.trim(), 'topic', timedMode);
      setSelectingTopicFor(null);
      setTopicInput('');
    }
  };

  return (
    <div className="min-h-screen selection:bg-indigo-100 flex flex-col">
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-100 px-10 py-5 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl text-white flex items-center justify-center shadow-lg shadow-indigo-100">
            <GraduationCapIcon className="w-5 h-5" />
          </div>
          <span className="font-black text-xl tracking-tight text-slate-900">Lumina</span>
        </div>
        <div className="flex items-center gap-8">
          {user.role === 'admin' && (
            <button onClick={onAdminClick} className="text-indigo-600 hover:text-indigo-800 font-black text-xs uppercase tracking-widest">Admin Console</button>
          )}
          <div className="flex items-center gap-4 pl-4 border-l border-slate-100">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-900">{user.preferredName}</p>
              <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">{user.plan} Tier</p>
            </div>
            <button onClick={logout} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 transition-all hover:bg-red-50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-10 animate-fade-up flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-20">
          <div className="bg-[#0a0c10] p-12 rounded-[3.5rem] text-white shadow-2xl lg:col-span-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] -mr-40 -mt-40 transition-transform duration-1000 group-hover:scale-110"></div>
            <div className="relative z-10">
              <h2 className="text-5xl font-black mb-4 tracking-tight animate-fade-up">Ayubowan, {user.preferredName}.</h2>
              <p className="text-slate-400 mb-12 max-w-lg text-lg font-medium leading-relaxed opacity-90 animate-fade-up delay-100">Prepare for the {user.subjectStream} stream with AI-generated questions from the official MOE syllabus.</p>
              
              <div className="bg-white/5 p-8 rounded-[2.5rem] backdrop-blur-md border border-white/5 animate-fade-up delay-200">
                <div className="flex flex-wrap items-center justify-between gap-6 mb-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-2">Current Month Progress</p>
                    <p className="text-2xl font-black tracking-tight">{getUsageText()}</p>
                  </div>
                  {user.plan !== PlanType.PLUS && (
                    <a href={UPGRADE_URL} target="_blank" className="bg-white text-slate-950 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl">Upgrade Plan</a>
                  )}
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ${isLimitReached() ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: getProgressWidth() }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-xl flex flex-col justify-between group animate-fade-up delay-300">
            <div>
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em]">Study Language</h3>
                <span className="text-indigo-600 text-[10px] font-black">{user.medium} Active</span>
              </div>
              <div className="space-y-3">
                {[Medium.SINHALA, Medium.ENGLISH, Medium.TAMIL].map(m => (
                  <button
                    key={m}
                    onClick={() => handleMediumChange(m)}
                    className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${user.medium === m ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-50/50' : 'border-slate-50 bg-slate-50 hover:border-slate-200'}`}
                  >
                    <span className={`font-black tracking-tight ${user.medium === m ? 'text-indigo-900' : 'text-slate-500'}`}>{m}</span>
                    {user.medium === m && <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>}
                  </button>
                ))}
              </div>
            </div>
            {isProPlus && (
              <div className="mt-8 pt-8 border-t border-slate-50">
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-900 transition-colors">Timed Exam Mode</span>
                  <input type="checkbox" className="sr-only" checked={timedMode} onChange={() => setTimedMode(!timedMode)} />
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${timedMode ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${timedMode ? 'translate-x-6' : ''}`}></div>
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
          {subjects.map((sub, index) => (
            <div key={sub} className={`bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group/card animate-fade-up`} style={{ animationDelay: `${400 + (index * 100)}ms` }}>
              <div className="flex justify-between items-center mb-8">
                <h4 className="text-2xl font-black text-slate-900 tracking-tight">{sub}</h4>
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover/card:bg-indigo-600 group-hover/card:text-white transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" /></svg>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleAction(sub, 'quick')}
                  className={`py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all flex flex-col items-center gap-2 border shadow-sm bg-slate-900 text-white hover:bg-indigo-600 hover:-translate-y-1 ${isLimitReached() ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Quick Revision
                </button>
                <button 
                  onClick={() => handleAction(sub, 'topic')}
                  className={`py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all flex flex-col items-center gap-2 border shadow-sm ${!isProPlus || isLimitReached() ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50'}`}
                >
                  Unit Focus
                </button>
                <button 
                  onClick={() => handleAction(sub, 'past')}
                  className={`py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all flex flex-col items-center gap-2 border shadow-sm ${!isProPlus || isLimitReached() ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50'}`}
                >
                  Past Paper
                </button>
                <button 
                  onClick={() => handleAction(sub, 'model')}
                  className={`py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all flex flex-col items-center gap-2 border shadow-sm ${!isProPlus || isLimitReached() ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50'}`}
                >
                  Model Exam
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="py-24 bg-slate-950 border-t border-slate-800 mt-auto">
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
            <a href={UPGRADE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">Support</a>
          </div>
          <div className="text-right">
             <p className="text-white font-black text-xs">&copy; 2026 Lumina Education.</p>
             <p className="text-slate-600 font-bold text-[10px] mt-1">Made with Excellence in Sri Lanka</p>
             <p className="text-slate-500 font-black text-[9px] mt-1 uppercase tracking-widest">By K.A.V.Rashmika</p>
          </div>
        </div>
      </footer>

      {selectingTopicFor && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6 z-[100]">
          <div className="bg-white rounded-[3rem] p-12 max-w-lg w-full shadow-2xl border border-slate-100">
            <h3 className="text-3xl font-black mb-3 text-slate-900 tracking-tight">Focus Unit</h3>
            <p className="text-slate-500 mb-8 text-sm font-medium">Generate a practice set for a specific unit of {selectingTopicFor}.</p>
            <input autoFocus type="text" placeholder="e.g. Thermodynamics / Electronics" value={topicInput} onChange={e => setTopicInput(e.target.value)} className="w-full px-8 py-5 rounded-[1.5rem] border-2 border-slate-100 bg-slate-50 outline-none focus:border-indigo-600 focus:bg-white transition-all font-bold mb-8 text-lg" />
            <div className="flex gap-4">
              <button onClick={() => setSelectingTopicFor(null)} className="flex-1 py-4 font-black text-xs uppercase tracking-widest text-slate-400">Cancel</button>
              <button onClick={handleStartTopicExam} disabled={!topicInput.trim()} className="flex-[2] py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl disabled:opacity-50">Start Exam</button>
            </div>
          </div>
        </div>
      )}

      <WhatsAppWidget message={`Hello Lumina Support, I'm ${user.preferredName} and I need help with my ${user.subjectStream} studies.`} />
    </div>
  );
};

export default Dashboard;
