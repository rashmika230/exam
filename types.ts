
export enum PlanType {
  FREE = 'FREE',
  PRO = 'PRO',
  PLUS = 'PLUS'
}

export enum SubjectStream {
  PHYSICAL_SCIENCE = 'Physical Science',
  BIOLOGICAL_SCIENCE = 'Biological Science',
  COMMERCE = 'Commerce',
  ARTS = 'Arts',
  ENGINEERING_TECH = 'Engineering Technology',
  BIO_SYSTEMS_TECH = 'Bio-Systems Technology'
}

export enum Medium {
  SINHALA = 'Sinhala',
  ENGLISH = 'English',
  TAMIL = 'Tamil'
}

export interface User {
  id: string;
  fullName: string;
  preferredName: string;
  whatsappNo: string;
  school: string;
  alYear: string;
  plan: PlanType;
  subjectStream: SubjectStream;
  email: string;
  password?: string;
  role: 'student' | 'admin';
  medium: Medium;
  questionsAnsweredThisMonth: number;
  papersAnsweredThisMonth: number;
  lastResetDate: string;
}

export interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface ExamPaper {
  id: string;
  subject: string;
  medium: Medium;
  questions: MCQQuestion[];
  createdAt: string;
}
