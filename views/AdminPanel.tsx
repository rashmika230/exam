import React, { useState, useEffect } from 'react';
import { User, PlanType, SubjectStream, Medium } from '../types.ts';
import { supabase } from '../supabaseClient.ts';

interface AdminPanelProps {
  onDashboard: () => void;
}

type AdminView = 'users' | 'analytics';

const AdminPanel: React.FC<AdminPanelProps> = ({ onDashboard }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [activeView, setActiveView] = useState<AdminView>('users');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      console.error("Error fetching users:", error);
    } else {
      const mapped = data.map(p => ({
        id: p.id,
        fullName: p.full_name,
        preferredName: p.preferred_name,
        whatsappNo: p.whatsapp_no,
        school: p.school,
        alYear: p.al_year,
        plan: p.plan as PlanType,
        subjectStream: p.subject_stream as SubjectStream,
        email: p.email,
        role: p.role as 'student' | 'admin',
        medium: p.medium as Medium,
        questionsAnsweredThisMonth: p.questions_answered_this_month,
        papersAnsweredThisMonth: p.papers_answered_this_month,
        lastResetDate: p.last_reset_date
      }));
      setUsers(mapped);
    }
    setLoading(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Are you sure you want to delete this user? This will remove their auth record and profile.')) {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) alert(error.message);
      else fetchUsers();
    }
  };

  const handleToggleRole = async (id: string, currentRole: 'student' | 'admin') => {
    const newRole = currentRole === 'student' ? 'admin' : 'student';
    if (confirm(`Are you sure you want to change this user to ${newRole}?`)) {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', id);
      
      if (error) alert(error.message);
      else fetchUsers();
    }
  };

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(filter.toLowerCase()) || 
    u.email.toLowerCase().includes(filter.toLowerCase())
  );

  const stats = {
    total: users.length,
    free: users.filter(u => u.plan === PlanType.FREE).length,
    pro: users.filter(u => u.plan === PlanType.PRO).length,
    plus: users.filter(u => u.plan === PlanType.PLUS).length,
    totalQuestions: users.reduce((acc, u) => acc + (u.questionsAnsweredThisMonth || 0), 0),
    totalPapers: users.reduce((acc, u) => acc + (u.papersAnsweredThisMonth || 0), 0),
  };

  const streamDistribution = Object.values(SubjectStream).map(stream => ({
    name: stream,
    count: users.filter(u => u.subjectStream === stream).length
  })).sort((a, b) => b.count - a.count);

  const planEngagement = [
    { name: 'Free', color: 'bg-slate-400', questions: users.filter(u => u.plan === PlanType.FREE).reduce((a, u) => a + u.questionsAnsweredThisMonth, 0) },
    { name: 'Pro', color: 'bg-indigo-500', questions: users.filter(u => u.plan === PlanType.PRO).reduce((a, u) => a + u.questionsAnsweredThisMonth, 0) },
    { name: 'Plus', color: 'bg-emerald-500', questions: users.filter(u => u.plan === PlanType.PLUS).reduce((a, u) => a + u.questionsAnsweredThisMonth, 0) },
  ];

  const maxQuestions = Math.max(...planEngagement.map(p => p.questions), 1);
  const maxStreamCount = Math.max(...streamDistribution.map(s => s.count), 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Control</h1>
            <p className="text-slate-500 font-bold mt-1">Lumina Official Administration Dashboard</p>
          </div>
          <div className="flex gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
            <button 
              onClick={() => setActiveView('users')}
              className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeView === 'users' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-transparent text-slate-400 hover:text-slate-900'}`}
            >
              Directory
            </button>
            <button 
              onClick={() => setActiveView('analytics')}
              className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeView === 'analytics' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-transparent text-slate-400 hover:text-slate-900'}`}
            >
              Intelligence
            </button>
            <div className="w-[1px] bg-slate-100 mx-1"></div>
            <button onClick={onDashboard} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all">Exit</button>
          </div>
        </header>

        {activeView === 'users' ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group transition-all hover:border-indigo-100">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3">Total Enrollment</p>
                <p className="text-5xl font-black text-slate-900">{stats.total}</p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3">Free Tier</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-5xl font-black text-slate-500">{stats.free}</p>
                  <span className="text-xs font-black text-slate-400">{stats.total ? Math.round((stats.free/stats.total)*100) : 0}%</span>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-indigo-100 bg-indigo-50/20">
                <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-3">Pro Active</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-5xl font-black text-indigo-600">{stats.pro}</p>
                  <span className="text-xs font-black text-indigo-400">{stats.total ? Math.round((stats.pro/stats.total)*100) : 0}%</span>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-emerald-100 bg-emerald-50/20">
                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-3">Plus Elite</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-5xl font-black text-emerald-600">{stats.plus}</p>
                  <span className="text-xs font-black text-emerald-400">{stats.total ? Math.round((stats.plus/stats.total)*100) : 0}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
              <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/30">
                <div>
                   <h2 className="text-2xl font-black text-slate-900 tracking-tight">Student Directory</h2>
                   <p className="text-slate-400 font-bold text-xs mt-1">Manage permissions and view usage statistics.</p>
                </div>
                <div className="relative w-full md:w-96">
                  <input 
                    type="text" 
                    placeholder="Search database..." 
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-slate-100 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all shadow-sm font-bold text-slate-800"
                  />
                  <svg className="w-5 h-5 text-slate-300 absolute left-5 top-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white border-b border-slate-50">
                      <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Identity</th>
                      <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Info</th>
                      <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan & Role</th>
                      <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Analytics</th>
                      <th className="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Command</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredUsers.length > 0 ? filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-all ${u.role === 'admin' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-500'}`}>
                              {u.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 tracking-tight">{u.fullName}</p>
                              <p className="text-xs text-slate-400 font-bold">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <p className="text-sm font-black text-slate-700">{u.subjectStream}</p>
                          <p className="text-xs text-slate-400 font-bold">{u.school} • {u.alYear}</p>
                        </td>
                        <td className="px-10 py-6">
                          <div className="flex flex-col gap-2">
                             <span className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase inline-block w-fit ${u.plan === PlanType.PLUS ? 'bg-emerald-100 text-emerald-700' : u.plan === PlanType.PRO ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                               Tier: {u.plan}
                             </span>
                             <span className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase inline-block w-fit ${u.role === 'admin' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                               {u.role}
                             </span>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center w-24">
                              <span className="text-[9px] font-black text-slate-400 uppercase">Solve Rate</span>
                              <span className="text-xs font-black text-slate-800">{u.questionsAnsweredThisMonth}</span>
                            </div>
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                              <div className="h-full bg-indigo-500" style={{ width: `${Math.min((u.questionsAnsweredThisMonth/50)*100, 100)}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <button 
                              onClick={() => handleToggleRole(u.id, u.role)}
                              className={`p-3 rounded-xl transition-all border ${u.role === 'student' ? 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white'}`}
                              title={u.role === 'student' ? 'Promote to Admin' : 'Demote to Student'}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            </button>
                            <button onClick={() => handleDeleteUser(u.id)} className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-400 hover:bg-red-500 hover:text-white transition-all">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-10 py-32 text-center">
                          <p className="text-slate-300 font-black text-lg">Empty Query Results</p>
                          <p className="text-slate-400 font-bold text-xs mt-1 uppercase tracking-widest">Adjust your filters to see results.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border border-slate-100 flex flex-col h-full animate-fade-up">
              <h3 className="text-2xl font-black mb-10 text-slate-900 flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                Tier Performance
              </h3>
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-10">
                  {planEngagement.map(plan => (
                    <div key={plan.name} className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="font-black text-slate-800 tracking-tight">{plan.name} Segment</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Platform Interactions</p>
                        </div>
                        <p className="text-2xl font-black text-slate-900">{plan.questions.toLocaleString()}</p>
                      </div>
                      <div className="h-4 bg-slate-50 rounded-full overflow-hidden flex shadow-inner p-[2px]">
                        <div 
                          className={`${plan.color} h-full rounded-full transition-all duration-1000 ease-out`} 
                          style={{ width: `${(plan.questions / maxQuestions) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-16 grid grid-cols-2 gap-6">
                  <div className="p-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl">
                    <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest mb-2">Platform solved</p>
                    <p className="text-3xl font-black text-white">{stats.totalQuestions.toLocaleString()}</p>
                  </div>
                  <div className="p-8 bg-indigo-600 rounded-3xl border border-indigo-500 shadow-xl">
                    <p className="text-indigo-200 text-[9px] font-black uppercase tracking-widest mb-2">Exams Completed</p>
                    <p className="text-3xl font-black text-white">{stats.totalPapers.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border border-slate-100 h-full animate-fade-up delay-100">
              <h3 className="text-2xl font-black mb-10 text-slate-900 flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" /></svg>
                </div>
                Stream Distribution
              </h3>
              <div className="space-y-7">
                {streamDistribution.map((stream, idx) => (
                  <div key={stream.name} className="group">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-black text-slate-600 group-hover:text-indigo-600 transition-colors">{stream.name}</span>
                      <span className="text-sm font-black text-slate-900">{stream.count}</span>
                    </div>
                    <div className="h-3 bg-slate-50 rounded-full overflow-hidden shadow-inner p-[1px]">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${(stream.count / maxStreamCount) * 100}%`, opacity: 1 - (idx * 0.12) }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;