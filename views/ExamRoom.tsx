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
    const result = await generateSimplerExplanation(subject, question, originalExplanation, medium);
    setExplanation(result);
    setLoading(false);
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
          {loading ? 'Consulting Tutor Engine...' : 'Too complex? Request simpler explanation'}
        </span>
        
        <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
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

  const answersRef = useRef<number[]>([]);
  const viewStateRef = useRef(viewState);
  const questionsRef = useRef<MCQQuestion[]>([]);

  useEffect(() => {
    answersRef.current = answers;
    viewStateRef.current = viewState;
    questionsRef.current = questions;
  }, [answers, viewState, questions]);

  const fetchQuestions = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    
    let count = 10;
    if (type === 'past' || type === 'model') count = 25; // Adjusted down from 50 for faster generation
    if (user.plan === PlanType.FREE) count = Math.min(count, 20 - user.questionsAnsweredThisMonth);

    try {
      const q = await generateQuestions(subject, user.medium, count, topic || "general", type);
      if (q && q.length > 0) {
        setQuestions(q);
        if (isTimed) {
          setTimeLeft(q.length * 72); 
        }
      } else {
        setError("Unable to generate questions for this topic. Please try a different unit or check your connection.");
      }
    } catch (e) {
      console.error("Failed to load questions", e);
      setError("A system error occurred. Please try again.");
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
            calculateResult(true); 
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

  const calculateResult = async (fromTimeout: boolean = false) => {
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
        papersAnsweredThisMonth: user.papersAnsweredThisMonth + (currentQuestions.length >= 25 ? 1 : 0)
      };
      await updateUser(updatedUser);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours > 0 ? hours + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
        <div className="w-16 h-16 border-[5px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-8"></div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2 animate-pulse">Compiling Syllabus Content...</h2>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">National Curriculum Engine Active</p>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mb-8">
           <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-4">{error || "No Questions Found"}</h2>
        <p className="text-slate-500 max-w-sm mb-10 font-medium">Lumina was unable to retrieve questions for this specific request. This can happen due to safety filters or specific curriculum complexities.</p>
        <div className="flex gap-4">
          <button onClick={fetchQuestions} className="px-10 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl">Retry Generation</button>
          <button onClick={onFinish} className="px-10 py-4 bg-white border border-slate-200 text-slate-500 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">Go Back</button>
        </div>
      </div>
    );
  }

  if (viewState === 'summary') {
    const percentage = Math.round((score / questions.length) * 100);
    const getFeedback = () => {
      if (isTimeout) return "Time Expired!";
      if (percentage >= 75) return "Excellent Achievement!";
      if (percentage >= 40) return "Great Effort, Keep Practicing!";
      return "Focus on Fundamentals.";
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
        <div className="bg-white rounded-[4rem] shadow-[0_32px_80px_-24px_rgba(0,0,0,0.1)] p-12 md:p-16 max-w-2xl w-full text-center border border-white relative z-10 animate-fade-up">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-[2rem] text-white mb-10 shadow-2xl ${isTimeout ? 'bg-amber-500 shadow-amber-200' : 'bg-indigo-600 shadow-indigo-200'}`}>
            {isTimeout ? (
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ) : (
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z" /></svg>
            )}
          </div>
          
          <p className={`${isTimeout ? 'text-amber-600' : 'text-indigo-600'} font-black text-[10px] uppercase tracking-[0.4em] mb-4`}>
            {isTimeout ? 'Timer Depleted' : 'Result Summary'}
          </p>
          <h2 className="text-4xl font-black mb-12 text-slate-900 tracking-tight leading-tight">
            {getFeedback()}
          </h2>

          <div className="grid grid-cols-3 gap-6 mb-16">
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-indigo-600 mb-1">{score}</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Correct</span>
            </div>
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-900 mb-1">{questions.length}</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Questions</span>
            </div>
            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 flex flex-col items-center justify-center shadow-lg shadow-slate-200">
              <span className="text-3xl font-black text-white mb-1">{percentage}%</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Score</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={() => setViewState('review')} 
              className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 shadow-2xl transition-all active:scale-[0.98]"
            >
              Analyze Answers
            </button>
            <button 
              onClick={onFinish} 
              className="w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (viewState === 'review') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center relative">
        <header className="sticky top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 py-6 px-10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-900">{subject}</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Performance Review</p>
          </div>
          <button onClick={onFinish} className="bg-slate-950 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all">Exit Review</button>
        </header>

        <div className="max-w-3xl w-full p-6 pb-32 space-y-8 animate-fade-up">
          {questions.map((q, i) => (
            <div key={i} className={`p-10 rounded-[3.5rem] border-2 flex flex-col gap-6 bg-white shadow-sm transition-all hover:shadow-md ${answers[i] === q.correctAnswerIndex ? 'border-emerald-50' : 'border-red-50'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-block px-3 py-1 rounded-lg bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Question {i+1}</span>
                  <p className="font-bold text-slate-800 leading-relaxed text-xl">{q.question}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-3xl border-2 border-emerald-100/50 bg-emerald-50/10">
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-2">Correct Option</p>
                  <p className="text-sm font-bold text-slate-700">{q.options[q.correctAnswerIndex]}</p>
                </div>
                {answers[i] !== q.correctAnswerIndex && (
                  <div className="p-5 rounded-3xl border-2 border-red-100/50 bg-red-50/10">
                    <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-2 flex items-center gap-2">Your Answer</p>
                    <p className="text-sm font-bold text-slate-700">{q.options[answers[i]] || "Skipped"}</p>
                  </div>
                )}
              </div>

              <div className="pt-8 mt-4 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">Curriculum Explanation</p>
                <p className="text-sm font-medium text-slate-600 leading-relaxed">{q.explanation}</p>
                <SimplifiedExplanationBox subject={subject} question={q.question} originalExplanation={q.explanation} medium={user?.medium} />
              </div>
            </div>
          ))}
          <div className="py-20 text-center">
            <button onClick={onFinish} className="bg-slate-900 text-white px-16 py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 shadow-2xl transition-all">Exit Performance Review</button>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];
  const progress = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      <header className="sticky top-0 w-full z-[60] bg-white/90 backdrop-blur-2xl border-b border-slate-100 py-6 px-10 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="hidden md:block">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">{subject}</h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">National Syllabus MCQ Exam</p>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Session Progress</span>
              <div className="flex items-center gap-3">
                 <div className="w-32 md:w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 transition-all duration-700 ease-out" style={{ width: `${progress}%` }}></div>
                 </div>
                 <span className="text-xs font-black text-slate-900 tabular-nums">{currentIdx + 1} / {questions.length}</span>
              </div>
            </div>
          </div>
          {isTimed && (
            <div className={`px-8 py-3 rounded-2xl border-2 flex flex-col items-center ${timeLeft < 30 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-white border-slate-100 text-slate-900 shadow-sm'}`}>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] mb-0.5">Time Remaining</span>
              <span className="text-2xl font-black tracking-tighter tabular-nums leading-none">{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl w-full p-6 pt-12 pb-32 flex flex-col flex-1">
        <div className="bg-white rounded-[4rem] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.06)] border border-white p-12 md:p-20 relative animate-fade-up">
           <h3 className="text-2xl md:text-3xl font-bold mb-16 leading-relaxed text-slate-800">{q?.question}</h3>
           <div className="grid grid-cols-1 gap-4">
            {q?.options?.map((opt, i) => (
              <button key={i} onClick={() => handleAnswer(i)} className={`group w-full flex items-center gap-8 p-6 rounded-[2rem] border-2 transition-all text-left relative overflow-hidden ${answers[currentIdx] === i ? 'border-indigo-600 bg-indigo-50/50 shadow-xl' : 'border-slate-50 bg-slate-50 hover:border-slate-200 hover:bg-white'}`}>
                <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center font-black text-base border-2 transition-all ${answers[currentIdx] === i ? 'bg-indigo-600 text-white border-indigo-600' : 'text-slate-400 border-slate-100 bg-white group-hover:border-indigo-200 group-hover:text-indigo-400'}`}>
                  {String.fromCharCode(65 + i)}
                </div>
                <span className={`text-lg font-bold transition-colors ${answers[currentIdx] === i ? 'text-indigo-950' : 'text-slate-600 group-hover:text-slate-900'}`}>{opt}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="mt-12 flex gap-6 items-center">
          <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(prev => prev - 1)} className="h-20 px-10 rounded-[2rem] font-black text-xs uppercase tracking-widest text-slate-400 border border-slate-200 hover:bg-white hover:text-slate-900 disabled:opacity-0">Previous</button>
          <button disabled={answers[currentIdx] === undefined} onClick={nextQuestion} className="h-20 flex-1 bg-slate-950 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-indigo-600 shadow-2xl transition-all disabled:opacity-30 flex items-center justify-center gap-4">
            {currentIdx === questions.length - 1 ? 'Complete Examination' : 'Confirm & Next'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default ExamRoom;