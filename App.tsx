
import React, { useState, useEffect, createContext, useContext } from 'react';
import { User, PlanType, Medium } from './types';
import LandingPage from './views/LandingPage';
import RegisterPage from './views/RegisterPage';
import LoginPage from './views/LoginPage';
import Dashboard from './views/Dashboard';
import ExamRoom from './views/ExamRoom';
import AdminPanel from './views/AdminPanel';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => boolean;
  register: (userData: Partial<User>) => void;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<'home' | 'login' | 'register' | 'dashboard' | 'exam' | 'admin'>('home');
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(PlanType.FREE);
  const [currentSubject, setCurrentSubject] = useState<string>('');
  const [currentTopic, setCurrentTopic] = useState<string | undefined>(undefined);
  const [currentExamType, setCurrentExamType] = useState<'quick' | 'topic' | 'past' | 'model'>('quick');
  const [isTimed, setIsTimed] = useState<boolean>(false);

  // LocalStorage Mock Persistence
  useEffect(() => {
    const savedUser = localStorage.getItem('lumina_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setCurrentPage('dashboard');
    }
  }, []);

  const login = (email: string, pass: string) => {
    const users: User[] = JSON.parse(localStorage.getItem('lumina_all_users') || '[]');
    const found = users.find(u => u.email === email && u.password === pass);
    if (found) {
      setUser(found);
      localStorage.setItem('lumina_user', JSON.stringify(found));
      setCurrentPage(found.role === 'admin' ? 'admin' : 'dashboard');
      return true;
    }
    // Hardcoded Admin fallback
    if (email === 'admin@luminaexam.lk' && pass === 'admin123') {
      const adminUser: User = {
        id: 'admin',
        fullName: 'System Administrator',
        preferredName: 'Admin',
        whatsappNo: '000',
        school: 'Lumina Exam HQ',
        alYear: '2024',
        plan: PlanType.PLUS,
        subjectStream: 'Physical Science' as any,
        email: 'admin@luminaexam.lk',
        role: 'admin',
        medium: Medium.ENGLISH,
        questionsAnsweredThisMonth: 0,
        papersAnsweredThisMonth: 0,
        lastResetDate: new Date().toISOString()
      };
      setUser(adminUser);
      setCurrentPage('admin');
      return true;
    }
    return false;
  };

  const register = (userData: Partial<User>) => {
    const newUser: User = {
      ...userData,
      id: Math.random().toString(36).substr(2, 9),
      role: 'student',
      medium: Medium.SINHALA,
      questionsAnsweredThisMonth: 0,
      papersAnsweredThisMonth: 0,
      lastResetDate: new Date().toISOString()
    } as User;
    
    const users: User[] = JSON.parse(localStorage.getItem('lumina_all_users') || '[]');
    users.push(newUser);
    localStorage.setItem('lumina_all_users', JSON.stringify(users));
    setCurrentPage('login');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('lumina_user');
    setCurrentPage('home');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('lumina_user', JSON.stringify(updatedUser));
    const allUsers: User[] = JSON.parse(localStorage.getItem('lumina_all_users') || '[]');
    const idx = allUsers.findIndex(u => u.id === updatedUser.id);
    if (idx > -1) {
      allUsers[idx] = updatedUser;
      localStorage.setItem('lumina_all_users', JSON.stringify(allUsers));
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

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
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
