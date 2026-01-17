
import React, { useState } from 'react';
import { Medium, PlanType } from '../types';
import { SUBJECTS_BY_STREAM } from '../constants';
import { useAuth } from '../App';

interface DashboardProps {
  startExam: (subject: string, topic?: string, type?: 'quick' | 'topic' | 'past' | 'model', timed?: boolean) => void;
  onAdminClick: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ startExam, onAdminClick }) => {
  const { user, logout, updateUser } = useAuth();
  const [selectingTopicFor, setSelectingTopicFor] = useState<string | null>(null);
  const [topicInput, setTopicInput] = useState('');
  const [timedMode, setTimedMode] = useState(false);

  if (!user) return null;

  const subjects = SUBJECTS_BY_STREAM[user.subjectStream] || [];
  const UPGRADE_URL = "https://wa.me/94788932009";

  const handleMediumChange = (medium: Medium) => {
    updateUser({ ...user, medium });
  };

  const getUsageText = () => {
    if (user.plan === PlanType.FREE) return `${user.questionsAnsweredThisMonth} / 20 questions used`;
    if (user.plan === PlanType.PRO) return `${user.papersAnsweredThisMonth} / 10 papers used`;
    return 'Unlimited Access';
  };

  const isProPlus = user.plan === PlanType.PRO || user.plan === PlanType.PLUS;

  const handleRestrictedAction = (subject: string, type: 'topic' | 'past' | 'model') => {
    if (!isProPlus) {
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
    <div className="min-h-screen pb-32 selection:bg-indigo-100">
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-100 px-10 py-5 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-100">L</div>
          <span className="font-black text-xl tracking-tight text-slate-900">Lumina</span>
        </div>
        <div className="flex items-center gap-8">
          {user.role === 'admin' && (
            <button onClick={onAdminClick} className="text-indigo-600 hover:text-indigo-800 font-black text-xs uppercase tracking-widest">Admin Console</button>
          )}
          <div className="flex items-center gap-4 pl-4 border-l border-slate-100">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-900">{user.preferredName}</p>
              <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">{user.plan} Active</p>
            </div>
            <button onClick={logout} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 transition-all hover:bg-red-50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-10 animate-fade-up">
        {/* Timed Mode Toggle for Pro/Plus */}
        {isProPlus && (
          <div className="flex justify-end mb-6 animate-fade-up">
            <label className="flex items-center cursor-pointer group">
              <span className="mr-3 text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-indigo-600 transition-colors">Timed Mode (60m/50Q)</span>
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={timedMode} 
                  onChange={() => setTimedMode(!timedMode)} 
                />
                <div className={`block w-14 h-8 rounded-full transition-colors ${timedMode ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${timedMode ? 'transform translate-x-6' : ''}`}></div>
              </div>
            </label>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-20">
          <div className="bg-[#0a0c10] p-12 rounded-[3.5rem] text-white shadow-2xl lg:col-span-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] -mr-40 -mt-40 transition-transform duration-1000 group-hover:scale-110"></div>
            <div className="relative z-10">
              <h2 className="text-5xl font-black mb-4 tracking-tight">Ayubowan, {user.preferredName}.</h2>
              <p className="text-slate-400 mb-12 max-w-lg text-lg font-medium leading-relaxed opacity-90">Ready to dominate the {user.subjectStream} stream? Let's refine your skills with specialized AI modules.</p>
              
              <div className="flex flex-wrap items-center gap-6 bg-white/5 p-8 rounded-[2.5rem] backdrop-blur-md border border-white/5">
                <div className="flex-1 min-w-[200px]">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-2">Platform Engagement</p>
                  <p className="text-2xl font-black tracking-tight">{getUsageText()}</p>
                </div>
                {!isProPlus || user.plan === PlanType.PRO ? (
                  <a 
                    href={UPGRADE_URL} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white text-slate-950 px-10 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl hover:-translate-y-1"
                  >
                    Level Up
                  </a>
                ) : (
                   <div className="bg-indigo-500/20 text-indigo-300 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-indigo-500/30">
                    Unlimited Access Unlocked
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-xl flex flex-col justify-between group">
            <div>
              <h3 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em] mb-8">Study Language</h3>
              <div className="space-y-3">
                {[Medium.SINHALA, Medium.ENGLISH, Medium.TAMIL].map(m => (
                  <button
                    key={m}
                    onClick={() => handleMediumChange(m)}
                    className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${user.medium === m ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-50/50' : 'border-slate-50 bg-slate-50 hover:border-slate-200'}`}
                  >
                    <span className={`font-black tracking-tight ${user.medium === m ? 'text-indigo-900' : 'text-slate-500'}`}>{m}</span>
                    {user.medium === m && (
                      <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-200">
                        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-12 animate-fade-up delay-100">
          <h3 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-indigo-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            Active Modules
          </h3>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b-2 border-slate-100 pb-1">{user.subjectStream} Stream</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-fade-up delay-200">
          {subjects.map((sub) => (
            <div key={sub} className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all group/card overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover/card:bg-indigo-50 transition-colors"></div>
              
              <div className="flex justify-between items-start mb-10 relative z-10">
                <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white group-hover/card:bg-indigo-600 transition-all duration-500 shadow-xl group-hover/card:shadow-indigo-100">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                </div>
                {isProPlus && (
                  <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm shadow-emerald-50">High Priority</span>
                )}
              </div>
              
              <h4 className="text-3xl font-black text-slate-900 mb-4 tracking-tight relative z-10">{sub}</h4>
              <p className="text-slate-500 mb-12 text-lg font-medium leading-relaxed opacity-80 relative z-10">National Syllabus coverage with precision-tuned AI logic.</p>
              
              <div className="grid grid-cols-2 gap-4 relative z-10">
                <button 
                  onClick={() => startExam(sub, undefined, 'quick', timedMode)}
                  className="bg-slate-900 text-white py-5 rounded-[1.75rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all flex flex-col items-center gap-3 shadow-xl hover:-translate-y-1"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                  Quick Start
                </button>
                <button 
                  onClick={() => handleRestrictedAction(sub, 'topic')}
                  className={`py-5 rounded-[1.75rem] font-black text-xs uppercase tracking-widest transition-all flex flex-col items-center gap-3 border shadow-sm ${!isProPlus ? 'bg-slate-50 text-slate-300 border-slate-100' : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50 hover:border-slate-900'}`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>
                  Focus Unit
                </button>
                <button 
                  onClick={() => handleRestrictedAction(sub, 'past')}
                  className={`py-5 rounded-[1.75rem] font-black text-xs uppercase tracking-widest transition-all flex flex-col items-center gap-3 border shadow-sm ${!isProPlus ? 'bg-slate-50 text-slate-300 border-slate-100' : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50 hover:border-slate-900'}`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                  Past Archives
                </button>
                <button 
                  onClick={() => handleRestrictedAction(sub, 'model')}
                  className={`py-5 rounded-[1.75rem] font-black text-xs uppercase tracking-widest transition-all flex flex-col items-center gap-3 border shadow-sm ${!isProPlus ? 'bg-slate-50 text-slate-300 border-slate-100' : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50 hover:border-slate-900'}`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" /></svg>
                  Trial Exam
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectingTopicFor && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] p-12 max-w-lg w-full shadow-2xl border border-slate-100 transform animate-in zoom-in-95 duration-300">
            <h3 className="text-4xl font-black mb-3 text-slate-900 tracking-tight">Focus Unit</h3>
            <p className="text-slate-500 mb-10 text-lg font-medium leading-relaxed">Enter a specific unit from the <strong className="text-indigo-600">{selectingTopicFor}</strong> syllabus for intensive practice.</p>
            <div className="relative mb-10">
              <input 
                autoFocus
                type="text" 
                placeholder="Unit name (e.g. Thermodynamics)" 
                value={topicInput}
                onChange={e => setTopicInput(e.target.value)}
                className="w-full px-8 py-5 rounded-[1.75rem] border-2 border-slate-50 bg-slate-50 outline-none focus:border-indigo-600 focus:bg-white transition-all font-bold text-slate-800 text-lg shadow-sm"
                onKeyDown={e => e.key === 'Enter' && handleStartTopicExam()}
              />
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => { setSelectingTopicFor(null); setTopicInput(''); }}
                className="flex-1 py-5 rounded-[1.75rem] font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleStartTopicExam}
                disabled={!topicInput.trim()}
                className="flex-[2] py-5 rounded-[1.75rem] font-black text-xs uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-100"
              >
                Launch Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
