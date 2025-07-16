export interface Platform {
  id: string
  name: string
  description: string
  price?: number
  isPaid: boolean
  tasks: Task[]
}

export interface Task {
  id: string
  title: string
  description: string
  link?: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  platformId: string
  submissions?: Submission[]
  _count?: {
    submissions: number
  }
}

export interface Submission {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  score?: number
  feedback?: string
  createdAt: string
}

export interface StudentStats {
  totalSubmissions: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  averageScore: number | null;
}

export interface WalletData {
  balance: number;
}

export interface Enrollment {
  id: string;
  createdAt: string;
  expiresAt?: string;
  isExpired?: boolean;
  daysRemaining?: number;
  status?: 'active' | 'expiring_soon' | 'expired';
  platform: {
    id: string;
    name: string;
    description: string;
    url: string;
    price: number | null;
    isPaid: boolean;
  };
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
}

export interface MentorshipData {
  mentor: {
    id: string;
    name: string;
    mentorBio: string;
    mentorRate: number;
  };
  pricing: {
    recordedSession: number;
    faceToFaceSession: number;
  };
  availableDates: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    isBooked: boolean;
    isRecurring: boolean;
    dayOfWeek?: number;
  }[];
  recordedSessions: {
    id: string;
    title: string;
    description: string;
    videoLink: string;
    price: number;
    isActive: boolean;
  }[];
  bookings: {
    id: string;
    duration: number;
    amount: number;
    status: string;
    sessionType: 'RECORDED' | 'FACE_TO_FACE';
    sessionDate: string | null;
    videoLink: string | null;
    meetingLink: string | null;
    whatsappNumber: string | null;
    studentNotes: string | null;
    adminNotes: string | null;
    createdAt: string;
    mentor: {
      name: string;
    };
  }[];
}