import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App.tsx';
import { MCQQuestion, PlanType } from '../types.ts';
import { generateQuestions } from '../services/geminiService.ts';

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
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!user) return;
      
      let count = 10;
      if (type === 'past' || type === 'model') count = 50;
      if (user.plan === PlanType.FREE) count = Math.min(count, 20 - user.questionsAnsweredThisMonth);

      try {
        const q = await generateQuestions(subject, user.medium, count, topic || "general", type);
        setQuestions(q);
        
        if (isTimed) {
          setTimeLeft(q.length * 72);
        }
      } catch (e) {
        console.error("Failed to load questions", e);
      } finally {
        setLoading(false);
      }
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

  const calculateResult = async () => {
    if (showResult) return;
    
    let s = 0;
    answers.forEach((ans, idx) => {
      if (ans === questions[idx].correctAnswerIndex) s++;
    });
    setScore(s);
    setShowResult(true);

    if (user) {
      const updatedUser = {
        ...user,
        questionsAnsweredThisMonth: user.questionsAnsweredThisMonth + questions.length,
        papersAnsweredThisMonth: user.papersAnsweredThisMonth + (questions.length >= 40 ? 1 : 0)
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
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Compiling Syllabus Content...</h2>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Sourcing questions from Official MOE Guides</p>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-indigo-50/30">
        <div className="bg-white rounded-[3rem] shadow-2xl p-12 max-w-2xl w-full text-center border border-white">
          <p className="text-indigo-600 font-black text-[10px] uppercase tracking-widest mb-2">Performance Report</p>
          <h2 className="text-4xl font-black mb-10 text-slate-900">{subject} Review</h2>
          <div className="flex justify-center gap-12 mb-12">
            <div>
              <p className="text-5xl font-black text-indigo-600">{score}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase mt-2 tracking-widest">Correct Answers</p>
            </div>
            <div className="w-[1px] bg-slate-100"></div>
            <div>
              <p className="text-5xl font-black text-slate-900">{questions.length}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase mt-2 tracking-widest">Total Items</p>
            </div>
          </div>
          <div className="space-y-4 text-left max-h-80 overflow-y-auto pr-2 mb-10">
            {questions.map((q, i) => (
              <div key={i} className={`p-6 rounded-3xl border-2 ${answers[i] === q.correctAnswerIndex ? 'border-emerald-50 bg-emerald-50/20' : 'border-red-50 bg-red-50/20'}`}>
                <p className="font-bold text-slate-800 mb-2">Question {i+1}: {q.question}</p>
                <p className="text-xs font-bold text-emerald-600">Correct: {q.options[q.correctAnswerIndex]}</p>
              </div>
            ))}
          </div>
          <button onClick={onFinish} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 shadow-xl transition-all">Continue Dashboard</button>
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];

  return (
    <div className="min-h-screen p-6 bg-slate-50 flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-2xl font-black text-slate-900">{subject}</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Question {currentIdx + 1} of {questions.length}</p>
          </div>
          {isTimed && (
            <div className="px-6 py-3 rounded-2xl border-2 bg-white border-slate-100 font-black text-xl tracking-tighter tabular-nums">
              {formatTime(timeLeft)}
            </div>
          )}
        </header>

        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-12 mb-8 flex-1">
          <h3 className="text-2xl font-bold mb-12 leading-relaxed text-slate-800">{q.question}</h3>
          <div className="space-y-4">
            {q.options.map((opt, i) => (
              <button key={i} onClick={() => handleAnswer(i)} className={`w-full flex items-center gap-6 p-6 rounded-2xl border-2 transition-all text-left ${answers[currentIdx] === i ? 'border-indigo-600 bg-indigo-50 shadow-lg' : 'border-slate-50 bg-slate-50 hover:border-slate-100'}`}>
                <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-black text-sm border-2 ${answers[currentIdx] === i ? 'bg-indigo-600 text-white border-indigo-600' : 'text-slate-400 border-slate-200 bg-white'}`}>{String.fromCharCode(65 + i)}</div>
                <span className={`font-bold ${answers[currentIdx] === i ? 'text-indigo-900' : 'text-slate-600'}`}>{opt}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 pb-10">
          <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(prev => prev - 1)} className="flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 border border-slate-200 disabled:opacity-30">Previous</button>
          <button disabled={answers[currentIdx] === undefined} onClick={nextQuestion} className="flex-[2] py-5 rounded-2xl font-black text-xs uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl disabled:opacity-50">
            {currentIdx === questions.length - 1 ? 'Finish Exam' : 'Next Question'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamRoom;