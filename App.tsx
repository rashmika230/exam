
import React, { useState, useEffect, createContext, useContext } from 'react';
import { User, PlanType, Medium, SubjectStream } from './types.ts';
import LandingPage from './views/LandingPage.tsx';
import RegisterPage from './views/RegisterPage.tsx';
import LoginPage from './views/LoginPage.tsx';
import Dashboard from './views/Dashboard.tsx';
import ExamRoom from './views/ExamRoom.tsx';
import AdminPanel from './views/AdminPanel.tsx';
import { supabase } from './supabaseClient.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ error: string | null }>;
  register: (userData: any) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<'home' | 'login' | 'register' | 'dashboard' | 'exam' | 'admin'>('home');
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(PlanType.FREE);
  const [currentSubject, setCurrentSubject] = useState<string>('');
  const [currentTopic, setCurrentTopic] = useState<string | undefined>(undefined);
  const [currentExamType, setCurrentExamType] = useState<'quick' | 'topic' | 'past' | 'model'>('quick');
  const [isTimed, setIsTimed] = useState<boolean>(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetchAndMapProfile(session.user.id);
        }
      } catch (e) {
        console.error("Auth init error:", e);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await fetchAndMapProfile(session.user.id);
      } else {
        setUser(null);
        setCurrentPage('home');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAndMapProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (profile) {
        const mappedUser: User = {
          id: profile.id,
          fullName: profile.full_name,
          preferredName: profile.preferred_name,
          whatsappNo: profile.whatsapp_no,
          school: profile.school,
          alYear: profile.al_year,
          plan: profile.plan as PlanType,
          subjectStream: profile.subject_stream as SubjectStream,
          email: profile.email,
          role: profile.role as 'student' | 'admin',
          medium: profile.medium as Medium,
          questionsAnsweredThisMonth: profile.questions_answered_this_month,
          papersAnsweredThisMonth: profile.papers_answered_this_month,
          lastResetDate: profile.last_reset_date
        };

        setUser(mappedUser);
        
        // Only redirect to dashboard if we are currently on a non-auth page
        setCurrentPage(prev => {
          if (['home', 'login', 'register'].includes(prev)) {
            return mappedUser.role === 'admin' ? 'admin' : 'dashboard';
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const login = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  const register = async (userData: any) => {
    const { error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          fullName: userData.fullName,
          preferredName: userData.preferredName,
          whatsappNo: userData.whatsappNo,
          school: userData.school,
          alYear: userData.alYear,
          plan: userData.plan,
          subjectStream: userData.subjectStream,
          medium: userData.medium,
          role: 'student'
        }
      }
    });

    if (error) return { error: error.message };
    return { error: null };
  };

  const logout = async () => {
    try {
      // Optimistically clear UI state immediately for better UX
      setUser(null);
      setCurrentPage('home');
      // Attempt sign out from Supabase
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Logout error (Supabase):", e);
      // Ensure state is cleared even if network fails
      setUser(null);
      setCurrentPage('home');
    }
  };

  const updateUser = async (updatedUser: User) => {
    setUser(updatedUser);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: updatedUser.fullName,
        preferred_name: updatedUser.preferredName,
        whatsapp_no: updatedUser.whatsappNo,
        school: updatedUser.school,
        al_year: updatedUser.alYear,
        plan: updatedUser.plan,
        subject_stream: updatedUser.subjectStream,
        medium: updatedUser.medium,
        role: updatedUser.role,
        questions_answered_this_month: updatedUser.questionsAnsweredThisMonth,
        papers_answered_this_month: updatedUser.papersAnsweredThisMonth,
        last_reset_date: updatedUser.lastResetDate
      })
      .eq('id', updatedUser.id);

    if (error) {
      console.error("Error updating profile:", error);
    }
  };

  const navigateToRegister = (plan: PlanType) => {
    setSelectedPlan(plan);
    setCurrentPage('register');
  };

  const startExam = (subject: string, topic?: string, type: 'quick' | 'topic' | 'past' | 'model' = 'quick', timed: boolean = false) => {
    setCurrentSubject(subject);
    setCurrentTopic(topic);
    setCurrentExamType(type);
    setIsTimed(timed);
    setCurrentPage('exam');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
        <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Initializing Lumina Engine</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      <div className="min-h-screen bg-slate-50">
        {currentPage === 'home' && <LandingPage onNavigateToRegister={navigateToRegister} onLogin={() => setCurrentPage('login')} />}
        {currentPage === 'register' && <RegisterPage selectedPlan={selectedPlan} onLogin={() => setCurrentPage('login')} />}
        {currentPage === 'login' && <LoginPage onRegister={() => setCurrentPage('register')} />}
        {user && currentPage === 'dashboard' && <Dashboard startExam={startExam} onAdminClick={() => setCurrentPage('admin')} />}
        {user && currentPage === 'exam' && <ExamRoom subject={currentSubject} topic={currentTopic} type={currentExamType} isTimed={isTimed} onFinish={() => setCurrentPage('dashboard')} />}
        {user && currentPage === 'admin' && <AdminPanel onDashboard={() => setCurrentPage('dashboard')} />}
      </div>
    </AuthContext.Provider>
  );
};

export default App;
