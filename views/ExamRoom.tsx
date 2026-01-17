
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { MCQQuestion, PlanType } from '../types';
import { generateQuestions } from '../services/geminiService';

interface ExamRoomProps {
  subject: string;
  topic?: string;
  type: 'quick' | 'topic' | 'past' | 'model';
  isTimed?: boolean;
  onFinish: () => void;
}

const ExamRoom: React.FC<ExamRoomProps> = ({ subject, topic, type, isTimed, onFinish }) => {
  const { user, updateUser } = useAuth();
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  // Fix: Changed NodeJS.Timeout to any to avoid namespace errors in browser environments
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!user) return;
      
      // Determine question count based on plan
      let count = 5;
      if (user.plan === PlanType.PRO) count = 10;
      if (user.plan === PlanType.PLUS) count = 20;
      // Note: for real simulation, Past/Model should be 50, but we scale for demo.
      // If we assume full paper (50q) = 60m, then per question time is 3600/50 = 72s.

      const q = await generateQuestions(subject, user.medium, count, topic || "general", type);
      setQuestions(q);
      
      if (isTimed) {
        // Calculate proportional time: 60 minutes for 50 questions
        const totalSeconds = (q.length / 50) * 3600;
        setTimeLeft(Math.floor(totalSeconds));
      }
      
      setLoading(false);
    };
    fetchQuestions();
  }, [subject, user, topic, type, isTimed]);

  useEffect(() => {
    if (isTimed && !loading && !showResult && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
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
  }, [loading, showResult, isTimed, timeLeft]);

  const handleAnswer = (choiceIdx: number) => {
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

  const calculateResult = () => {
    if (showResult) return;
    
    let s = 0;
    answers.forEach((ans, idx) => {
      if (ans === questions[idx].correctAnswerIndex) s++;
    });
    setScore(s);
    setShowResult(true);

    // Update usage
    if (user) {
      const updatedUser = {
        ...user,
        questionsAnsweredThisMonth: user.questionsAnsweredThisMonth + questions.length,
        papersAnsweredThisMonth: user.papersAnsweredThisMonth + 1
      };
      updateUser(updatedUser);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getExamTitle = () => {
    switch(type) {
      case 'past': return 'Past Paper Simulation';
      case 'model': return 'Advanced Model Paper';
      case 'topic': return `Topic: ${topic}`;
      default: return 'Quick Revision';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
        <div className="relative mb-10">
           <div className="w-24 h-24 border-[6px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
           <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
             <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
           </div>
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">AI is compiling your paper...</h2>
        <p className="text-slate-500 max-w-sm mx-auto font-medium leading-relaxed">
          Generating {getExamTitle()} for <strong>{subject}</strong>. 
          Sourcing from MOE Syllabus & Teacher Guides.
        </p>
        <div className="mt-12 w-full max-w-md bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center gap-4">
           <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
             <div className="h-full bg-indigo-600 animate-[loading_3s_ease-in-out_infinite]"></div>
           </div>
           <div className="flex justify-between w-full px-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Scanning syllabus</span>
              <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">Structuring MCQs</span>
           </div>
        </div>
      </div>
    );
  }

  if (showResult) {
    const percent = (score / questions.length) * 100;
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100/50">
        <div className="bg-white rounded-[3rem] shadow-2xl p-10 max-w-2xl w-full text-center border border-white relative overflow-hidden">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 relative z-10">
            🏆
          </div>
          <h2 className="text-4xl font-black mb-2 text-slate-900 tracking-tight">Paper Complete!</h2>
          <p className="text-slate-500 font-bold mb-10">{getExamTitle()} for {subject}</p>
          
          <div className="grid grid-cols-2 gap-6 mb-10">
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Score</p>
              <p className="text-5xl font-black text-indigo-600">{score}<span className="text-2xl text-slate-300">/{questions.length}</span></p>
            </div>
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Accuracy</p>
              <p className="text-5xl font-black text-emerald-600">{percent.toFixed(0)}<span className="text-2xl text-slate-300">%</span></p>
            </div>
          </div>

          <div className="space-y-4 text-left max-h-[400px] overflow-y-auto pr-4 custom-scrollbar mb-10">
            <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-6">In-depth Review</h4>
            {questions.map((q, i) => (
              <div key={i} className={`p-6 rounded-[2rem] border-2 transition-all ${answers[i] === q.correctAnswerIndex ? 'border-emerald-100 bg-emerald-50/50' : 'border-red-100 bg-red-50/50'}`}>
                <div className="flex gap-4 mb-4">
                  <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-black ${answers[i] === q.correctAnswerIndex ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                    {i + 1}
                  </div>
                  <p className="font-bold text-slate-800 leading-relaxed">{q.question}</p>
                </div>
                <div className="ml-12 space-y-2">
                  <p className="text-xs text-slate-600">Your choice: <span className="font-black text-slate-900">{q.options[answers[i]] || 'Skipped'}</span></p>
                  <p className="text-xs text-emerald-700">Correct: <span className="font-black">{q.options[q.correctAnswerIndex]}</span></p>
                  <div className="mt-4 p-4 bg-white/60 rounded-2xl text-xs leading-relaxed text-slate-600 italic border border-white/40">
                    <strong className="block text-slate-800 not-italic uppercase tracking-widest text-[9px] mb-1">AI Explanation</strong>
                    {q.explanation}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={onFinish}
            className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-xl hover:shadow-indigo-200"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];

  return (
    <div className="min-h-screen p-6 bg-slate-50 flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        <header className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{subject}</h2>
            <div className="flex items-center gap-2 mt-1">
               <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{getExamTitle()}</span>
               <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Question {currentIdx + 1} of {questions.length}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isTimed && (
              <div className={`px-6 py-3 rounded-2xl border-2 flex items-center gap-3 transition-all ${timeLeft < 60 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-white border-slate-100 text-slate-900'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-xl font-black font-mono tracking-tighter">{formatTime(timeLeft)}</span>
              </div>
            )}
            <button onClick={() => { if(confirm('Are you sure you want to exit? Your progress will not be saved.')) onFinish(); }} className="p-3 rounded-2xl bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all border border-slate-100 shadow-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </header>

        <div className="w-full bg-slate-200 h-1.5 rounded-full mb-12 overflow-hidden shadow-inner">
          <div className="bg-indigo-600 h-full transition-all duration-700 ease-out" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}></div>
        </div>

        <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 p-8 md:p-14 mb-8 flex-1 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity">
            <svg className="w-20 h-20 text-indigo-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold mb-14 leading-[1.6] text-slate-800 relative z-10">
            {q.question}
          </h3>

          <div className="space-y-4 relative z-10">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className={`w-full flex items-center gap-5 p-6 rounded-[1.5rem] border-2 transition-all text-left group/opt ${answers[currentIdx] === i ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-4 ring-indigo-50' : 'border-slate-50 bg-slate-50/30 hover:border-slate-200 hover:bg-slate-50'}`}
              >
                <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-black text-sm border-2 transition-colors ${answers[currentIdx] === i ? 'bg-indigo-600 text-white border-indigo-600' : 'text-slate-400 border-slate-200 bg-white'}`}>
                  {String.fromCharCode(65 + i)}
                </div>
                <span className={`text-lg font-bold leading-snug ${answers[currentIdx] === i ? 'text-indigo-900' : 'text-slate-600 group-hover/opt:text-slate-800'}`}>{opt}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="sticky bottom-0 pb-8 pt-4 bg-slate-50/80 backdrop-blur-md flex gap-4">
          <button 
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(prev => prev - 1)}
            className="flex-1 py-5 px-8 rounded-[1.5rem] font-black text-xs uppercase tracking-widest bg-white text-slate-400 border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Previous
          </button>
          <button 
            disabled={answers[currentIdx] === undefined}
            onClick={nextQuestion}
            className="flex-[2] py-5 px-8 rounded-[1.5rem] font-black text-xs uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-3 shadow-[0_15px_30px_-10px_rgba(79,70,229,0.4)]"
          >
            {currentIdx === questions.length - 1 ? 'Submit Paper' : 'Next Question'}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamRoom;
