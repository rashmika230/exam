
import React, { useState } from 'react';
import { useAuth } from '../App.tsx';
import { AuthLayout, FormField, AuthButton } from '../components/AuthUI.tsx';
import { supabase } from '../supabaseClient.ts';

interface LoginPageProps {
  onRegister: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const isVerificationError = error.toLowerCase().includes('confirmed') || error.toLowerCase().includes('verify');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResendStatus('idle');
    
    const { error: loginError } = await login(email, password);
    if (loginError) {
      if (loginError.toLowerCase().includes('confirmed') || loginError.toLowerCase().includes('verify')) {
        setError('Your email is not verified. Please check your inbox for the activation link.');
      } else {
        setError(loginError);
      }
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      if (resendError) throw resendError;
      setResendStatus('success');
      setError('');
    } catch (err) {
      setResendStatus('error');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Continue your journey to A/L mastery.">
      <form onSubmit={handleSubmit} className="px-10 pb-12 space-y-6">
        {error && (
          <div className={`p-5 rounded-2xl text-[11px] font-black uppercase tracking-wider flex flex-col gap-3 animate-shake ${isVerificationError ? 'bg-amber-50 border border-amber-100 text-amber-700' : 'bg-red-50 border border-red-100 text-red-600'}`}>
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
              <span className="leading-tight">{error}</span>
            </div>
            {isVerificationError && (
              <button 
                type="button" 
                onClick={handleResend}
                disabled={resending}
                className="mt-1 text-left text-amber-800 underline decoration-amber-300 hover:text-amber-900 transition-colors font-black"
              >
                {resending ? 'RESENDING...' : 'RESEND VERIFICATION LINK'}
              </button>
            )}
          </div>
        )}

        {resendStatus === 'success' && (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] font-black uppercase tracking-wider flex items-center gap-3 animate-fade-up">
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            <span>Verification email resent. Please check your inbox.</span>
          </div>
        )}
        
        <FormField 
          label="Email Address" 
          type="email" 
          value={email} 
          onChange={setEmail} 
          placeholder="name@example.com" 
          required 
          disabled={loading} 
        />

        <FormField 
          label="Password" 
          type="password" 
          value={password} 
          onChange={setPassword} 
          placeholder="••••••••" 
          required 
          disabled={loading} 
        />

        <div className="pt-4">
          <AuthButton loading={loading} text="Sign In" />
        </div>

        <div className="text-center pt-2">
          <p className="text-xs font-bold text-slate-400">
            Don't have an account? <button type="button" onClick={onRegister} className="text-indigo-600 hover:text-indigo-800 transition-colors font-black">Join Lumina</button>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
