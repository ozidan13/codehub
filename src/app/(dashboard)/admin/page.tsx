'use client'

import { useState, useEffect, useCallback, FC, FormEvent, JSX } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  XCircle, 
  LogOut, 
  User as UserIcon,
  BarChart3,
  FileText,
  Download,
  ChevronDown,
  Star,
  Award,
  Briefcase,
  Clipboard,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Wallet,
  CreditCard,
  Calendar,
  Settings,
  Edit,
  Trash2,
  Filter,
  Search,
  TrendingUp,
  DollarSign,
  Eye,
  AlertCircle
} from 'lucide-react'
import { CalendlyAdminCalendar } from '@/components/calendar'
import { formatDate, formatDateTime } from '@/lib/dateUtils';
import { ToastProvider, useToastHelpers } from '@/components/ui/Toast'

// --- INTERFACES ---
interface Student {
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

interface User {
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

interface Platform {
  id: string
  name: string
  description: string
  url: string
  price?: number
  isPaid: boolean
  createdAt: string
}

interface Task {
  id: string
  title: string
  description: string
  platformId: string
  link: string
  order: number
  platform: Platform
  createdAt: string
}

interface FormData {
  name?: string
  email?: string
  password?: string
  role?: string
  description?: string
  url?: string
  title?: string
  platformId?: string
  link?: string
  order?: number
}

interface Submission {
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

interface Transaction {
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

interface MentorshipBooking {
  id: string
  userId: string
  mentorId: string
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

interface Enrollment {
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

interface AdminStats {
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

// --- CACHE IMPLEMENTATION ---
class DataCache {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>()
  
  set(key: string, data: unknown, ttl: number = 5 * 60 * 1000) { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }
  
  get(key: string) {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }
  
  clear() {
    this.cache.clear()
  }
}

const dataCache = new DataCache()

// --- ADMIN PAGE WITH TOAST PROVIDER ---
function AdminPageContent() {
  const { success: toastSuccess, error: toastError } = useToastHelpers()
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'submissions' | 'platforms' | 'tasks' | 'users' | 'transactions' | 'mentorship' | 'dates'>('overview')
  
  // --- STATE MANAGEMENT ---
  const [overviewStats, setOverviewStats] = useState<AdminStats | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [mentorshipBookings, setMentorshipBookings] = useState<MentorshipBooking[]>([])

  const [isPageLoading, setIsPageLoading] = useState(true)
  const [isContentLoading, setIsContentLoading] = useState(false)

  // Modals and selected entities
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState<Platform | Task | User | null>(null)
  const [entityType, setEntityType] = useState<'platform' | 'task' | 'user'>('platform')
  
  // Confirmation dialog states
  const [showTransactionConfirm, setShowTransactionConfirm] = useState(false)
  const [showBookingConfirm, setShowBookingConfirm] = useState(false)
  const [showTimeSlotConfirm, setShowTimeSlotConfirm] = useState(false)
  const [pendingAction, setPendingAction] = useState<{
    type: 'transaction' | 'booking' | 'timeSlot';
    id: string;
    action: string;
    details?: string;
  } | null>(null)
  const [formData, setFormData] = useState<FormData>({})

  const [pagination, setPagination] = useState<Record<string, { page: number; limit: number; total: number; totalPages: number }>>({
    submissions: { page: 1, limit: 10, total: 0, totalPages: 1 },
    transactions: { page: 1, limit: 10, total: 0, totalPages: 1 },
    mentorship: { page: 1, limit: 10, total: 0, totalPages: 1 },
  });

  // --- DATA FETCHING WITH RETRY MECHANISM ---
  const fetchWithRetry = async (url: string, options: RequestInit = {}, maxRetries: number = 3): Promise<Response> => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) {
          return response;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        lastError = error as Error;
        if (attempt === maxRetries) {
          throw lastError;
        }
        // Exponential backoff: wait 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      }
    }
    throw lastError!;
  };

  const fetchAdminData = useCallback(async (tab: string, page: number = 1, useCache: boolean = true) => {
    if (status !== 'authenticated') return;
    setIsContentLoading(true);
    try {
      const cacheKey = `admin-${tab}-${page}`;
      const cachedData = useCache ? dataCache.get(cacheKey) : null;

      if (cachedData) {
        if (tab === 'overview') setOverviewStats(cachedData as AdminStats);
        else if (tab === 'students') setStudents(cachedData as Student[]);
        else if (tab === 'submissions') {
          const data = cachedData as any;
          setSubmissions(data.submissions || []);
          setPagination(prev => ({ ...prev, submissions: data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 } }));
        }
        else if (tab === 'transactions') {
          const data = cachedData as any;
          setTransactions(data.transactions || []);
          setPagination(prev => ({ ...prev, transactions: data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 } }));
        }
        else if (tab === 'mentorship') {
          const data = cachedData as any;
          setMentorshipBookings(data.bookings || []);
          setPagination(prev => ({ ...prev, mentorship: data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 } }));
        }
        else if (tab === 'platforms') setPlatforms(cachedData as Platform[]);
        else if (tab === 'tasks') setTasks(cachedData as Task[]);
        else if (tab === 'users') setUsers(cachedData as User[]);
        setIsContentLoading(false);
        return;
      }

      let response;
      switch (tab) {
        case 'overview':
          response = await fetchWithRetry('/api/admin/stats');
          const overviewData = await response.json();
          setOverviewStats(overviewData);
          dataCache.set(cacheKey, overviewData, 2 * 60 * 1000); // 2 minutes cache
          break;
        case 'students':
          response = await fetchWithRetry('/api/users?role=STUDENT&includeProgress=true');
          const studentsData = await response.json();
          const formattedStudents = studentsData.users.map((user: User) => ({
            id: user.id,
            name: user.name || 'Unknown',
            email: user.email,
            totalTasks: user.stats?.totalSubmissions || 0,
            completedTasks: user.stats?.approvedSubmissions || 0,
            pendingTasks: user.stats?.pendingSubmissions || 0,
            averageScore: user.stats?.averageScore,
            createdAt: user.createdAt,
            stats: user.stats ? { ...user.stats } : undefined
          }));
          setStudents(formattedStudents);
          dataCache.set(cacheKey, formattedStudents, 5 * 60 * 1000); // 5 minutes cache
          break;
        case 'submissions':
          const limit = 10;
          response = await fetchWithRetry(`/api/submissions?page=${page}&limit=${limit}`);
          const submissionsData = await response.json();
          setSubmissions(submissionsData.submissions || []);
          setPagination(prev => ({ ...prev, submissions: submissionsData.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 } }));
          dataCache.set(cacheKey, submissionsData, 3 * 60 * 1000); // 3 minutes cache
          break;
        case 'platforms':
          response = await fetchWithRetry('/api/platforms');
          const platformsData = await response.json();
          setPlatforms(platformsData.platforms || []);
          dataCache.set(cacheKey, platformsData.platforms || [], 10 * 60 * 1000); // 10 minutes cache
          break;
        case 'tasks':
          response = await fetchWithRetry('/api/tasks');
          const tasksData = await response.json();
          setTasks(tasksData.tasks || []);
          dataCache.set(cacheKey, tasksData.tasks || [], 10 * 60 * 1000); // 10 minutes cache
          break;
        case 'users':
          response = await fetchWithRetry('/api/users?includeProgress=false');
          const usersData = await response.json();
          setUsers(usersData.users || []);
          dataCache.set(cacheKey, usersData.users || [], 5 * 60 * 1000); // 5 minutes cache
          break;
        case 'transactions':
          const transactionLimit = 10;
          response = await fetchWithRetry(`/api/admin/transactions?page=${page}&limit=${transactionLimit}`);
          const transactionsData = await response.json();
          setTransactions(transactionsData.transactions || []);
          setPagination(prev => ({ ...prev, transactions: transactionsData.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 } }));
          dataCache.set(cacheKey, transactionsData, 2 * 60 * 1000); // 2 minutes cache
          break;
        case 'mentorship':
          const mentorshipLimit = 10;
          response = await fetchWithRetry(`/api/admin/mentorship?page=${page}&limit=${mentorshipLimit}`);
          const mentorshipData = await response.json();
          setMentorshipBookings(mentorshipData.bookings || []);
          setPagination(prev => ({ ...prev, mentorship: mentorshipData.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 } }));
          dataCache.set(cacheKey, mentorshipData, 2 * 60 * 1000); // 2 minutes cache
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${tab} data:`, error);
      // Show user-friendly error message
      toastError(`فشل في تحميل بيانات ${tab === 'overview' ? 'الإحصائيات' : 
                                    tab === 'students' ? 'الطلاب' :
                                    tab === 'submissions' ? 'المشاريع' :
                                    tab === 'platforms' ? 'المنصات' :
                                    tab === 'tasks' ? 'المهام' :
                                    tab === 'users' ? 'المستخدمين' :
                                    tab === 'transactions' ? 'المعاملات' :
                                    tab === 'mentorship' ? 'الإرشاد' : 'البيانات'}. يرجى المحاولة مرة أخرى.`);
    } finally {
      setIsContentLoading(false);
    }
  }, [status, toastError]);

  // --- EFFECTS ---
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (session?.user?.role !== 'ADMIN') {
      router.push('/student');
      return;
    }
    setIsPageLoading(false);
  }, [session, status, router]);

  useEffect(() => {
    if (!isPageLoading) {
        const currentPage = activeTab === 'submissions' ? pagination.submissions.page :
                           activeTab === 'transactions' ? pagination.transactions.page :
                           activeTab === 'mentorship' ? pagination.mentorship.page : 1;
        fetchAdminData(activeTab, currentPage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPageLoading, activeTab, pagination.submissions.page, pagination.transactions.page, pagination.mentorship.page]);

  // --- HANDLERS ---
  // Selective cache invalidation for better performance
  const invalidateCache = (keys: string[]) => {
    keys.forEach(key => {
      // Remove all cache entries that start with the key
      Array.from(dataCache['cache'].keys()).forEach(cacheKey => {
        if (cacheKey.startsWith(key)) {
          dataCache['cache'].delete(cacheKey);
        }
      });
    });
  };

  const refreshData = (tab: string) => {
    const page = tab === 'submissions' ? pagination.submissions.page :
                 tab === 'transactions' ? pagination.transactions.page :
                 tab === 'mentorship' ? pagination.mentorship.page : 1;
    
    // Selective cache invalidation instead of clearing all
    invalidateCache([`admin-${tab}`]);
    fetchAdminData(tab, page);
  }

  // Optimized refresh functions for specific data types
  const refreshTransactions = () => {
    invalidateCache(['admin-transactions']);
    fetchAdminData('transactions', pagination.transactions.page);
  };

  const refreshMentorshipBookings = () => {
    invalidateCache(['admin-mentorship']);
    fetchAdminData('mentorship', pagination.mentorship.page);
  };

  const refreshOverview = () => {
    invalidateCache(['admin-overview']);
    fetchAdminData('overview');
  };

  const handleTabChange = (tab: 'overview' | 'students' | 'submissions' | 'platforms' | 'tasks' | 'users' | 'transactions' | 'mentorship' | 'dates') => {
    setActiveTab(tab);
  };

  const handlePageChange = (newPage: number, tabType: string = 'submissions') => {
    const currentPagination = pagination[tabType as keyof typeof pagination];
    if (newPage > 0 && newPage <= currentPagination.totalPages) {
      setPagination(prev => ({ ...prev, [tabType]: { ...prev[tabType as keyof typeof prev], page: newPage } }));
    }
  };

  const handleReviewSubmission = (submission: Submission) => {
    setSelectedSubmission(submission)
    setShowReviewModal(true)
  }

  const handleCreate = (type: 'platform' | 'task' | 'user') => {
    setEntityType(type)
    setFormData({})
    setShowCreateModal(true)
  }

  const handleEdit = (entity: Platform | Task | User, type: 'platform' | 'task' | 'user') => {
    setSelectedEntity(entity)
    setEntityType(type)
    setFormData(entity)
    setShowEditModal(true)
  }

  const handleDelete = (entity: Platform | Task | User, type: 'platform' | 'task' | 'user') => {
    setSelectedEntity(entity)
    setEntityType(type)
    setShowDeleteModal(true)
  }

  // Confirmation handlers
  const handleTransactionStatusConfirm = (transactionId: string, status: 'APPROVED' | 'REJECTED', details?: string) => {
    setPendingAction({
      type: 'transaction',
      id: transactionId,
      action: status,
      details
    })
    setShowTransactionConfirm(true)
  }

  const handleBookingStatusConfirm = (bookingId: string, status: 'CONFIRMED' | 'CANCELLED', details?: string) => {
    setPendingAction({
      type: 'booking',
      id: bookingId,
      action: status,
      details
    })
    setShowBookingConfirm(true)
  }

  const handleTimeSlotDeleteConfirm = (dateId: string, details?: string) => {
    setPendingAction({
      type: 'timeSlot',
      id: dateId,
      action: 'DELETE',
      details
    })
    setShowTimeSlotConfirm(true)
  }

  const executeConfirmedAction = async () => {
    if (!pendingAction) return

    try {
      if (pendingAction.type === 'transaction') {
        // Execute transaction status update
        const response = await fetch('/api/admin/transactions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            transactionId: pendingAction.id, 
            status: pendingAction.action 
          }),
        })
        if (response.ok) {
          refreshTransactions()
          toastSuccess(`تم ${pendingAction.action === 'APPROVED' ? 'قبول' : 'رفض'} المعاملة بنجاح`)
        } else {
          const error = await response.json()
          toastError(`فشل في تحديث المعاملة: ${error.error}`)
        }
      } else if (pendingAction.type === 'booking') {
        // Execute booking status update
        const response = await fetch('/api/admin/mentorship', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            bookingId: pendingAction.id, 
            status: pendingAction.action 
          }),
        })
        if (response.ok) {
          refreshMentorshipBookings()
          toastSuccess(`تم ${pendingAction.action === 'CONFIRMED' ? 'تأكيد' : 'إلغاء'} الحجز بنجاح`)
        } else {
          const error = await response.json()
          toastError(`فشل في تحديث الحجز: ${error.error}`)
        }
      } else if (pendingAction.type === 'timeSlot') {
        // Execute time slot deletion
        const response = await fetch(`/api/admin/available-dates?id=${pendingAction.id}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          toastSuccess('تم حذف الموعد بنجاح')
        } else {
          const error = await response.json()
          toastError(`فشل في حذف الموعد: ${error.error}`)
        }
      }
    } catch (error) {
      console.error('Error executing confirmed action:', error)
      toastError('حدث خطأ أثناء تنفيذ العملية')
    } finally {
      // Close all confirmation modals
      setShowTransactionConfirm(false)
      setShowBookingConfirm(false)
      setShowTimeSlotConfirm(false)
      setPendingAction(null)
    }
  }

  const submitForm = async (method: 'POST' | 'PUT' | 'DELETE') => {
    // Optimistic updates - update UI immediately
    const optimisticUpdate = () => {
      if (method === 'POST') {
        const tempId = `temp-${Date.now()}`;
        const newEntity = { ...formData, id: tempId };
        if (entityType === 'platforms') {
          setPlatforms(prev => [...prev, newEntity as Platform]);
        } else if (entityType === 'tasks') {
          setTasks(prev => [...prev, newEntity as Task]);
        } else if (entityType === 'users') {
          setUsers(prev => [...prev, newEntity as User]);
        }
      } else if (method === 'PUT' && selectedEntity) {
        const updatedEntity = { ...selectedEntity, ...formData };
        if (entityType === 'platforms') {
          setPlatforms(prev => prev.map(p => p.id === selectedEntity.id ? updatedEntity as Platform : p));
        } else if (entityType === 'tasks') {
          setTasks(prev => prev.map(t => t.id === selectedEntity.id ? updatedEntity as Task : t));
        } else if (entityType === 'users') {
          setUsers(prev => prev.map(u => u.id === selectedEntity.id ? updatedEntity as User : u));
        }
      } else if (method === 'DELETE' && selectedEntity) {
        if (entityType === 'platforms') {
          setPlatforms(prev => prev.filter(p => p.id !== selectedEntity.id));
        } else if (entityType === 'tasks') {
          setTasks(prev => prev.filter(t => t.id !== selectedEntity.id));
        } else if (entityType === 'users') {
          setUsers(prev => prev.filter(u => u.id !== selectedEntity.id));
        }
      }
    };

    // Rollback function in case of error
    const rollbackUpdate = () => {
      // Invalidate cache and refetch data to restore correct state
      invalidateCache([`admin-${entityType === 'platform' ? 'platforms' : entityType === 'task' ? 'tasks' : 'users'}`]);
      fetchAdminData(entityType === 'platform' ? 'platforms' : entityType === 'task' ? 'tasks' : 'users', 1, false);
    };

    try {
      // Apply optimistic update
      optimisticUpdate();
      
      // Close modals immediately for better UX
      setShowCreateModal(false);
      setShowEditModal(false);
      setShowDeleteModal(false);
      
      let endpoint = '';
      let body = method !== 'DELETE' ? JSON.stringify(formData) : undefined;
      
      // Fix API endpoints to match backend structure
      switch (entityType) {
        case 'platform': 
          if (method === 'POST') {
            endpoint = '/api/platforms'
          } else {
            endpoint = `/api/platforms/${selectedEntity?.id}`
          }
          break
        case 'task': 
          if (method === 'POST') {
            endpoint = '/api/tasks'
          } else {
            endpoint = `/api/tasks/${selectedEntity?.id}`
          }
          break
        case 'user': 
          if (method === 'POST') {
            endpoint = '/api/users'
          } else if (method === 'PUT') {
            // For user updates, include ID in body as required by backend
            const updatedFormData = { ...formData, id: selectedEntity?.id }
            body = JSON.stringify(updatedFormData)
            endpoint = '/api/users'
          } else if (method === 'DELETE') {
            // For user deletion, include ID in body as required by backend
            body = JSON.stringify({ id: selectedEntity?.id })
            endpoint = '/api/users'
          }
          break
      }
      
      const response = await fetchWithRetry(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body
      });
      
      // Success - invalidate cache and show success message
      invalidateCache([`admin-${entityType === 'platform' ? 'platforms' : entityType === 'task' ? 'tasks' : 'users'}`]);
      toastSuccess(`تم ${method === 'POST' ? 'إنشاء' : method === 'PUT' ? 'تحديث' : 'حذف'} العنصر بنجاح`);
      
    } catch (error) {
      console.error(`${method} error:`, error);
      // Rollback optimistic update on error
      rollbackUpdate();
      toastError(`فشل في ${method === 'POST' ? 'إنشاء' : method === 'PUT' ? 'تحديث' : 'حذف'} العنصر. يرجى المحاولة مرة أخرى.`);
    }
  }

  // --- RENDER LOGIC ---
  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-32 w-32 mb-4 mx-auto"></div>
          <h2 className="text-2xl font-semibold text-gray-700">جاري التحميل...</h2>
          <p className="text-gray-500">يتم التحقق من صلاحيات الدخول.</p>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    if (isContentLoading) {
      return (
        <div className="flex items-center justify-center h-96">
            <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12"></div>
        </div>
      )
    }

    switch (activeTab) {
      case 'overview': return <OverviewTab stats={overviewStats} />
      case 'students': return <StudentsTab students={students} onRefresh={() => refreshData('students')} />
      case 'submissions': return <SubmissionsTab 
                                submissions={submissions} 
                                pagination={pagination.submissions} 
                                onPageChange={(page) => handlePageChange(page, 'submissions')} 
                                onReview={handleReviewSubmission} 
                              />
      case 'transactions': return <TransactionsTab 
                                transactions={transactions} 
                                pagination={pagination.transactions} 
                                onPageChange={(page) => handlePageChange(page, 'transactions')} 
                                onRefresh={() => refreshData('transactions')} 
                                onTransactionStatusConfirm={handleTransactionStatusConfirm}
                              />
      case 'mentorship': return <MentorshipTab 
                                bookings={mentorshipBookings} 
                                pagination={pagination.mentorship} 
                                onPageChange={(page) => handlePageChange(page, 'mentorship')} 
                                onRefresh={() => refreshData('mentorship')} 
                                onBookingStatusConfirm={handleBookingStatusConfirm}
                                toastSuccess={toastSuccess}
                                toastError={toastError}
                              />
      case 'dates': return <DatesTab onTimeSlotDeleteConfirm={handleTimeSlotDeleteConfirm} />
      case 'platforms': return <PlatformsTab platforms={platforms} onEdit={handleEdit} onDelete={handleDelete} onCreate={() => handleCreate('platform')} />
      case 'tasks': return <TasksTab tasks={tasks} onEdit={handleEdit} onDelete={handleDelete} onCreate={() => handleCreate('task')} />
      case 'users': return <UsersTab users={users} onEdit={handleEdit} onDelete={handleDelete} onCreate={() => handleCreate('user')} />
      default: return <div className="text-center p-8">الرجاء اختيار تبويب لعرض البيانات</div>;
    }
  }

  return (
    <div dir="rtl" className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-2xl font-bold">لوحة التحكم</h1>
        </div>
        <nav className="flex-1 p-2 space-y-2">
          <TabButton icon={<BarChart3 />} label="نظرة عامة" active={activeTab === 'overview'} onClick={() => handleTabChange('overview')} />
          <TabButton icon={<Users />} label="الطلاب" active={activeTab === 'students'} onClick={() => handleTabChange('students')} />
          <TabButton icon={<FileText />} label="التقديمات" active={activeTab === 'submissions'} onClick={() => handleTabChange('submissions')} />
          <TabButton icon={<Wallet />} label="المعاملات المالية" active={activeTab === 'transactions'} onClick={() => handleTabChange('transactions')} />
          <TabButton icon={<Calendar />} label="جلسات الإرشاد" active={activeTab === 'mentorship'} onClick={() => handleTabChange('mentorship')} />
          <TabButton icon={<Clock />} label="إدارة المواعيد" active={activeTab === 'dates'} onClick={() => handleTabChange('dates')} />
          <TabButton icon={<Briefcase />} label="المنصات" active={activeTab === 'platforms'} onClick={() => handleTabChange('platforms')} />
          <TabButton icon={<Clipboard />} label="المهام" active={activeTab === 'tasks'} onClick={() => handleTabChange('tasks')} />
          <TabButton icon={<UserIcon />} label="المستخدمون" active={activeTab === 'users'} onClick={() => handleTabChange('users')} />
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            <LogOut className="ml-2 h-5 w-5" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-md p-6 min-h-full">
          {renderContent()}
        </div>
      </main>

      {/* Modals */}
      {showReviewModal && selectedSubmission && (
        <ReviewModal 
          submission={selectedSubmission} 
          onClose={() => setShowReviewModal(false)} 
          onUpdate={() => {
            setShowReviewModal(false);
            refreshData('submissions');
          }}
          toastSuccess={toastSuccess}
          toastError={toastError}
        />
      )}
      {showCreateModal && (
        <CrudModal
          mode="create"
          entityType={entityType}
          formData={formData}
          setFormData={setFormData}
          platforms={platforms}
          onClose={() => setShowCreateModal(false)}
          onSubmit={() => submitForm('POST')}
        />
      )}
      {showEditModal && selectedEntity && (
        <CrudModal
          mode="edit"
          entityType={entityType}
          entityData={selectedEntity}
          formData={formData}
          setFormData={setFormData}
          platforms={platforms}
          onClose={() => setShowEditModal(false)}
          onSubmit={() => submitForm('PUT')}
        />
      )}
       {showDeleteModal && selectedEntity && (
        <DeleteConfirmationModal
          entityType={entityType}
          entityName={(selectedEntity as any)?.name || (selectedEntity as any)?.title || ''}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => submitForm('DELETE')}
        />
      )}

      {/* Action Confirmation Modals */}
      {(showTransactionConfirm || showBookingConfirm || showTimeSlotConfirm) && pendingAction && (
        <ActionConfirmationModal
          actionType={pendingAction.type}
          action={pendingAction.action}
          details={pendingAction.details}
          onClose={() => {
            setShowTransactionConfirm(false)
            setShowBookingConfirm(false)
            setShowTimeSlotConfirm(false)
            setPendingAction(null)
          }}
          onConfirm={executeConfirmedAction}
        />
      )}
    </div>
  )
}

// --- CHILD COMPONENTS ---

const TabButton: FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden ${active ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-xl border-2 border-blue-300' : 'text-gray-300 hover:text-blue-400 hover:bg-gradient-to-r hover:from-gray-700 hover:to-gray-600 border-2 border-transparent hover:border-blue-400'}`}>
    {active && (
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-20 animate-pulse"></div>
    )}
    <div className="relative flex items-center">
      {icon}
      <span className="mr-3">{label}</span>
    </div>
  </button>
);

const PageHeader: FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => (
    <div className="flex justify-between items-center mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
        <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center ml-4">
                <Settings className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent capitalize">{title}</h2>
        </div>
        <div className="flex items-center space-x-4 space-x-reverse">{children}</div>
    </div>
);

const OverviewTab: FC<{ stats: AdminStats | null }> = ({ stats }) => {
  if (!stats) return <div>لا توجد بيانات لعرضها.</div>;
  return (
    <>
      <PageHeader title="نظرة عامة" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Users />} title="إجمالي المستخدمين" value={stats.totalUsers} />
        <StatCard icon={<UserIcon />} title="إجمالي الطلاب" value={stats.totalStudents} />
        <StatCard icon={<FileText />} title="إجمالي التقديمات" value={stats.totalSubmissions} />
        <StatCard icon={<Clock />} title="التقديمات المعلقة" value={stats.pendingSubmissions} color="text-yellow-500" />
      </div>
    </>
  );
}

// --- MAIN EXPORT WITH TOAST PROVIDER ---
export default function AdminPage() {
  return (
    <ToastProvider>
      <AdminPageContent />
    </ToastProvider>
  )
};

// --- TRANSACTIONS TAB ---
interface TransactionsTabProps {
  transactions: Transaction[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onTransactionStatusConfirm: (transactionId: string, status: 'APPROVED' | 'REJECTED', details?: string) => void;
}

const TransactionsTab: FC<TransactionsTabProps> = ({ transactions, pagination, onPageChange, onRefresh, onTransactionStatusConfirm }) => {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filteredTransactions, setFilteredTransactions] = useState(transactions);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  // Fetch all transactions for statistics and filtering
  useEffect(() => {
    const fetchAllTransactions = async () => {
      try {
        const response = await fetch('/api/admin/transactions?limit=1000'); // Get more transactions for stats
        if (response.ok) {
          const data = await response.json();
          setAllTransactions(data.transactions || []);
        }
      } catch (error) {
        console.error('Error fetching all transactions:', error);
      }
    };
    fetchAllTransactions();
  }, []);

  // Filter transactions based on current filters (using all transactions for filtering)
  useEffect(() => {
    let filtered = allTransactions.length > 0 ? allTransactions : transactions;

    if (filters.status) {
      filtered = filtered.filter(t => t.status === filters.status);
    }
    if (filters.type) {
      filtered = filtered.filter(t => t.type === filters.type);
    }
    if (filters.search) {
      filtered = filtered.filter(t => 
        t.user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        t.user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        (t.user.phoneNumber && t.user.phoneNumber.includes(filters.search)) ||
        (t.adminWalletNumber && t.adminWalletNumber.includes(filters.search))
      );
    }
    if (filters.dateFrom) {
      filtered = filtered.filter(t => new Date(t.createdAt) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(t => new Date(t.createdAt) <= new Date(filters.dateTo));
    }
    if (filters.minAmount) {
      filtered = filtered.filter(t => Number(t.amount) >= Number(filters.minAmount));
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(t => Number(t.amount) <= Number(filters.maxAmount));
    }

    setFilteredTransactions(filtered);
  }, [transactions, allTransactions, filters]);

  const clearFilters = () => {
    setFilters({
      status: '',
      type: '',
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: '',
      search: ''
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      PENDING: { label: 'في الانتظار', class: 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300', icon: '⏳' },
      APPROVED: { label: 'موافق عليه', class: 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300', icon: '✅' },
      REJECTED: { label: 'مرفوض', class: 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300', icon: '❌' }
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, class: 'bg-gray-100 text-gray-800', icon: '❓' };
    return (
      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${statusInfo.class} shadow-sm`}>
        <span>{statusInfo.icon}</span>
        {statusInfo.label}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeMap = {
      TOP_UP: { label: 'شحن رصيد', class: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300', icon: '💰' },
      PLATFORM_PURCHASE: { label: 'شراء منصة', class: 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300', icon: '🛒' },
      MENTORSHIP_PAYMENT: { label: 'دفع إرشاد', class: 'bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800 border border-indigo-300', icon: '🎓' }
    };
    const typeInfo = typeMap[type as keyof typeof typeMap] || { label: type, class: 'bg-gray-100 text-gray-800', icon: '❓' };
    return (
      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${typeInfo.class} shadow-sm`}>
        <span>{typeInfo.icon}</span>
        {typeInfo.label}
      </span>
    );
  };

  // Calculate statistics (using all transactions, not filtered ones)
  const allTransactionsForStats = allTransactions.length > 0 ? allTransactions : transactions;
  const stats = {
    total: allTransactionsForStats.length,
    pending: allTransactionsForStats.filter(t => t.status === 'PENDING').length,
    approved: allTransactionsForStats.filter(t => t.status === 'APPROVED').length,
    rejected: allTransactionsForStats.filter(t => t.status === 'REJECTED').length,
    totalAmount: allTransactionsForStats.reduce((sum, t) => sum + Number(t.amount), 0),
    approvedAmount: allTransactionsForStats.filter(t => t.status === 'APPROVED').reduce((sum, t) => sum + Number(t.amount), 0)
  };
  


  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">إدارة المعاملات المالية</h2>
              <p className="text-gray-600">مراجعة وإدارة جميع المعاملات المالية مع فلاتر متقدمة</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 space-x-reverse">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                showFilters 
                  ? 'bg-blue-500 text-white shadow-lg' 
                  : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>الفلاتر</span>
            </button>
            <button
              onClick={onRefresh}
              className="flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <RefreshCw className="h-4 w-4" />
              <span>تحديث</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي المعاملات</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">في الانتظار</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">مقبولة</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">مرفوضة</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي المبلغ</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalAmount.toFixed(2)} ج</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">المبلغ المقبول</p>
                <p className="text-xl font-bold text-green-600">{stats.approvedAmount.toFixed(2)} ج</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-600" />
              فلاتر البحث المتقدمة
            </h3>
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              مسح الفلاتر
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">البحث</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="اسم المستخدم، البريد، رقم الهاتف..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">جميع الحالات</option>
                <option value="PENDING">في الانتظار</option>
                <option value="APPROVED">مقبول</option>
                <option value="REJECTED">مرفوض</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع المعاملة</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">جميع الأنواع</option>
                <option value="TOP_UP">شحن رصيد</option>
                <option value="PLATFORM_PURCHASE">شراء منصة</option>
                <option value="MENTORSHIP_PAYMENT">دفع إرشاد</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">من تاريخ</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Min Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">أقل مبلغ</label>
              <input
                type="number"
                placeholder="0"
                value={filters.minAmount}
                onChange={(e) => setFilters({...filters, minAmount: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Max Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">أعلى مبلغ</label>
              <input
                type="number"
                placeholder="∞"
                value={filters.maxAmount}
                onChange={(e) => setFilters({...filters, maxAmount: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">المستخدم</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">النوع</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">المبلغ</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">رقم الهاتف</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">محفظة الإدارة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredTransactions.map((transaction, index) => (
                <tr key={transaction.id} className={`hover:bg-blue-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                          <span className="text-sm font-bold text-white">
                            {transaction.user.name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="mr-4">
                        <div className="text-sm font-semibold text-gray-900">{transaction.user.name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <span>📧</span>
                          {transaction.user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">{getTypeBadge(transaction.type)}</td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-bold text-gray-900">{Number(transaction.amount).toFixed(2)}</span>
                      <span className="text-xs text-gray-500">جنيه</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span>📱</span>
                      <span className="text-sm text-gray-900 font-medium">{transaction.user.phoneNumber || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span>💳</span>
                      <span className="text-sm text-gray-900 font-medium">{transaction.adminWalletNumber || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">{getStatusBadge(transaction.status)}</td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span>📅</span>
                      <span className="text-sm text-gray-600">
                        {new Date(transaction.createdAt).toLocaleDateString('en-US')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    {transaction.status === 'PENDING' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onTransactionStatusConfirm(
                            transaction.id, 
                            'APPROVED',
                            `المبلغ: ${Number(transaction.amount).toFixed(2)} جنيه - المستخدم: ${transaction.user.name}`
                          )}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors duration-200 shadow-sm"
                        >
                          ✓ قبول
                        </button>
                        <button
                          onClick={() => onTransactionStatusConfirm(
                            transaction.id, 
                            'REJECTED',
                            `المبلغ: ${Number(transaction.amount).toFixed(2)} جنيه - المستخدم: ${transaction.user.name}`
                          )}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 shadow-sm"
                        >
                          ✗ رفض
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setShowTransactionModal(true);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                      >
                        <Eye className="w-3 h-3" />
                        عرض
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <Search className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="text-center">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد معاملات</h3>
                        <p className="text-gray-500">لم يتم العثور على معاملات تطابق معايير البحث المحددة</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Results Summary */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 flex items-center justify-center border-t border-gray-200">
          <div className="text-sm text-gray-700 font-medium">
            عرض <span className="font-bold text-blue-600">{filteredTransactions.length}</span> من إجمالي{' '}
            <span className="font-bold text-green-600">{allTransactionsForStats.length}</span> معاملة
          </div>
        </div>
      </div>
      
      {/* Transaction Details Modal */}
      {showTransactionModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">تفاصيل المعاملة</h3>
                <button
                  onClick={() => {
                    setShowTransactionModal(false);
                    setSelectedTransaction(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Transaction Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium text-gray-600">حالة المعاملة</span>
                {getStatusBadge(selectedTransaction.status)}
              </div>
              
              {/* Transaction Type */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium text-gray-600">نوع المعاملة</span>
                {getTypeBadge(selectedTransaction.type)}
              </div>
              
              {/* Amount */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <span className="text-sm font-medium text-gray-600">المبلغ</span>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-lg font-bold text-green-700">
                    {Number(selectedTransaction.amount).toFixed(2)} جنيه
                  </span>
                </div>
              </div>
              
              {/* User Information */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">معلومات المستخدم</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <span className="text-xs text-blue-600 font-medium">الاسم</span>
                    <p className="text-sm font-semibold text-gray-900">{selectedTransaction.user.name}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <span className="text-xs text-blue-600 font-medium">البريد الإلكتروني</span>
                    <p className="text-sm font-semibold text-gray-900">{selectedTransaction.user.email}</p>
                  </div>
                  {selectedTransaction.user.phoneNumber && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <span className="text-xs text-blue-600 font-medium">رقم الهاتف</span>
                      <p className="text-sm font-semibold text-gray-900">{selectedTransaction.user.phoneNumber}</p>
                    </div>
                  )}
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <span className="text-xs text-blue-600 font-medium">معرف المستخدم</span>
                    <p className="text-sm font-semibold text-gray-900 font-mono">{selectedTransaction.userId}</p>
                  </div>
                </div>
              </div>
              
              {/* Transaction Details */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">تفاصيل المعاملة</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-xs text-gray-600 font-medium">معرف المعاملة</span>
                    <p className="text-sm font-semibold text-gray-900 font-mono">{selectedTransaction.id}</p>
                  </div>
                  {selectedTransaction.adminWalletNumber && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-xs text-gray-600 font-medium">رقم محفظة الإدارة</span>
                      <p className="text-sm font-semibold text-gray-900">{selectedTransaction.adminWalletNumber}</p>
                    </div>
                  )}
                  {selectedTransaction.senderWalletNumber && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-xs text-gray-600 font-medium">رقم محفظة المرسل</span>
                      <p className="text-sm font-semibold text-gray-900">{selectedTransaction.senderWalletNumber}</p>
                    </div>
                  )}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-xs text-gray-600 font-medium">تاريخ الإنشاء</span>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(selectedTransaction.createdAt).toLocaleDateString('en-US')} - 
                      {new Date(selectedTransaction.createdAt).toLocaleTimeString('ar-SA')}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-xs text-gray-600 font-medium">تاريخ التحديث</span>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(selectedTransaction.updatedAt).toLocaleDateString('en-US')} - 
                      {new Date(selectedTransaction.updatedAt).toLocaleTimeString('ar-SA')}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Description */}
              {selectedTransaction.description && (
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">الوصف</h4>
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-gray-700">{selectedTransaction.description}</p>
                  </div>
                </div>
              )}
              
              {/* Action Buttons for Pending Transactions */}
              {selectedTransaction.status === 'PENDING' && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      onTransactionStatusConfirm(
                        selectedTransaction.id, 
                        'APPROVED',
                        `المبلغ: ${Number(selectedTransaction.amount).toFixed(2)} جنيه - المستخدم: ${selectedTransaction.user.name}`
                      );
                      setShowTransactionModal(false);
                      setSelectedTransaction(null);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors duration-200 shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    قبول المعاملة
                  </button>
                  <button
                    onClick={() => {
                      onTransactionStatusConfirm(
                        selectedTransaction.id, 
                        'REJECTED',
                        `المبلغ: ${Number(selectedTransaction.amount).toFixed(2)} جنيه - المستخدم: ${selectedTransaction.user.name}`
                      );
                      setShowTransactionModal(false);
                      setSelectedTransaction(null);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 shadow-sm"
                  >
                    <XCircle className="w-4 h-4" />
                    رفض المعاملة
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Booking Update Modal Component
interface BookingUpdateModalProps {
  booking: MentorshipBooking;
  onClose: () => void;
  onUpdate: () => void;
  toastSuccess: (message: string) => void;
  toastError: (message: string) => void;
}

const BookingUpdateModal: FC<BookingUpdateModalProps> = ({ booking, onClose, onUpdate, toastSuccess, toastError }) => {
  const [status, setStatus] = useState(booking.status);
  const [videoLink, setVideoLink] = useState(booking.videoLink || '');
  const [meetingLink, setMeetingLink] = useState(booking.meetingLink || '');
  const [adminNotes, setAdminNotes] = useState(booking.adminNotes || '');
  const [sessionDate, setSessionDate] = useState(booking.sessionDate || '');
  const [availableDates, setAvailableDates] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingDates, setIsLoadingDates] = useState(false);

  // Fetch available dates for face-to-face sessions
  useEffect(() => {
    if (booking.sessionType === 'FACE_TO_FACE') {
      fetchAvailableDates();
    }
  }, [booking.sessionType]);

  const fetchAvailableDates = async () => {
    setIsLoadingDates(true);
    try {
      const response = await fetch('/api/admin/available-dates');
      if (response.ok) {
        const data = await response.json();
        setAvailableDates(data.availableDates.filter((date: any) => !date.isBooked || date.id === booking.availableDateId));
      }
    } catch (error) {
      console.error('Error fetching available dates:', error);
    } finally {
      setIsLoadingDates(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const updateData: any = {
        bookingId: booking.id,
        status,
        adminNotes: adminNotes.trim() || undefined
      };

      if (booking.sessionType === 'RECORDED' && videoLink.trim()) {
        updateData.videoLink = videoLink.trim();
      }

      if (booking.sessionType === 'FACE_TO_FACE') {
        if (meetingLink.trim()) {
          updateData.meetingLink = meetingLink.trim();
        }
        if (sessionDate && sessionDate !== booking.sessionDate) {
          updateData.sessionDate = sessionDate;
        }
      }

      const response = await fetch('/api/admin/mentorship', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
          onUpdate();
          toastSuccess('تم تحديث الحجز بنجاح');
      } else {
        const error = await response.json();
        toastError(`فشل في تحديث الحجز: ${error.error}`);
      }
    } catch (error) {
      console.error('Booking update error:', error);
      toastError('حدث خطأ أثناء تحديث الحجز.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">تحديث حجز الجلسة</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Booking Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">معلومات الحجز</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">الطالب:</span>
                <span className="font-medium mr-2">{booking.user?.name}</span>
              </div>
              <div>
                <span className="text-gray-600">نوع الجلسة:</span>
                <span className="font-medium mr-2">
                  {booking.sessionType === 'RECORDED' ? 'جلسة مسجلة' : 'جلسة مباشرة'}
                </span>
              </div>
              {booking.sessionType === 'FACE_TO_FACE' && (
                <>
                  <div>
                    <span className="text-gray-600">المدة:</span>
                    <span className="font-medium mr-2">{booking.duration} دقيقة</span>
                  </div>
                  <div>
                    <span className="text-gray-600">رقم الواتساب:</span>
                    <span className="font-medium mr-2">{booking.whatsappNumber}</span>
                  </div>
                </>
              )}
              <div>
                <span className="text-gray-600">المبلغ:</span>
                <span className="font-medium mr-2">{Number(booking.amount).toFixed(2)} جنية</span>
              </div>
              <div>
                <span className="text-gray-600">تاريخ الحجز:</span>
                <span className="font-medium mr-2">
                  {new Date(booking.createdAt).toLocaleDateString('en-US')}
                </span>
              </div>
            </div>
            {booking.studentNotes && (
              <div className="mt-3">
                <span className="text-gray-600">ملاحظات الطالب:</span>
                <p className="text-sm text-gray-800 mt-1 p-2 bg-white rounded border">
                  {booking.studentNotes}
                </p>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">حالة الحجز</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="PENDING">في الانتظار</option>
              <option value="CONFIRMED">مؤكد</option>
              <option value="COMPLETED">مكتمل</option>
              <option value="CANCELLED">ملغي</option>
            </select>
          </div>

          {/* Video Link for Recorded Sessions */}
          {booking.sessionType === 'RECORDED' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">رابط الفيديو</label>
              <input
                type="url"
                value={videoLink}
                onChange={(e) => setVideoLink(e.target.value)}
                placeholder="https://example.com/video"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}

          {/* Session Date and Meeting Link for Face-to-Face Sessions */}
          {booking.sessionType === 'FACE_TO_FACE' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ ووقت الجلسة</label>
                {isLoadingDates ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                    جاري تحميل المواعيد المتاحة...
                  </div>
                ) : (
                  <select
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">اختر موعد الجلسة</option>
                    {availableDates.map((date) => (
                      <option key={date.id} value={date.id}>
                        {date.timeSlot}
                      </option>
                    ))}
                  </select>
                )}
                {booking.sessionDate && (
                  <p className="text-sm text-gray-600 mt-1">
                    الموعد الحالي: {new Date(booking.sessionDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">رابط الاجتماع</label>
                <input
                  type="url"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://zoom.us/j/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </>
          )}

          {/* Admin Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات الإدارة</label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="أي ملاحظات إضافية..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 space-x-reverse">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-400"
            >
              {isUpdating ? 'جاري التحديث...' : 'تحديث الحجز'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- MENTORSHIP TAB ---
interface MentorshipTabProps {
  bookings: MentorshipBooking[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onBookingStatusConfirm: (bookingId: string, status: 'CONFIRMED' | 'CANCELLED', details?: string) => void;
  toastSuccess: (message: string) => void;
  toastError: (message: string) => void;
}

interface RecordedSession {
  id: string;
  title: string;
  description: string | null;
  videoLink: string;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RecordedSessionCardProps {
  onRefresh: () => void;
  toastSuccess: (message: string) => void;
  toastError: (message: string) => void;
}

const RecordedSessionCard: FC<RecordedSessionCardProps> = ({ onRefresh, toastSuccess, toastError }) => {
  const [recordedSession, setRecordedSession] = useState<RecordedSession | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoLink: '',
    price: 150,
    isActive: true
  });

  const fetchRecordedSession = async () => {
    try {
      const response = await fetch('/api/admin/recorded-sessions');
      if (response.ok) {
        const sessions = await response.json();
        const activeSession = sessions.find((s: RecordedSession) => s.isActive) || sessions[0];
        setRecordedSession(activeSession || null);
        if (activeSession) {
          setFormData({
            title: activeSession.title,
            description: activeSession.description || '',
            videoLink: activeSession.videoLink,
            price: activeSession.price,
            isActive: activeSession.isActive
          });
        }
      }
    } catch (error) {
      console.error('Error fetching recorded session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordedSession();
  }, []);

  const handleSave = async () => {
    try {
      const url = recordedSession ? '/api/admin/recorded-sessions' : '/api/admin/recorded-sessions';
      const method = recordedSession ? 'PUT' : 'POST';
      const body = recordedSession ? { id: recordedSession.id, ...formData } : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        await fetchRecordedSession();
        setIsEditing(false);
        onRefresh();
        toastSuccess('تم حفظ الجلسة المسجلة بنجاح');
      } else {
        const error = await response.json();
        toastError(`خطأ في حفظ الجلسة المسجلة: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving recorded session:', error);
      toastError('حدث خطأ أثناء حفظ الجلسة المسجلة');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="p-3 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 text-white">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">إدارة الجلسة المسجلة</h3>
            <p className="text-sm text-gray-600">رابط واحد لجميع الطلاب</p>
          </div>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          {isEditing ? 'إلغاء' : 'تعديل'}
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الجلسة</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="أدخل عنوان الجلسة"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">وصف الجلسة</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
              placeholder="أدخل وصف الجلسة"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رابط الفيديو</label>
            <input
              type="url"
              value={formData.videoLink}
              onChange={(e) => setFormData({ ...formData, videoLink: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="https://example.com/video"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">السعر</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
              <select
                value={formData.isActive.toString()}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="true">نشط</option>
                <option value="false">غير نشط</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 space-x-reverse">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              حفظ
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {recordedSession ? (
            <>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-800">{recordedSession.title}</h4>
                  {recordedSession.description && (
                    <p className="text-gray-600 mt-1">{recordedSession.description}</p>
                  )}
                </div>
                <div className="text-left">
                  <span className="text-2xl font-bold text-purple-600">{Number(recordedSession.price).toFixed(2)} جنية</span>
                  <div className="mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      recordedSession.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {recordedSession.isActive ? 'نشط' : 'غير نشط'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600 mb-1">رابط الفيديو:</p>
                <a
                  href={recordedSession.videoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-800 text-sm break-all"
                >
                  {recordedSession.videoLink}
                </a>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">لا توجد جلسة مسجلة</p>
              <button
                onClick={() => setIsEditing(true)}
                className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                إضافة جلسة مسجلة
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MentorshipTab: FC<MentorshipTabProps> = ({ bookings, pagination, onPageChange, onRefresh, onBookingStatusConfirm, toastSuccess, toastError }) => {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<MentorshipBooking | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const handleUpdateBooking = (booking: MentorshipBooking) => {
    setSelectedBooking(booking);
    setShowUpdateModal(true);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      PENDING: { label: 'في الانتظار', class: 'bg-yellow-100 text-yellow-800' },
      CONFIRMED: { label: 'مؤكد', class: 'bg-green-100 text-green-800' },
      COMPLETED: { label: 'مكتمل', class: 'bg-blue-100 text-blue-800' },
      CANCELLED: { label: 'ملغي', class: 'bg-red-100 text-red-800' }
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, class: 'bg-gray-100 text-gray-800' };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  return (
    <div>
      {/* Recorded Session Management */}
      <RecordedSessionCard onRefresh={onRefresh} toastSuccess={toastSuccess} toastError={toastError} />
      
      <div className="flex justify-between items-center mb-6 mt-8">
        <div className="flex items-center space-x-3 space-x-reverse">
          <Calendar className="h-8 w-8 text-orange-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">إدارة حجوزات الجلسات</h2>
            <p className="text-gray-600">مراجعة وإدارة جميع حجوزات جلسات الإرشاد</p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center space-x-2 space-x-reverse bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>تحديث</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الطالب</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نوع الجلسة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التفاصيل</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المبلغ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{booking.user?.name || 'غير محدد'}</div>
                      <div className="text-sm text-gray-500">{booking.user?.email || 'غير محدد'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        booking.sessionType === 'RECORDED' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {booking.sessionType === 'RECORDED' ? 'مسجلة' : 'مباشرة'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {booking.sessionType === 'FACE_TO_FACE' && (
                        <div className="text-gray-900">{booking.duration || 0} دقيقة</div>
                      )}
                      {booking.sessionDate && (
                        <div className="text-gray-500">
                          {new Date(booking.sessionDate).toLocaleDateString('en-US')}
                        </div>
                      )}
                      {booking.whatsappNumber && (
                        <div className="text-gray-500 text-xs">{booking.whatsappNumber}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{Number(booking.amount || 0).toFixed(2)} جنية</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(booking.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(booking.createdAt).toLocaleDateString('en-US')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleUpdateBooking(booking)}
                        className="text-blue-600 hover:text-blue-900"
                        title="تحديث الحجز"
                      >
                        <FileText className="h-5 w-5" />
                      </button>
                      {booking.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => onBookingStatusConfirm(booking.id, 'CONFIRMED', `تأكيد حجز الإرشاد للطالب ${booking.user?.name || 'غير معروف'}${booking.sessionDate ? ` في ${formatDate(booking.sessionDate)}` : ''}`)}
                            disabled={isUpdating === booking.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            title="تأكيد الحجز"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => onBookingStatusConfirm(booking.id, 'CANCELLED', `إلغاء حجز الإرشاد للطالب ${booking.user?.name || 'غير معروف'}${booking.sessionDate ? ` في ${formatDate(booking.sessionDate)}` : ''}`)}
                            disabled={isUpdating === booking.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="إلغاء الحجز"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                السابق
              </button>
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                التالي
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  عرض <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> إلى{' '}
                  <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> من{' '}
                  <span className="font-medium">{pagination.total}</span> نتيجة
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => onPageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => onPageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pagination.page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => onPageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Update Modal */}
      {showUpdateModal && selectedBooking && (
        <BookingUpdateModal
          booking={selectedBooking}
          onClose={() => {
            setShowUpdateModal(false);
            setSelectedBooking(null);
          }}
          onUpdate={() => {
            setShowUpdateModal(false);
            setSelectedBooking(null);
            onRefresh();
          }}
          toastSuccess={toastSuccess}
          toastError={toastError}
        />
      )}
    </div>
  );
};

const StatCard: FC<{ icon: React.ReactNode; title: string; value: number | string; color?: string }> = ({ icon, title, value, color = 'text-blue-500' }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 ${color}`}>{icon}</div>
        <div className="mr-4">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
      <div className="text-green-500 text-sm font-medium bg-green-50 px-2 py-1 rounded-full">+12%</div>
    </div>
  </div>
);

interface StudentsTabProps {
  students: Student[];
  onRefresh: () => void;
}

const StudentsTab: FC<StudentsTabProps> = ({ students, onRefresh }) => {
  const [filters, setFilters] = useState({
    search: '',
    minScore: '',
    maxScore: '',
    minTasks: '',
    maxTasks: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState(students);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);

  // Fetch all students for statistics and filtering
  useEffect(() => {
    const fetchAllStudents = async () => {
      try {
        const response = await fetch('/api/users?role=STUDENT&includeProgress=true');
        if (response.ok) {
          const data = await response.json();
          const studentsData = data.users.map((user: any) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            totalTasks: user.stats?.totalSubmissions || 0,
            completedTasks: user.stats?.approvedSubmissions || 0,
            pendingTasks: user.stats?.pendingSubmissions || 0,
            averageScore: user.stats?.averageScore || null,
            createdAt: user.createdAt,
            stats: user.stats
          }));
          setAllStudents(studentsData);
        }
      } catch (error) {
        console.error('Error fetching all students:', error);
      }
    };
    fetchAllStudents();
  }, []);

  // Filter students based on current filters
  useEffect(() => {
    let filtered = allStudents.length > 0 ? allStudents : students;

    if (filters.search) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        s.email.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    if (filters.minScore) {
      filtered = filtered.filter(s => s.averageScore !== null && s.averageScore >= Number(filters.minScore));
    }
    if (filters.maxScore) {
      filtered = filtered.filter(s => s.averageScore !== null && s.averageScore <= Number(filters.maxScore));
    }
    if (filters.minTasks) {
      filtered = filtered.filter(s => s.completedTasks >= Number(filters.minTasks));
    }
    if (filters.maxTasks) {
      filtered = filtered.filter(s => s.completedTasks <= Number(filters.maxTasks));
    }
    if (filters.dateFrom) {
      filtered = filtered.filter(s => new Date(s.createdAt) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(s => new Date(s.createdAt) <= new Date(filters.dateTo));
    }

    setFilteredStudents(filtered);
  }, [students, allStudents, filters]);

  const clearFilters = () => {
    setFilters({
      search: '',
      minScore: '',
      maxScore: '',
      minTasks: '',
      maxTasks: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
  };

  // Calculate statistics (using all students, not filtered ones)
  const allStudentsForStats = allStudents.length > 0 ? allStudents : students;
  const stats = {
    total: allStudentsForStats.length,
    active: allStudentsForStats.filter(s => s.completedTasks > 0).length,
    inactive: allStudentsForStats.filter(s => s.completedTasks === 0).length,
    highPerformers: allStudentsForStats.filter(s => s.averageScore !== null && s.averageScore >= 80).length,
    averageScore: allStudentsForStats.reduce((sum, s) => sum + (s.averageScore || 0), 0) / allStudentsForStats.filter(s => s.averageScore !== null).length || 0,
    totalCompletedTasks: allStudentsForStats.reduce((sum, s) => sum + s.completedTasks, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">إدارة الطلاب</h2>
              <p className="text-gray-600">مراجعة وإدارة جميع الطلاب مع فلاتر متقدمة</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 space-x-reverse">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                showFilters 
                  ? 'bg-green-500 text-white shadow-lg' 
                  : 'bg-white text-green-600 border border-green-200 hover:bg-green-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>الفلاتر</span>
            </button>
            <button
              onClick={onRefresh}
              className="flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <RefreshCw className="h-4 w-4" />
              <span>تحديث</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الطلاب</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">طلاب نشطون</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">طلاب غير نشطين</p>
                <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">متفوقون</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.highPerformers}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">متوسط الدرجات</p>
                <p className="text-xl font-bold text-blue-600">{stats.averageScore.toFixed(1)}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">المهام المكتملة</p>
                <p className="text-xl font-bold text-purple-600">{stats.totalCompletedTasks}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Filter className="w-5 h-5 text-green-600" />
              فلاتر البحث المتقدمة
            </h3>
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              مسح الفلاتر
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">البحث</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="البحث بالاسم أو البريد الإلكتروني"
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Score Range */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">نطاق الدرجات</label>
              <div className="flex space-x-2 space-x-reverse">
                <input
                  type="number"
                  placeholder="من"
                  value={filters.minScore}
                  onChange={(e) => setFilters({...filters, minScore: e.target.value})}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <input
                  type="number"
                  placeholder="إلى"
                  value={filters.maxScore}
                  onChange={(e) => setFilters({...filters, maxScore: e.target.value})}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Tasks Range */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">نطاق المهام المكتملة</label>
              <div className="flex space-x-2 space-x-reverse">
                <input
                  type="number"
                  placeholder="من"
                  value={filters.minTasks}
                  onChange={(e) => setFilters({...filters, minTasks: e.target.value})}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <input
                  type="number"
                  placeholder="إلى"
                  value={filters.maxTasks}
                  onChange={(e) => setFilters({...filters, maxTasks: e.target.value})}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">نطاق تاريخ التسجيل</label>
              <div className="flex space-x-2 space-x-reverse">
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Students Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider">الطالب</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider">الإحصائيات</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider">الأداء</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider">تاريخ التسجيل</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-green-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="mr-4">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>مكتملة: {student.completedTasks}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-500" />
                        <span>معلقة: {student.pendingTasks}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {student.averageScore !== null ? (
                        <>
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            student.averageScore >= 80 ? 'bg-green-100 text-green-800' :
                            student.averageScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {student.averageScore.toFixed(1)}
                          </div>
                          {student.averageScore >= 80 && <Star className="w-4 h-4 text-yellow-500 mr-2" />}
                        </>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">لا توجد درجات</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(student.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleStudentClick(student)}
                      className="flex items-center space-x-1 space-x-reverse bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                    >
                      <Eye className="w-4 h-4" />
                      <span>عرض</span>
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Users className="w-12 h-12 text-gray-300 mb-2" />
                      <span>لا توجد طلاب</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Summary */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <p className="text-sm text-gray-600 text-center">
          عرض {filteredStudents.length} من أصل {allStudentsForStats.length} طالب
        </p>
      </div>

      {/* Student Details Modal */}
      {showStudentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                  تفاصيل الطالب
                </h3>
                <button
                  onClick={() => setShowStudentModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Student Info */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-green-600" />
                    معلومات الطالب
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">الاسم</p>
                      <p className="font-medium text-gray-900">{selectedStudent.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">البريد الإلكتروني</p>
                      <p className="font-medium text-gray-900">{selectedStudent.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">تاريخ التسجيل</p>
                      <p className="font-medium text-gray-900">{formatDate(selectedStudent.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">متوسط الدرجات</p>
                      <p className="font-medium text-gray-900">
                        {selectedStudent.averageScore !== null ? selectedStudent.averageScore.toFixed(2) : 'لا توجد درجات'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    إحصائيات الأداء
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-green-600">{selectedStudent.completedTasks}</p>
                      <p className="text-sm text-gray-600">مهام مكتملة</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Clock className="w-6 h-6 text-yellow-600" />
                      </div>
                      <p className="text-2xl font-bold text-yellow-600">{selectedStudent.pendingTasks}</p>
                      <p className="text-sm text-gray-600">مهام معلقة</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Award className="w-6 h-6 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{selectedStudent.totalTasks}</p>
                      <p className="text-sm text-gray-600">إجمالي المهام</p>
                    </div>
                  </div>
                </div>

                {/* Additional Stats if available */}
                {selectedStudent.stats && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      إحصائيات التقديمات
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-xl font-bold text-gray-900">{selectedStudent.stats.totalSubmissions}</p>
                        <p className="text-sm text-gray-600">إجمالي التقديمات</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-green-600">{selectedStudent.stats.approvedSubmissions}</p>
                        <p className="text-sm text-gray-600">مقبولة</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-yellow-600">{selectedStudent.stats.pendingSubmissions}</p>
                        <p className="text-sm text-gray-600">معلقة</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-red-600">{selectedStudent.stats.rejectedSubmissions}</p>
                        <p className="text-sm text-gray-600">مرفوضة</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowStudentModal(false)}
                  className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SubmissionsTab: FC<{ 
  submissions: Submission[]; 
  pagination: { page: number; totalPages: number; total: number };
  onPageChange: (page: number) => void;
  onReview: (submission: Submission) => void;
}> = ({ submissions, pagination, onPageChange, onReview }) => (
  <>
    <PageHeader title="التقديمات" />
    <div className="space-y-6">
      {submissions.length > 0 ? (
        submissions.map((submission) => (
          <div key={submission.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-5 h-5 text-blue-500" />
                      <span className="font-semibold text-gray-900">{submission.user?.name || 'غير معروف'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700">{submission.task?.title || 'غير معروف'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span>تاريخ التقديم: {formatDate(submission.createdAt)}</span>
                    <span>الدرجة: {submission.score ?? 'لم تقيم'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={submission.status} />
                  <button 
                    onClick={() => onReview(submission)} 
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                  >
                    مراجعة
                  </button>
                </div>
              </div>
              
              {submission.content && (
                <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-700">محتوى التقديم:</span>
                  </div>
                  <div className="text-sm text-gray-800 leading-relaxed max-h-32 overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-sans">{submission.content}</pre>
                  </div>
                </div>
              )}
              
              {submission.feedback && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Clipboard className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-semibold text-yellow-700">ملاحظات المراجع:</span>
                  </div>
                  <p className="text-sm text-yellow-800">{submission.feedback}</p>
                </div>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد تقديمات</h3>
          <p className="text-gray-500">لم يتم العثور على أي تقديمات حتى الآن</p>
        </div>
      )}
    </div>
    <div className="mt-8">
      <PaginationControl {...pagination} onPageChange={onPageChange} />
    </div>
  </>
);

const PlatformsTab: FC<{ platforms: Platform[]; onEdit: (p: Platform, t: 'platform') => void; onDelete: (p: Platform, t: 'platform') => void; onCreate: () => void; }> = ({ platforms, onEdit, onDelete, onCreate }) => (
  <>
    <PageHeader title="المنصات">
      <button onClick={onCreate} className="flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
        <Plus className="ml-2 h-5 w-5" />
        إضافة منصة
      </button>
    </PageHeader>
    <Table
      headers={['الاسم', 'الوصف', 'الرابط', 'تاريخ الإنشاء', 'الإجراءات']}
      rows={platforms.map(p => [
        p.name,
        p.description,
        <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">زيارة</a>,
        new Date(p.createdAt).toLocaleDateString('en-US'),
        <ActionButtons onEdit={() => onEdit(p, 'platform')} onDelete={() => onDelete(p, 'platform')} />
      ])}
    />
  </>
);

const TasksTab: FC<{ tasks: Task[]; onEdit: (t: Task, type: 'task') => void; onDelete: (t: Task, type: 'task') => void; onCreate: () => void; }> = ({ tasks, onEdit, onDelete, onCreate }) => (
  <>
    <PageHeader title="المهام">
        <button onClick={onCreate} className="flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
            <Plus className="ml-2 h-5 w-5" />
            إضافة مهمة
        </button>
    </PageHeader>
    <Table
      headers={['العنوان', 'المنصة', 'الترتيب', 'تاريخ الإنشاء', 'الإجراءات']}
      rows={tasks.map(t => [
        t.title,
        t.platform?.name || 'N/A',
        t.order,
        new Date(t.createdAt).toLocaleDateString('en-US'),
        <ActionButtons onEdit={() => onEdit(t, 'task')} onDelete={() => onDelete(t, 'task')} />
      ])}
    />
  </>
);

const UsersTab: FC<{ users: User[]; onEdit: (u: User, type: 'user') => void; onDelete: (u: User, type: 'user') => void; onCreate: () => void; }> = ({ users, onEdit, onDelete, onCreate }) => (
  <>
    <PageHeader title="المستخدمون">
        <button onClick={onCreate} className="flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
            <Plus className="ml-2 h-5 w-5" />
            إضافة مستخدم
        </button>
    </PageHeader>
    <Table
      headers={['الاسم', 'البريد الإلكتروني', 'الدور', 'تاريخ التسجيل', 'الإجراءات']}
      rows={users.map(u => [
        u.name,
        u.email,
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === 'ADMIN' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{u.role}</span>,
        new Date(u.createdAt).toLocaleDateString('en-US'),
        <ActionButtons onEdit={() => onEdit(u, 'user')} onDelete={() => onDelete(u, 'user')} />
      ])}
    />
  </>
);

const Table: FC<{ headers: string[]; rows: (string | number | JSX.Element)[][] }> = ({ headers, rows }) => (
  <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-gray-100">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
        <tr>
          {headers.map(header => (
            <th key={header} scope="col" className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-100">
        {rows.length > 0 ? rows.map((row, i) => (
          <tr key={i} className="hover:bg-blue-50 transition-colors duration-200">
            {row.map((cell, j) => (
              <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{cell}</td>
            ))}
          </tr>
        )) : (
          <tr>
            <td colSpan={headers.length} className="px-6 py-8 text-center text-gray-500">
              <div className="flex flex-col items-center">
                <FileText className="w-12 h-12 text-gray-300 mb-2" />
                <span>لا توجد بيانات</span>
              </div>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const StatusBadge: FC<{ status: 'PENDING' | 'APPROVED' | 'REJECTED' }> = ({ status }) => {
  const config = {
    PENDING: { text: 'معلق', color: 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300', icon: Clock },
    APPROVED: { text: 'مقبول', color: 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300', icon: CheckCircle },
    REJECTED: { text: 'مرفوض', color: 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300', icon: XCircle },
  }
  const statusConfig = config[status]
  const IconComponent = statusConfig.icon
  return (
    <span className={`px-3 py-1 inline-flex items-center text-xs font-semibold rounded-full ${statusConfig.color}`}>
      <IconComponent className="w-3 h-3 mr-1" />
      {statusConfig.text}
    </span>
  )
};

const ActionButtons: FC<{ onEdit: () => void; onDelete?: () => void; }> = ({ onEdit, onDelete }) => (
  <div className="flex space-x-2 space-x-reverse">
    <button onClick={onEdit} className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 hover:text-indigo-700 transition-all duration-200">
      <Edit className="w-4 h-4 mr-1" />
      تعديل
    </button>
    {onDelete && (
      <button onClick={onDelete} className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 hover:text-red-700 transition-all duration-200">
        <Trash2 className="w-4 h-4 mr-1" />
        حذف
      </button>
    )}
  </div>
);

const PaginationControl: FC<{ page: number; totalPages: number; total: number; onPageChange: (page: number) => void; }> = ({ page, totalPages, total, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-6 flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200">
      <div>
        <span className="text-sm text-gray-700">
          صفحة <span className="font-bold text-blue-600">{page}</span> من <span className="font-bold">{totalPages}</span> 
          <span className="text-gray-500">({total} إجمالي العناصر)</span>
        </span>
      </div>
      <div className="flex space-x-2 space-x-reverse">
        <button 
          onClick={() => onPageChange(page - 1)} 
          disabled={page <= 1} 
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium">{page}</span>
        <button 
          onClick={() => onPageChange(page + 1)} 
          disabled={page >= totalPages} 
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
};

// --- MODAL COMPONENTS ---

interface ReviewModalProps {
  submission: Submission
  onClose: () => void
  onUpdate: () => void
  toastSuccess: (message: string) => void
  toastError: (message: string) => void
}

const ReviewModal: FC<ReviewModalProps> = ({ submission, onClose, onUpdate, toastSuccess, toastError }) => {
  const [feedback, setFeedback] = useState(submission.feedback || '')
  const [score, setScore] = useState<number | string>(submission.score || '')
  const [status, setStatus] = useState(submission.status)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleSubmit = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/submissions/${submission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          feedback,
          score: score ? Number(score) : null,
          status
        })
      });
      if (response.ok) {
        onUpdate();
        toastSuccess('تم تحديث التقديم بنجاح');
        onClose();
      } else {
        const error = await response.json();
        toastError(`فشل في التحديث: ${error.error}`);
      }
    } catch (error) {
      console.error('Update error:', error);
      toastError('حدث خطأ أثناء تحديث التقديم.');
    } finally {
      setIsUpdating(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-green-600 bg-green-50 border-green-200'
      case 'REJECTED': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="w-5 h-5" />
      case 'REJECTED': return <XCircle className="w-5 h-5" />
      default: return <Clock className="w-5 h-5" />
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">مراجعة التقديم</h2>
                <p className="text-blue-100 text-sm">تقييم وإضافة ملاحظات للطالب</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center hover:bg-opacity-30 transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Student & Task Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                <div className="flex items-center space-x-3 space-x-reverse mb-2">
                  <UserIcon className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-800">معلومات الطالب</h3>
                </div>
                <p className="text-gray-700 font-medium">{submission.user?.name}</p>
                <p className="text-gray-500 text-sm">{submission.user?.email}</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                <div className="flex items-center space-x-3 space-x-reverse mb-2">
                  <BookOpen className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-800">معلومات المهمة</h3>
                </div>
                <p className="text-gray-700 font-medium">{submission.task?.title}</p>
                <p className="text-gray-500 text-sm">{submission.task?.platform?.name}</p>
              </div>
            </div>

            {/* Current Status */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <h3 className="font-semibold text-gray-800">الحالة الحالية</h3>
                  <div className={`flex items-center space-x-2 space-x-reverse px-3 py-1 rounded-full border ${getStatusColor(submission.status)}`}>
                    {getStatusIcon(submission.status)}
                    <span className="text-sm font-medium">
                      {submission.status === 'PENDING' ? 'معلق' : submission.status === 'APPROVED' ? 'مقبول' : 'مرفوض'}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  تاريخ التقديم: {formatDateTime(submission.createdAt)}
                </div>
              </div>
            </div>

            {/* Submission Content */}
            {submission.summary && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800 flex items-center space-x-2 space-x-reverse">
                    <Clipboard className="w-5 h-5 text-gray-600" />
                    <span>محتوى التقديم</span>
                  </h3>
                </div>
                <div className="p-4 max-h-60 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">{submission.summary}</pre>
                </div>
              </div>
            )}

            {/* Review Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2 space-x-reverse">
                  <Settings className="w-4 h-4" />
                  <span>تحديث الحالة</span>
                </label>
                <select 
                  value={status} 
                  onChange={e => setStatus(e.target.value as 'PENDING' | 'APPROVED' | 'REJECTED')} 
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                >
                  <option value="PENDING">⏳ معلق</option>
                  <option value="APPROVED">✅ مقبول</option>
                  <option value="REJECTED">❌ مرفوض</option>
                </select>
              </div>

              {/* Score Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2 space-x-reverse">
                  <Star className="w-4 h-4" />
                  <span>الدرجة (من 100)</span>
                </label>
                <input 
                  type="number" 
                  value={score} 
                  onChange={e => setScore(e.target.value)} 
                  min="0" 
                  max="100"
                  placeholder="أدخل الدرجة..."
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>

            {/* Feedback */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2 space-x-reverse">
                <FileText className="w-4 h-4" />
                <span>ملاحظات وتوجيهات للطالب</span>
              </label>
              <textarea 
                value={feedback} 
                onChange={e => setFeedback(e.target.value)} 
                rows={4} 
                placeholder="اكتب ملاحظاتك وتوجيهاتك للطالب هنا..."
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end space-x-3 space-x-reverse">
            <button 
              onClick={onClose} 
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center space-x-2 space-x-reverse"
            >
              <X className="w-4 h-4" />
              <span>إلغاء</span>
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={isUpdating} 
              className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-300 disabled:to-indigo-300 transition-all duration-200 flex items-center space-x-2 space-x-reverse shadow-lg hover:shadow-xl"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري التحديث...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>حفظ التحديثات</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface CrudModalProps {
  mode: 'create' | 'edit';
  entityType: 'platform' | 'task' | 'user';
  entityData?: Platform | Task | User;
  formData: FormData;
  setFormData: (data: FormData) => void;
  platforms?: Platform[];
  onClose: () => void;
  onSubmit: () => void;
}

const CrudModal: FC<CrudModalProps> = ({ mode, entityType, entityData, formData, setFormData, platforms, onClose, onSubmit }) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && entityData) {
      setFormData(entityData);
    } else {
      setFormData({});
    }
    setErrors({});
  }, [mode, entityData, setFormData]);

  const title = `${mode === 'create' ? 'إنشاء' : 'تعديل'} ${{
    platform: 'منصة',
    task: 'مهمة',
    user: 'مستخدم'
  }[entityType]}`;

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    switch (entityType) {
      case 'platform':
        if (!formData.name?.trim()) {
          newErrors.name = 'اسم المنصة مطلوب';
        } else if (formData.name.length < 2) {
          newErrors.name = 'اسم المنصة يجب أن يكون أكثر من حرفين';
        }
        if (!formData.url?.trim()) {
          newErrors.url = 'رابط المنصة مطلوب';
        } else if (!/^https?:\/\/.+/.test(formData.url)) {
          newErrors.url = 'يجب أن يكون الرابط صحيحاً ويبدأ بـ http:// أو https://';
        }
        break;

      case 'task':
        if (!formData.title?.trim()) {
          newErrors.title = 'عنوان المهمة مطلوب';
        } else if (formData.title.length < 3) {
          newErrors.title = 'عنوان المهمة يجب أن يكون أكثر من 3 أحرف';
        }
        if (!formData.platformId) {
          newErrors.platformId = 'يجب اختيار منصة';
        }
        if (!formData.link?.trim()) {
          newErrors.link = 'رابط المهمة مطلوب';
        } else if (!/^https?:\/\/.+/.test(formData.link)) {
          newErrors.link = 'يجب أن يكون الرابط صحيحاً ويبدأ بـ http:// أو https://';
        }
        if (formData.order && (isNaN(Number(formData.order)) || Number(formData.order) < 1)) {
          newErrors.order = 'الترتيب يجب أن يكون رقماً موجباً';
        }
        break;

      case 'user':
        if (!formData.name?.trim()) {
          newErrors.name = 'اسم المستخدم مطلوب';
        } else if (formData.name.length < 2) {
          newErrors.name = 'الاسم يجب أن يكون أكثر من حرفين';
        }
        if (!formData.email?.trim()) {
          newErrors.email = 'البريد الإلكتروني مطلوب';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'البريد الإلكتروني غير صحيح';
        }
        if (!formData.phoneNumber?.trim()) {
          newErrors.phoneNumber = 'رقم الهاتف مطلوب';
        } else if (!/^[0-9+\-\s()]{10,}$/.test(formData.phoneNumber)) {
          newErrors.phoneNumber = 'رقم الهاتف غير صحيح';
        }
        if (mode === 'create' && !formData.password?.trim()) {
          newErrors.password = 'كلمة المرور مطلوبة';
        } else if (mode === 'create' && formData.password && formData.password.length < 6) {
          newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
        }
        if (!formData.role) {
          newErrors.role = 'يجب اختيار دور المستخدم';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const renderFields = () => {
    switch (entityType) {
      case 'platform':
        return (
          <>
            <InputField name="name" label="الاسم" value={formData.name || ''} onChange={handleChange} error={errors.name} />
            <InputField name="url" label="الرابط" value={formData.url || ''} onChange={handleChange} error={errors.url} />
            <TextAreaField name="description" label="الوصف" value={formData.description || ''} onChange={handleChange} error={errors.description} />
          </>
        );
      case 'task':
        return (
          <>
            <InputField name="title" label="العنوان" value={formData.title || ''} onChange={handleChange} error={errors.title} />
            <SelectField name="platformId" label="المنصة" value={formData.platformId || ''} onChange={handleChange} options={platforms?.map(p => ({ value: p.id, label: p.name })) || []} error={errors.platformId} />
            <InputField name="link" label="رابط المهمة" value={formData.link || ''} onChange={handleChange} error={errors.link} />
            <InputField name="order" label="الترتيب" type="number" value={formData.order || ''} onChange={handleChange} error={errors.order} />
            <TextAreaField name="description" label="الوصف" value={formData.description || ''} onChange={handleChange} error={errors.description} />
          </>
        );
      case 'user':
        return (
          <>
            <InputField name="name" label="الاسم" value={formData.name || ''} onChange={handleChange} error={errors.name} />
            <InputField name="email" label="البريد الإلكتروني" type="email" value={formData.email || ''} onChange={handleChange} error={errors.email} />
            <InputField name="phoneNumber" label="رقم الهاتف" value={formData.phoneNumber || ''} onChange={handleChange} error={errors.phoneNumber} />
            {mode === 'create' && <InputField name="password" label="كلمة المرور" type="password" value={formData.password || ''} onChange={handleChange} error={errors.password} />}
            <SelectField name="role" label="الدور" value={formData.role || ''} onChange={handleChange} options={[{value: 'STUDENT', label: 'طالب'}, {value: 'ADMIN', label: 'مدير'}]} error={errors.role} />
          </>
        );
      default: return null;
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <button onClick={onClose}><X className="h-6 w-6" /></button>
        </div>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {renderFields()}
          <div className="flex justify-end space-x-3 pt-4 border-t mt-4 space-x-reverse">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300" disabled={isSubmitting}>إلغاء</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const InputField: FC<{ name: string, label: string, value: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string, error?: string }> = ({ name, label, value, onChange, type = 'text', error }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input 
      type={type} 
      name={name} 
      value={value} 
      onChange={onChange} 
      className={`mt-1 block w-full p-2 border rounded-md ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

const TextAreaField: FC<{ name: string, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, error?: string }> = ({ name, label, value, onChange, error }) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-gray-700">{label}</label>
    <textarea 
      name={name} 
      value={value} 
      onChange={onChange} 
      rows={4} 
      className={`block w-full px-4 py-3 border rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 resize-none ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200 hover:border-gray-400'}`}
      placeholder={`أدخل ${label}`}
    />
    {error && <p className="text-sm text-red-600 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{error}</p>}
  </div>
);

// --- DATES TAB ---
interface AvailableDate {
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

interface DatesTabProps {
  onTimeSlotDeleteConfirm: (dateId: string, details: string) => void;
}

const DatesTab: FC<DatesTabProps> = ({ onTimeSlotDeleteConfirm }) => {
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAvailableDates = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/available-dates')
      if (response.ok) {
        const data = await response.json()
        setAvailableDates(data.availableDates || [])
      }
    } catch (error) {
      console.error('Error fetching available dates:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAvailableDates()
  }, [])

  // Handle creating a single time slot
  const handleCreateTimeSlot = async (date: Date, timeSlot: { start: string; end: string }) => {
    try {
      const response = await fetch('/api/admin/available-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: date.toISOString(),
          startTime: timeSlot.start,
          endTime: timeSlot.end,
          isRecurring: false
        })
      })

      if (!response.ok) {
        const error = await response.json()
        if (error.error === 'This date and time slot already exists') {
          // Silently ignore duplicate entries - this is expected behavior
          console.log('Time slot already exists, skipping creation')
          return
        }
        throw new Error(error.error || 'Failed to create time slot')
      }
    } catch (error) {
      console.error('Error creating time slot:', error)
      throw error
    }
  }

  // Handle deleting a time slot with confirmation
  const handleDeleteTimeSlot = (dateId: string, dateInfo?: string) => {
    onTimeSlotDeleteConfirm(dateId, dateInfo || 'حذف الفترة الزمنية المحددة');
  }

  // Handle bulk creating time slots
  const handleBulkCreate = async (date: Date, timeSlots: { start: string; end: string }[]) => {
    try {
      const response = await fetch('/api/admin/available-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dates: timeSlots.map(slot => ({
            date: date.toISOString(),
            startTime: slot.start,
            endTime: slot.end,
            isRecurring: false
          }))
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create time slots')
      }
    } catch (error) {
      console.error('Error creating bulk time slots:', error)
      throw error
    }
  }

  // Handle bulk date range creation
  const handleBulkDateRangeCreate = async (
    startDate: Date,
    endDate: Date,
    timeSlots: { start: string; end: string }[],
    excludeWeekends: boolean
  ) => {
    try {
      const response = await fetch('/api/admin/available-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRange: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          },
          timeSlots: timeSlots.map(slot => ({
             startTime: slot.start,
             endTime: slot.end
           })),
          excludeWeekends
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create time slots')
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error creating bulk date range:', error)
      throw error
    }
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Stats Display */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">إجمالي الأوقات المتاحة</p>
              <p className="text-3xl font-bold mt-2">{availableDates.length}</p>
              <p className="text-blue-200 text-xs mt-1">جميع الفترات الزمنية</p>
            </div>
            <div className="bg-blue-400 bg-opacity-30 rounded-full p-3">
              <Calendar className="w-8 h-8 text-blue-100" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">الأوقات المتاحة للحجز</p>
              <p className="text-3xl font-bold mt-2">{availableDates.filter(d => !d.isBooked).length}</p>
              <p className="text-green-200 text-xs mt-1">جاهزة للحجز</p>
            </div>
            <div className="bg-green-400 bg-opacity-30 rounded-full p-3">
              <Clock className="w-8 h-8 text-green-100" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">الأوقات المحجوزة</p>
              <p className="text-3xl font-bold mt-2">{availableDates.filter(d => d.isBooked).length}</p>
              <p className="text-orange-200 text-xs mt-1">تم حجزها بالفعل</p>
            </div>
            <div className="bg-orange-400 bg-opacity-30 rounded-full p-3">
              <CheckCircle className="w-8 h-8 text-orange-100" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">القوالب المتكررة</p>
              <p className="text-3xl font-bold mt-2">{availableDates.filter(d => d.isRecurring).length}</p>
              <p className="text-purple-200 text-xs mt-1">أوقات ثابتة أسبوعياً</p>
            </div>
            <div className="bg-purple-400 bg-opacity-30 rounded-full p-3">
              <RefreshCw className="w-8 h-8 text-purple-100" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Settings className="w-5 h-5 ml-2 text-gray-600" />
          إجراءات سريعة
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={fetchAvailableDates}
            className="flex items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 border border-blue-200"
          >
            <RefreshCw className="w-5 h-5 ml-2 text-blue-600" />
            <span className="text-blue-700 font-medium">تحديث البيانات</span>
          </button>
          
          <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-gray-600 text-sm">
              آخر تحديث: {new Date().toLocaleString('en-US')}
            </span>
          </div>
          
          <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg border border-green-200">
            <span className="text-green-700 font-medium">
              معدل الحجز: {availableDates.length > 0 ? Math.round((availableDates.filter(d => d.isBooked).length / availableDates.length) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      <CalendlyAdminCalendar
        availableDates={availableDates}
        onRefresh={fetchAvailableDates}
        onCreateTimeSlot={handleCreateTimeSlot}
        onDeleteTimeSlot={handleDeleteTimeSlot}
        onBulkCreate={handleBulkCreate}
        onBulkDateRangeCreate={handleBulkDateRangeCreate}
        loading={loading}
        className="p-6"
      />
    </div>
  )
}

const SelectField: FC<{ name: string, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: {value: string, label: string}[], error?: string }> = ({ name, label, value, onChange, options, error }) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-gray-700">{label}</label>
    <div className="relative">
      <select 
        name={name} 
        value={value} 
        onChange={onChange} 
        className={`block w-full px-4 py-3 border rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 appearance-none bg-white ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200 hover:border-gray-400'}`}
      >
        <option value="">اختر {label}...</option>
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      <ChevronDown className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
    </div>
    {error && <p className="text-sm text-red-600 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{error}</p>}
  </div>
);

interface ActionConfirmationModalProps {
  actionType: 'transaction' | 'booking' | 'timeSlot';
  action: string;
  details?: string;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

const ActionConfirmationModal: FC<ActionConfirmationModalProps> = ({ 
  actionType, 
  action, 
  details,
  onClose, 
  onConfirm,
  isLoading = false 
}) => {
  const getActionInfo = () => {
    switch (actionType) {
      case 'transaction':
        return {
          title: action === 'APPROVED' ? 'تأكيد قبول المعاملة' : 'تأكيد رفض المعاملة',
          message: action === 'APPROVED' 
            ? 'هل أنت متأكد من قبول هذه المعاملة المالية؟'
            : 'هل أنت متأكد من رفض هذه المعاملة المالية؟',
          warning: action === 'APPROVED'
            ? 'سيتم إضافة المبلغ إلى رصيد المستخدم فوراً.'
            : 'لن يتم إضافة المبلغ إلى رصيد المستخدم.',
          confirmText: action === 'APPROVED' ? 'تأكيد القبول' : 'تأكيد الرفض',
          color: action === 'APPROVED' ? 'green' : 'red'
        }
      case 'booking':
        return {
          title: action === 'CONFIRMED' ? 'تأكيد الحجز' : 'إلغاء الحجز',
          message: action === 'CONFIRMED'
            ? 'هل أنت متأكد من تأكيد هذا الحجز؟'
            : 'هل أنت متأكد من إلغاء هذا الحجز؟',
          warning: action === 'CONFIRMED'
            ? 'سيتم إرسال تأكيد الحجز للمستخدم.'
            : 'سيتم إشعار المستخدم بإلغاء الحجز.',
          confirmText: action === 'CONFIRMED' ? 'تأكيد الحجز' : 'إلغاء الحجز',
          color: action === 'CONFIRMED' ? 'green' : 'red'
        }
      case 'timeSlot':
        return {
          title: 'حذف الموعد المتاح',
          message: 'هل أنت متأكد من حذف هذا الموعد المتاح؟',
          warning: 'سيؤثر هذا على جميع الحجوزات المرتبطة بهذا الموعد.',
          confirmText: 'حذف الموعد',
          color: 'red'
        }
      default:
        return {
          title: 'تأكيد العملية',
          message: 'هل أنت متأكد من تنفيذ هذه العملية؟',
          warning: 'هذا الإجراء لا يمكن التراجع عنه.',
          confirmText: 'تأكيد',
          color: 'red'
        }
    }
  }

  const actionInfo = getActionInfo()
  const isDestructive = actionInfo.color === 'red'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" dir="rtl">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 transform transition-all">
        {/* Header with icon */}
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isDestructive ? 'bg-red-100' : 'bg-green-100'
            }`}>
              {isDestructive ? (
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <div className="mr-4">
            <h3 className="text-lg font-bold text-gray-900">{actionInfo.title}</h3>
            <p className="text-sm text-gray-500">تأكيد العملية</p>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-700 mb-3">{actionInfo.message}</p>
          {details && (
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <p className="text-sm text-gray-600">{details}</p>
            </div>
          )}
          <div className={`border rounded-lg p-3 ${
            isDestructive ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
          }`}>
            <p className={`text-sm ${
              isDestructive ? 'text-red-700' : 'text-green-700'
            }`}>
              {actionInfo.warning}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 space-x-reverse">
          <button 
            type="button" 
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
          >
            إلغاء
          </button>
          <button 
            type="button" 
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center ${
              isDestructive 
                ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                : 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                جاري التنفيذ...
              </>
            ) : (
              actionInfo.confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

interface DeleteConfirmationModalProps {
  entityType: string;
  entityName: string;
  entityDetails?: string;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

const DeleteConfirmationModal: FC<DeleteConfirmationModalProps> = ({ 
  entityType, 
  entityName, 
  entityDetails,
  onClose, 
  onConfirm,
  isLoading = false 
}) => {
  const typeMap: { [key: string]: string } = {
    platform: 'المنصة',
    task: 'المهمة',
    user: 'المستخدم'
  };

  const getWarningMessage = (type: string) => {
    switch (type) {
      case 'user':
        return 'تحذير: حذف المستخدم سيؤثر على جميع التقديمات والمعاملات المرتبطة به.';
      case 'platform':
        return 'تحذير: حذف المنصة سيؤثر على جميع المهام المرتبطة بها.';
      case 'task':
        return 'تحذير: حذف المهمة سيؤثر على جميع التقديمات المرتبطة بها.';
      default:
        return 'تحذير: هذا الإجراء لا يمكن التراجع عنه.';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" dir="rtl">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 transform transition-all">
        {/* Header with warning icon */}
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <div className="mr-4">
            <h3 className="text-lg font-bold text-gray-900">تأكيد الحذف</h3>
            <p className="text-sm text-gray-500">هذا الإجراء لا يمكن التراجع عنه</p>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-700 mb-3">
            هل أنت متأكد أنك تريد حذف {typeMap[entityType] || 'العنصر'}:
          </p>
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <p className="font-semibold text-gray-900">"{entityName}"</p>
            {entityDetails && (
              <p className="text-sm text-gray-600 mt-1">{entityDetails}</p>
            )}
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">
              {getWarningMessage(entityType)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 space-x-reverse">
          <button 
            type="button" 
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
          >
            إلغاء
          </button>
          <button 
            type="button" 
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-colors flex items-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                جاري الحذف...
              </>
            ) : (
              'تأكيد الحذف'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
