
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App.tsx';
import { MCQQuestion, PlanType } from '../types.ts';
import { generateQuestions, generateSimplerExplanation } from '../services/geminiService.ts';

interface ExamRoomProps {
  subject: string;
  topic?: string;
  type: 'quick' | 'topic' | 'past' | 'model';
  isTimed?: boolean;
  onFinish: () => void;
}

const typeLabels: Record<string, string> = {
  quick: 'Quick Revision',
  topic: 'Unit Focus',
  past: 'Past Paper',
  model: 'Model Exam'
};

const SimplifiedExplanationBox: React.FC<{
  subject: string;
  question: string;
  originalExplanation: string;
  medium: any;
}> = ({ subject, question, originalExplanation, medium }) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    setLoading(true);
    try {
      const result = await generateSimplerExplanation(subject, question, originalExplanation, medium);
      setExplanation(result);
    } catch (e) {
      setExplanation("Unable to generate simplified view.");
    } finally {
      setLoading(false);
    }
  };

  if (explanation) {
    return (
      <div className="mt-6 p-6 bg-indigo-50/50 rounded-[2rem] border border-indigo-100/50 animate-fade-up">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Lumina Simplified Version</p>
        </div>
        <p className="text-sm font-semibold text-slate-700 leading-relaxed italic border-l-4 border-indigo-200 pl-4">
          {explanation}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <button 
        onClick={handleRequest}
        disabled={loading}
        className="group relative flex items-center gap-3 px-6 py-3 rounded-2xl bg-white border-2 border-slate-100 hover:border-indigo-600 transition-all duration-300 disabled:opacity-50 overflow-hidden"
      >
        <div className={`shrink-0 transition-transform duration-500 ${loading ? 'animate-spin' : 'group-hover:rotate-12'}`}>
          {loading ? (
            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : (
            <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L9.19 8.63 2 9.24 7.45 13.97 5.82 21 12 17.27 18.18 21 16.55 13.97 22 9.24 14.81 8.63 12 2z" /></svg>
          )}
        </div>
        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">
          {loading ? 'Consulting Tutor Engine...' : 'Request simpler explanation'}
        </span>
      </button>
    </div>
  );
};

const ExamRoom: React.FC<ExamRoomProps> = ({ subject, topic, type, isTimed, onFinish }) => {
  const { user, updateUser } = useAuth();
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [viewState, setViewState] = useState<'testing' | 'summary' | 'review'>('testing');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isTimeout, setIsTimeout] = useState(false);
  const timerRef = useRef<any>(null);

  const questionsRef = useRef<MCQQuestion[]>([]);
  const answersRef = useRef<number[]>([]);
  const viewStateRef = useRef(viewState);

  useEffect(() => {
    questionsRef.current = questions;
    answersRef.current = answers;
    viewStateRef.current = viewState;
  }, [questions, answers, viewState]);

  const fetchQuestions = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    setQuestions([]);
    setCurrentIdx(0);
    setAnswers([]);
    
    let count = 5; 
    if (type === 'past' || type === 'model') count = 10; 
    if (user.plan === PlanType.FREE) {
      const remaining = 20 - user.questionsAnsweredThisMonth;
      count = Math.min(count, Math.max(0, remaining));
    }

    if (count <= 0 && user.plan === PlanType.FREE) {
      setError("Monthly question limit reached. Upgrade to Plus for unlimited access.");
      setLoading(false);
      return;
    }

    try {
      const q = await generateQuestions(subject, user.medium, count, topic || "general", type);
      if (q && q.length > 0) {
        setQuestions(q);
        if (isTimed) {
          setTimeLeft(q.length * 72); 
        }
      } else {
        setError("Lumina failed to generate valid curriculum questions. Please try a different topic or verify your connection.");
      }
    } catch (e: any) {
      console.error("Fetch Failure:", e);
      setError(e.message || "A secure connection error occurred. Please verify your internet and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [subject, user?.id]);

  useEffect(() => {
    if (isTimed && !loading && viewState === 'testing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsTimeout(true);
            calculateResult(); 
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, viewState, isTimed]);

  const handleAnswer = (choiceIdx: number) => {
    if (viewState !== 'testing') return;
    const newAnswers = [...answers];
    newAnswers[currentIdx] = choiceIdx;
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      calculateResult();
    }
  };

  const calculateResult = async () => {
    if (viewStateRef.current !== 'testing') return;
    if (timerRef.current) clearInterval(timerRef.current);

    const currentAnswers = answersRef.current;
    const currentQuestions = questionsRef.current;
    
    let s = 0;
    currentQuestions.forEach((q, idx) => {
      if (currentAnswers[idx] === q.correctAnswerIndex) s++;
    });
    
    setScore(s);
    setViewState('summary');

    if (user) {
      const updatedUser = {
        ...user,
        questionsAnsweredThisMonth: user.questionsAnsweredThisMonth + currentQuestions.length,
        papersAnsweredThisMonth: user.papersAnsweredThisMonth + (currentQuestions.length >= 10 ? 1 : 0)
      };
      await updateUser(updatedUser);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
        <div className="w-16 h-16 border-[5px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-8"></div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2 animate-pulse">Consulting Syllabus Engine...</h2>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-12">Authenticating with MOE Curriculum Standards</p>
        <button 
          onClick={onFinish}
          className="px-10 py-4 bg-white border-2 border-slate-200 text-slate-400 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:text-slate-600 hover:border-slate-300 transition-all shadow-sm"
        >
          Exit to Dashboard
        </button>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mb-8">
           <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-4">Exam Retrieval Failed</h2>
        <div className="bg-white border-2 border-red-50 p-6 rounded-3xl mb-10 max-w-md w-full shadow-sm">
           <p className="text-red-500 font-bold text-sm leading-relaxed">{error || "The AI system failed to compile the requested questions."}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={fetchQuestions} className="px-10 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl">Retry Generation</button>
          <button onClick={onFinish} className="px-10 py-4 bg-white border-2 border-slate-200 text-slate-500 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">Return to Dashboard</button>
        </div>
      </div>
    );
  }

  if (viewState === 'summary') {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="bg-white rounded-[4rem] shadow-xl p-12 md:p-16 max-w-2xl w-full text-center border border-white animate-fade-up">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-indigo-600 text-white mb-10 shadow-2xl">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="text-4xl font-black mb-6 text-slate-900 tracking-tight">Paper Summary</h2>
          <div className="grid grid-cols-3 gap-6 mb-12">
            <div className="bg-slate-50 p-6 rounded-3xl"><p className="text-3xl font-black text-indigo-600">{score}</p><p className="text-[10px] uppercase font-black text-slate-400">Correct</p></div>
            <div className="bg-slate-50 p-6 rounded-3xl"><p className="text-3xl font-black text-slate-900">{questions.length}</p><p className="text-[10px] uppercase font-black text-slate-400">Items</p></div>
            <div className="bg-slate-950 p-6 rounded-3xl"><p className="text-3xl font-black text-white">{percentage}%</p><p className="text-[10px] uppercase font-black text-slate-400">Result</p></div>
          </div>
          <div className="flex flex-col gap-4">
            <button onClick={() => setViewState('review')} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-600 shadow-xl transition-all">Detailed Review</button>
            <button onClick={onFinish} className="w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest text-slate-400">Return Home</button>
          </div>
        </div>
      </div>
    );
  }

  if (viewState === 'review') {
    return (
      <div className="min-h-screen bg-slate-50 pb-32">
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 py-6 px-10 sticky top-0 z-50 flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-900">Review: {subject}</h2>
          <button onClick={onFinish} className="bg-slate-950 text-white px-8 py-3 rounded-xl font-black text-xs tracking-widest uppercase">Finish Review</button>
        </header>
        <div className="max-w-3xl mx-auto p-6 space-y-8 mt-12">
          {questions.map((q, i) => (
            <div key={i} className={`p-10 rounded-[3rem] border-2 bg-white ${answers[i] === q.correctAnswerIndex ? 'border-emerald-50' : 'border-red-50 shadow-sm'}`}>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Item {i+1}</p>
              <p className="text-xl font-bold text-slate-800 mb-8">{q.question}</p>
              <div className="grid grid-cols-1 gap-3 mb-8">
                {q.options.map((opt, optIdx) => (
                  <div key={optIdx} className={`p-5 rounded-2xl border-2 font-bold text-sm ${optIdx === q.correctAnswerIndex ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : optIdx === answers[i] ? 'bg-red-50 border-red-500 text-red-900' : 'bg-slate-50 border-slate-50 text-slate-500'}`}>
                    {opt}
                  </div>
                ))}
              </div>
              <div className="pt-6 border-t border-slate-50">
                <p className="text-[10px] font-black uppercase text-indigo-600 mb-2">Examiner Rationale</p>
                <p className="text-sm font-medium text-slate-600 leading-relaxed">{q.explanation}</p>
                <SimplifiedExplanationBox subject={subject} question={q.question} originalExplanation={q.explanation} medium={user?.medium} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];
  const progress = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      <header className="w-full bg-white border-b border-slate-100 py-6 px-10 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" /></svg>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">{subject}</h2>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1.5">{typeLabels[type]}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${progress}%` }}></div>
              </div>
              <span className="text-[10px] font-black text-slate-400 tabular-nums uppercase">{currentIdx + 1}/{questions.length}</span>
            </div>
          </div>
        </div>
        {isTimed && (
          <div className={`px-6 py-2 rounded-xl border-2 font-black tabular-nums transition-colors ${timeLeft < 30 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
            {formatTime(timeLeft)}
          </div>
        )}
      </header>

      <main className="max-w-4xl w-full p-6 pt-12 pb-32">
        <div className="bg-white rounded-[3.5rem] shadow-xl border border-white p-12 md:p-20 animate-fade-up">
          <h3 className="text-2xl md:text-3xl font-bold mb-16 leading-relaxed text-slate-800">{q?.question}</h3>
          <div className="grid grid-cols-1 gap-4">
            {q?.options?.map((opt, i) => (
              <button key={i} onClick={() => handleAnswer(i)} className={`group w-full flex items-center gap-6 p-6 rounded-[2rem] border-2 transition-all text-left ${answers[currentIdx] === i ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-50 bg-slate-50 hover:border-slate-200 hover:bg-white'}`}>
                <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-black text-sm border-2 transition-all ${answers[currentIdx] === i ? 'bg-indigo-600 text-white border-indigo-600' : 'text-slate-400 border-slate-100 bg-white'}`}>
                  {String.fromCharCode(65 + i)}
                </div>
                <span className={`text-lg font-bold ${answers[currentIdx] === i ? 'text-indigo-950' : 'text-slate-600'}`}>{opt}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="mt-12 flex gap-6">
          <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(prev => prev - 1)} className="px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest text-slate-400 border border-slate-200 hover:text-slate-900 hover:bg-white disabled:opacity-0 transition-all">Previous</button>
          <button disabled={answers[currentIdx] === undefined} onClick={nextQuestion} className="flex-1 bg-slate-950 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all disabled:opacity-30">
            {currentIdx === questions.length - 1 ? 'Finish Examination' : 'Lock & Next'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default ExamRoom;
