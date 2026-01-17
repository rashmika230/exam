
import React, { useState } from 'react';
import { PlanType, SubjectStream, Medium } from '../types.ts';
import { useAuth } from '../App.tsx';
import { SRI_LANKAN_SCHOOLS } from '../constants.ts';
import { AuthLayout, FormField, AuthButton } from '../components/AuthUI.tsx';
import { supabase } from '../supabaseClient.ts';

interface RegisterPageProps {
  selectedPlan: PlanType;
  onLogin: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ selectedPlan, onLogin }) => {
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    preferredName: '',
    whatsappNo: '',
    school: SRI_LANKAN_SCHOOLS[1],
    customSchool: '',
    alYear: '2026',
    subjectStream: SubjectStream.PHYSICAL_SCIENCE,
    email: '',
    password: '',
    plan: selectedPlan,
    medium: Medium.SINHALA
  });

  const isOtherSelected = formData.school === "Other School Not Listed";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const finalData = { ...formData };
    if (isOtherSelected && formData.customSchool) {
      finalData.school = formData.customSchool;
    }

    const { error: regError } = await register(finalData);
    if (regError) {
      setError(regError);
      setLoading(false);
    } else {
      setIsSuccess(true);
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setResending(true);
    setResendStatus('idle');
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
      });
      if (resendError) throw resendError;
      setResendStatus('success');
    } catch (err: any) {
      console.error("Resend error:", err);
      setResendStatus('error');
    } finally {
      setResending(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout title="Check Your Email" subtitle="We've sent a verification link to your inbox.">
        <div className="px-10 pb-12 text-center space-y-8 animate-fade-up">
           <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
           </div>
           <div className="space-y-4">
             <p className="text-slate-600 font-medium leading-relaxed">
               A verification email has been sent to <span className="font-black text-slate-900">{formData.email}</span>. 
               Please click the link in the email to activate your account.
             </p>
             
             {resendStatus === 'success' && (
               <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest animate-fade-up">
                 Email resent successfully!
               </div>
             )}
             {resendStatus === 'error' && (
               <div className="p-3 bg-red-50 text-red-700 rounded-xl text-[10px] font-black uppercase tracking-widest animate-fade-up">
                 Failed to resend. Please try again later.
               </div>
             )}
           </div>

           <div className="flex flex-col gap-3">
             <AuthButton text="Back to Login" onClick={onLogin} type="button" />
             <button 
                type="button"
                disabled={resending}
                onClick={handleResendEmail}
                className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50"
             >
               {resending ? 'Resending...' : 'Resend Verification Email'}
             </button>
           </div>
           
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Didn't get the email? Check your spam folder.</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Enrollment" 
      subtitle="Join the leading platform for A/L excellence."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="p-10 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        {error && (
          <div className="md:col-span-2 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-wider animate-shake">
            {error}
          </div>
        )}

        <div className="md:col-span-2">
          <FormField label="Full Legal Name" value={formData.fullName} onChange={v => setFormData({...formData, fullName: v})} required disabled={loading} placeholder="e.g. Kasun Perera" />
        </div>

        <FormField label="Preferred Name" value={formData.preferredName} onChange={v => setFormData({...formData, preferredName: v})} required disabled={loading} placeholder="Kasun" />
        <FormField label="WhatsApp Number" value={formData.whatsappNo} onChange={v => setFormData({...formData, whatsappNo: v})} required disabled={loading} placeholder="07xxxxxxxx" />

        <div className="md:col-span-2">
          <FormField 
            label="School" 
            select 
            options={SRI_LANKAN_SCHOOLS} 
            value={formData.school} 
            onChange={v => setFormData({...formData, school: v})} 
            disabled={loading} 
          />
          {isOtherSelected && (
            <div className="mt-4 animate-fade-up">
              <FormField label="Manual School Entry" value={formData.customSchool} onChange={v => setFormData({...formData, customSchool: v})} required disabled={loading} placeholder="Enter your school" />
            </div>
          )}
        </div>

        <FormField label="A/L Year" select options={['2026', '2027', '2028', '2029', '2030']} value={formData.alYear} onChange={v => setFormData({...formData, alYear: v})} disabled={loading} />
        <FormField label="Medium" select options={Object.values(Medium)} value={formData.medium} onChange={v => setFormData({...formData, medium: v as Medium})} disabled={loading} />

        <div className="md:col-span-2">
          <FormField label="Academic Stream" select options={Object.values(SubjectStream)} value={formData.subjectStream} onChange={v => setFormData({...formData, subjectStream: v as SubjectStream})} disabled={loading} />
        </div>

        <FormField label="Email Address" type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} required disabled={loading} placeholder="email@example.com" />
        <FormField label="Password" type="password" value={formData.password} onChange={v => setFormData({...formData, password: v})} required disabled={loading} placeholder="••••••••" />

        <div className="md:col-span-2 pt-6">
          <AuthButton loading={loading} text="Create Account" />
          <p className="text-center text-slate-400 font-bold mt-6 text-xs">
            Already registered? <button type="button" onClick={onLogin} className="text-indigo-600 hover:text-indigo-800 transition-colors font-black">Sign In Here</button>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
