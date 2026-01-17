
import React, { useState } from 'react';
import { PlanType, SubjectStream, Medium } from '../types';
import { useAuth } from '../App';
import { SRI_LANKAN_SCHOOLS } from '../constants';

interface RegisterPageProps {
  selectedPlan: PlanType;
  onLogin: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ selectedPlan, onLogin }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    preferredName: '',
    whatsappNo: '',
    school: SRI_LANKAN_SCHOOLS[1], // Skip first header
    customSchool: '',
    alYear: '2026',
    subjectStream: SubjectStream.PHYSICAL_SCIENCE,
    email: '',
    password: '',
    plan: selectedPlan,
    medium: Medium.SINHALA
  });

  const isOtherSelected = formData.school === "Other School Not Listed";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = { ...formData };
    if (isOtherSelected && formData.customSchool) {
      finalData.school = formData.customSchool;
    }
    register(finalData);
  };

  const inputClasses = "w-full px-5 py-3.5 rounded-2xl border-2 border-slate-50 bg-slate-50 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 focus:bg-white transition-all font-bold text-slate-800 text-sm placeholder:font-medium";
  const labelClasses = "text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1 block mb-1.5";

  return (
    <div className="min-h-screen bg-indigo-50/50 flex items-center justify-center p-6 selection:bg-indigo-100">
      <div className="bg-white rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(79,70,229,0.1)] w-full max-w-3xl overflow-hidden border border-slate-100">
        <div className="p-10 bg-indigo-600 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-black tracking-tight mb-1">Create Account</h2>
            <p className="text-indigo-100 font-medium">Join thousands of Sri Lankan high-achievers.</p>
          </div>
          <div className="hidden sm:block relative z-10">
             <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Tier Selected</p>
                <p className="text-xl font-black">{formData.plan}</p>
             </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="md:col-span-2">
            <label className={labelClasses}>Full Legal Name</label>
            <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className={inputClasses} placeholder="e.g. Kasun Chathuranga Perera" />
          </div>

          <div>
            <label className={labelClasses}>Preferred Name</label>
            <input required type="text" value={formData.preferredName} onChange={e => setFormData({...formData, preferredName: e.target.value})} className={inputClasses} placeholder="e.g. Kasun" />
          </div>

          <div>
            <label className={labelClasses}>WhatsApp Number</label>
            <input required type="tel" value={formData.whatsappNo} onChange={e => setFormData({...formData, whatsappNo: e.target.value})} className={inputClasses} placeholder="07x xxxxxxx" />
          </div>

          <div className="md:col-span-2 space-y-4">
            <div>
              <label className={labelClasses}>Select Your School</label>
              <select 
                required 
                value={formData.school} 
                onChange={e => setFormData({...formData, school: e.target.value})} 
                className={inputClasses}
              >
                {SRI_LANKAN_SCHOOLS.map(school => (
                  <option key={school} value={school} disabled={school.startsWith('--')}>{school}</option>
                ))}
              </select>
            </div>
            
            {isOtherSelected && (
              <div className="animate-fade-up">
                <label className={labelClasses}>Type your school name</label>
                <input 
                  required 
                  type="text" 
                  value={formData.customSchool} 
                  onChange={e => setFormData({...formData, customSchool: e.target.value})} 
                  className={inputClasses} 
                  placeholder="Enter your school name manually" 
                  autoFocus
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>A/L Year</label>
              <select value={formData.alYear} onChange={e => setFormData({...formData, alYear: e.target.value})} className={inputClasses}>
                <option>2026</option>
                <option>2027</option>
                <option>2028</option>
                <option>2029</option>
                <option>2030</option>
              </select>
            </div>
            <div>
              <label className={labelClasses}>Medium</label>
              <select value={formData.medium} onChange={e => setFormData({...formData, medium: e.target.value as Medium})} className={inputClasses}>
                {Object.values(Medium).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className={labelClasses}>Academic Stream</label>
            <select value={formData.subjectStream} onChange={e => setFormData({...formData, subjectStream: e.target.value as SubjectStream})} className={inputClasses}>
              {Object.values(SubjectStream).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClasses}>Email Address</label>
            <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={inputClasses} placeholder="email@example.com" />
          </div>

          <div>
            <label className={labelClasses}>Password</label>
            <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className={inputClasses} placeholder="••••••••" />
          </div>

          <div className="md:col-span-2 pt-6">
            <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-[1.75rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all hover:-translate-y-1 active:scale-95">
              Complete Registration
            </button>
            <p className="text-center text-slate-400 font-bold mt-6 text-sm">
              Already a member? <button type="button" onClick={onLogin} className="text-indigo-600 hover:text-indigo-800 transition-colors">Sign In Here</button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
