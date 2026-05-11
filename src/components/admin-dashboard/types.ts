export interface Student {
  id: string
  name: string
  email: string
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  averageScore: number | null
  createdAt: string
  stats?: {
    totalSubmissions: number
    approvedSubmissions: number
    pendingSubmissions: number
    rejectedSubmissions: number
    averageScore: number | null
  }
}

export interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  stats?: {
    totalSubmissions: number
    approvedSubmissions: number
    pendingSubmissions: number
    rejectedSubmissions: number
    averageScore: number | null
  }
}

export interface Platform {
  id: string
  name: string
  description: string
  url: string
  price?: number
  isPaid: boolean
  createdAt: string
}

export interface Task {
  id: string
  title: string
  description: string
  platformId: string
  link: string
  order: number
  platform: Platform
  createdAt: string
}

export interface FormData {
  name?: string
  email?: string
  password?: string
  phoneNumber?: string
  role?: string
  description?: string
  url?: string
  title?: string
  platformId?: string
  link?: string
  order?: number
}

export interface Submission {
  id: string
  taskId: string
  userId: string
  taskTitle: string
  userName: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  score: number | null
  feedback: string | null
  createdAt: string
  updatedAt: string
  content?: string
  summary?: string
  user?: {
    id: string
    name: string
    email: string
  }
  task?: {
    id: string
    title: string
    platform: {
      id: string
      name: string
    }
  }
}

export interface Transaction {
  id: string
  userId: string
  type: 'TOP_UP' | 'PLATFORM_PURCHASE' | 'MENTORSHIP_PAYMENT'
  amount: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  description?: string
  senderWalletNumber?: string
  adminWalletNumber?: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
    phoneNumber?: string
  }
}

export interface MentorshipBooking {
  id: string
  userId: string
  mentorId: string
  availableDateId: string | null
  duration: number
  amount: number
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  sessionType: 'RECORDED' | 'FACE_TO_FACE'
  sessionDate: string | null
  videoLink: string | null
  meetingLink: string | null
  whatsappNumber: string | null
  studentNotes: string | null
  adminNotes: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
  }
  mentor: {
    id: string
    name: string
    email: string
    mentorRate: number
  }
}

export interface Enrollment {
  id: string
  userId: string
  platformId: string
  createdAt: string
  expiresAt: string
  isExpired?: boolean
  daysRemaining?: number
  status?: 'active' | 'expired' | 'expiring_soon'
  platform: {
    id: string
    name: string
    description: string
    url: string
    price: number | null
    isPaid: boolean
  }
  user?: {
    id: string
    name: string
    email: string
  }
}

export interface AdminStats {
  totalUsers: number
  totalStudents: number
  totalSubmissions: number
  pendingSubmissions: number
  totalPlatforms?: number
  totalTransactions?: number
  pendingTransactions?: number
  totalRevenue?: number
  totalMentorshipBookings?: number
  platformStats: {
    platformId: string
    platformName: string
    totalTasks: number
    totalSubmissions: number
  }[]
}

export interface AvailableDate {
  id: string
  date: string
  startTime: string
  endTime: string
  isBooked: boolean
  isRecurring: boolean
  dayOfWeek?: number
  bookingId?: string
  booking?: {
    student: {
      name: string
      email: string
    }
  }
}

export interface RecordedSession {
  id: string
  title: string
  description: string | null
  videoLink: string
  price: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}
