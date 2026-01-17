
import React from 'react';

const GraduationCapIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 3L1 9l11 6l9-4.91V17h2V9L12 3z"/>
    <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
  </svg>
);

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  maxWidth?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle, maxWidth = "max-w-[480px]" }) => (
  <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 selection:bg-indigo-100 relative">
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px] opacity-60"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-50 rounded-full blur-[120px] opacity-60"></div>
    </div>

    <div className={`relative w-full ${maxWidth} animate-fade-up`}>
      <div className="bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] overflow-hidden border border-slate-100">
        <div className="pt-12 pb-8 px-10 text-center relative">
          <div className="inline-flex w-14 h-14 bg-indigo-600 rounded-2xl items-center justify-center text-white mb-6 shadow-xl shadow-indigo-100 mx-auto">
            <GraduationCapIcon className="w-7 h-7" />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-2">{title}</h2>
          <p className="text-slate-400 font-medium text-sm">{subtitle}</p>
        </div>
        {children}
      </div>
      <p className="mt-8 text-center text-[10px] text-slate-300 font-black uppercase tracking-widest">Lumina Education System • Sri Lanka</p>
    </div>
  </div>
);

interface FormFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: string[];
  select?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({ label, type = "text", value, onChange, placeholder, required, disabled, options, select }) => {
  const inputClasses = "w-full px-6 py-4 rounded-2xl border-2 border-slate-50 bg-slate-50 outline-none focus:border-indigo-600 focus:bg-white transition-all font-bold text-slate-800 text-sm placeholder:font-medium disabled:opacity-70 shadow-sm";
  const labelClasses = "text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 block mb-1.5";

  return (
    <div className="space-y-1.5">
      <label className={labelClasses}>{label}</label>
      {select ? (
        <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled} required={required} className={inputClasses}>
          {options?.map(opt => (
            <option key={opt} value={opt} disabled={opt.startsWith('--')}>{opt}</option>
          ))}
        </select>
      ) : (
        <input 
          type={type} 
          value={value} 
          onChange={e => onChange(e.target.value)} 
          placeholder={placeholder} 
          required={required} 
          disabled={disabled} 
          className={inputClasses} 
        />
      )}
    </div>
  );
};

export const AuthButton: React.FC<{ loading?: boolean; text: string; onClick?: () => void; type?: "button" | "submit" }> = ({ loading, text, onClick, type = "submit" }) => (
  <button 
    type={type}
    onClick={onClick}
    disabled={loading}
    className="w-full bg-slate-900 text-white py-4.5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 hover:bg-indigo-600 hover:shadow-indigo-100 transition-all active:scale-[0.97] flex items-center justify-center gap-3 disabled:opacity-70"
  >
    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : text}
  </button>
);
