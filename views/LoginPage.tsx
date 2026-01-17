import React, { useState } from 'react';
import { useAuth } from '../App.tsx';

interface LoginPageProps {
  onRegister: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { error: loginError } = await login(email, password);
    if (loginError) {
      setError(loginError);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 selection:bg-indigo-100">
      <div className="bg-white rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] w-full max-md overflow-hidden border border-slate-100">
        <div className="p-10 bg-indigo-600 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500 to-indigo-700 opacity-50"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-black tracking-tight mb-2">Welcome Back</h2>
            <p className="text-indigo-100 font-medium">Continue your journey to mastery.</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 space-y-7">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
              {error}
            </div>
          )}
          
          <div className="space-y-2.5">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
            <input 
              required 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full px-5 py-4 rounded-2xl border-2 border-slate-50 bg-slate-50 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 focus:bg-white transition-all font-bold text-slate-800" 
              placeholder="e.g. kasun@student.lk" 
              disabled={loading}
            />
          </div>

          <div className="space-y-2.5">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
            <input 
              required 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full px-5 py-4 rounded-2xl border-2 border-slate-50 bg-slate-50 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 focus:bg-white transition-all font-bold text-slate-800" 
              placeholder="••••••••" 
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4.5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Log In'}
          </button>

          <div className="pt-4 text-center">
            <p className="text-sm font-bold text-slate-400">
              Don't have an account? <button type="button" onClick={onRegister} className="text-indigo-600 hover:text-indigo-800 transition-colors">Join Lumina</button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;