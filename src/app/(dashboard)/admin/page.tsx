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
  Settings
} from 'lucide-react'
import { CalendlyAdminCalendar } from '@/components/calendar'
import { formatDate, formatDateTime } from '@/lib/dateUtils';

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

// --- MAIN ADMIN PAGE COMPONENT ---
export default function AdminPage() {
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
  const [formData, setFormData] = useState<FormData>({})

  const [pagination, setPagination] = useState<Record<string, { page: number; limit: number; total: number; totalPages: number }>>({
    submissions: { page: 1, limit: 10, total: 0, totalPages: 1 },
    transactions: { page: 1, limit: 10, total: 0, totalPages: 1 },
    mentorship: { page: 1, limit: 10, total: 0, totalPages: 1 },
  });

  // --- DATA FETCHING ---
  const fetchAdminData = useCallback(async (tab: string, page: number = 1) => {
    if (status !== 'authenticated') return;
    setIsContentLoading(true);
    try {
      const cacheKey = `admin-${tab}-${page}`;
      const cachedData = dataCache.get(cacheKey);

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
          response = await fetch('/api/admin/stats');
          if (response.ok) {
            const data = await response.json();
            setOverviewStats(data);
            dataCache.set(cacheKey, data);
          }
          break;
        case 'students':
          response = await fetch('/api/users?role=STUDENT&includeProgress=true');
          if (response.ok) {
            const data = await response.json();
            const formattedStudents = data.users.map((user: User) => ({
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
            dataCache.set(cacheKey, formattedStudents);
          }
          break;
        case 'submissions':
          const limit = 10;
          response = await fetch(`/api/submissions?page=${page}&limit=${limit}`);
          if (response.ok) {
            const data = await response.json();
            setSubmissions(data.submissions || []);
            setPagination(prev => ({ ...prev, submissions: data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 } }));
            dataCache.set(cacheKey, data);
          }
          break;
        case 'platforms':
          response = await fetch('/api/platforms');
          if (response.ok) {
            const data = await response.json();
            setPlatforms(data.platforms || []);
            dataCache.set(cacheKey, data.platforms || []);
          }
          break;
        case 'tasks':
          response = await fetch('/api/tasks');
          if (response.ok) {
            const data = await response.json();
            setTasks(data.tasks || []);
            dataCache.set(cacheKey, data.tasks || []);
          }
          break;
        case 'users':
          response = await fetch('/api/users?includeProgress=false');
          if (response.ok) {
            const data = await response.json();
            setUsers(data.users || []);
            dataCache.set(cacheKey, data.users || []);
          }
          break;
        case 'transactions':
          const transactionLimit = 10;
          response = await fetch(`/api/admin/transactions?page=${page}&limit=${transactionLimit}`);
          if (response.ok) {
            const data = await response.json();
            setTransactions(data.transactions || []);
            setPagination(prev => ({ ...prev, transactions: data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 } }));
            dataCache.set(cacheKey, data);
          }
          break;
        case 'mentorship':
          const mentorshipLimit = 10;
          response = await fetch(`/api/admin/mentorship?page=${page}&limit=${mentorshipLimit}`);
          if (response.ok) {
            const data = await response.json();
            setMentorshipBookings(data.bookings || []);
            setPagination(prev => ({ ...prev, mentorship: data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 } }));
            dataCache.set(cacheKey, data);
          }
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${tab} data:`, error);
    } finally {
      setIsContentLoading(false);
    }
  }, [status]);

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
  const refreshData = (tab: string) => {
    const page = tab === 'submissions' ? pagination.submissions.page :
                 tab === 'transactions' ? pagination.transactions.page :
                 tab === 'mentorship' ? pagination.mentorship.page : 1;
    dataCache.clear(); // Consider more granular cache invalidation
    fetchAdminData(tab, page);
  }

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

  const submitForm = async (method: 'POST' | 'PUT' | 'DELETE') => {
    try {
      let endpoint = ''
      let body = method !== 'DELETE' ? JSON.stringify(formData) : undefined;
      
      switch (entityType) {
        case 'platform': endpoint = `/api/platforms${method !== 'POST' ? `?id=${selectedEntity?.id}`: ''}`; break
        case 'task': endpoint = `/api/tasks${method !== 'POST' ? `?id=${selectedEntity?.id}`: ''}`; break
        case 'user': endpoint = `/api/users${method !== 'POST' ? `?id=${selectedEntity?.id}`: ''}`; break
      }
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body
      })
      
      if (response.ok) {
        setShowCreateModal(false)
        setShowEditModal(false)
        setShowDeleteModal(false)
        refreshData(activeTab)
      } else {
        const error = await response.json()
        alert(error.error || `Failed to ${method.toLowerCase()} entity`)
      }
    } catch (error) {
      console.error(`${method} error:`, error)
      alert(`An error occurred while trying to ${method.toLowerCase()} the entity.`)
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
      case 'students': return <StudentsTab students={students} />
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
                              />
      case 'mentorship': return <MentorshipTab 
                                bookings={mentorshipBookings} 
                                pagination={pagination.mentorship} 
                                onPageChange={(page) => handlePageChange(page, 'mentorship')} 
                                onRefresh={() => refreshData('mentorship')} 
                              />
      case 'dates': return <DatesTab />
      case 'platforms': return <PlatformsTab platforms={platforms} onEdit={handleEdit} onDelete={handleDelete} onCreate={() => handleCreate('platform')} />
      case 'tasks': return <TasksTab tasks={tasks} onEdit={handleEdit} onDelete={handleDelete} onCreate={() => handleCreate('task')} />
      case 'users': return <UsersTab users={users} onEdit={handleEdit} onCreate={() => handleCreate('user')} />
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
    </div>
  )
}

// --- CHILD COMPONENTS ---

const TabButton: FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
    {icon}
    <span className="mr-3">{label}</span>
  </button>
);

const PageHeader: FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => (
    <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 capitalize">{title}</h2>
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
};

// --- TRANSACTIONS TAB ---
interface TransactionsTabProps {
  transactions: Transaction[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

const TransactionsTab: FC<TransactionsTabProps> = ({ transactions, pagination, onPageChange, onRefresh }) => {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleStatusUpdate = async (transactionId: string, status: 'APPROVED' | 'REJECTED') => {
    setIsUpdating(transactionId);
    try {
      const response = await fetch('/api/admin/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, status }),
      });
      if (response.ok) {
        onRefresh();
      } else {
        const error = await response.json();
        alert(`فشل في تحديث المعاملة: ${error.error}`);
      }
    } catch (error) {
      console.error('Transaction update error:', error);
      alert('حدث خطأ أثناء تحديث المعاملة.');
    } finally {
      setIsUpdating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      PENDING: { label: 'في الانتظار', class: 'bg-yellow-100 text-yellow-800' },
      APPROVED: { label: 'موافق عليه', class: 'bg-green-100 text-green-800' },
      REJECTED: { label: 'مرفوض', class: 'bg-red-100 text-red-800' }
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, class: 'bg-gray-100 text-gray-800' };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  const getTypeBadge = (type: string) => {
    const typeMap = {
      TOP_UP: { label: 'شحن رصيد', class: 'bg-blue-100 text-blue-800' },
      PLATFORM_PURCHASE: { label: 'شراء منصة', class: 'bg-purple-100 text-purple-800' },
      MENTORSHIP_PAYMENT: { label: 'دفع إرشاد', class: 'bg-orange-100 text-orange-800' }
    };
    const typeInfo = typeMap[type as keyof typeof typeMap] || { label: type, class: 'bg-gray-100 text-gray-800' };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeInfo.class}`}>{typeInfo.label}</span>;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3 space-x-reverse">
          <Wallet className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">إدارة المعاملات المالية</h2>
            <p className="text-gray-600">مراجعة وإدارة جميع المعاملات المالية</p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center space-x-2 space-x-reverse bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المستخدم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">النوع</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المبلغ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">محفظة المرسل</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">محفظة الإدارة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{transaction.user.name}</div>
                      <div className="text-sm text-gray-500">{transaction.user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getTypeBadge(transaction.type)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{Number(transaction.amount).toFixed(2)} جنيه</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.senderWalletNumber || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.adminWalletNumber || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(transaction.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.createdAt).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {transaction.status === 'PENDING' && (
                      <div className="flex space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleStatusUpdate(transaction.id, 'APPROVED')}
                          disabled={isUpdating === transaction.id}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(transaction.id, 'REJECTED')}
                          disabled={isUpdating === transaction.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </div>
                    )}
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

    </div>
  );
};

// Booking Update Modal Component
interface BookingUpdateModalProps {
  booking: MentorshipBooking;
  onClose: () => void;
  onUpdate: () => void;
}

const BookingUpdateModal: FC<BookingUpdateModalProps> = ({ booking, onClose, onUpdate }) => {
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
      } else {
        const error = await response.json();
        alert(`فشل في تحديث الحجز: ${error.error}`);
      }
    } catch (error) {
      console.error('Booking update error:', error);
      alert('حدث خطأ أثناء تحديث الحجز.');
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
                <span className="font-medium mr-2">${Number(booking.amount).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">تاريخ الحجز:</span>
                <span className="font-medium mr-2">
                  {new Date(booking.createdAt).toLocaleDateString('ar-SA')}
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
                    الموعد الحالي: {new Date(booking.sessionDate).toLocaleDateString('ar-SA', {
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
}

const RecordedSessionCard: FC<RecordedSessionCardProps> = ({ onRefresh }) => {
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
      } else {
        const error = await response.json();
        alert(`خطأ في حفظ الجلسة المسجلة: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving recorded session:', error);
      alert('حدث خطأ أثناء حفظ الجلسة المسجلة');
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
                  <span className="text-2xl font-bold text-purple-600">${Number(recordedSession.price).toFixed(2)}</span>
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

const MentorshipTab: FC<MentorshipTabProps> = ({ bookings, pagination, onPageChange, onRefresh }) => {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<MentorshipBooking | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const handleStatusUpdate = async (bookingId: string, status: 'CONFIRMED' | 'CANCELLED') => {
    setIsUpdating(bookingId);
    try {
      const response = await fetch('/api/admin/mentorship', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status }),
      });
      if (response.ok) {
        onRefresh();
      } else {
        const error = await response.json();
        alert(`فشل في تحديث الحجز: ${error.error}`);
      }
    } catch (error) {
      console.error('Booking update error:', error);
      alert('حدث خطأ أثناء تحديث الحجز.');
    } finally {
      setIsUpdating(null);
    }
  };

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
      <RecordedSessionCard onRefresh={onRefresh} />
      
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
                          {new Date(booking.sessionDate).toLocaleDateString('ar-SA')}
                        </div>
                      )}
                      {booking.whatsappNumber && (
                        <div className="text-gray-500 text-xs">{booking.whatsappNumber}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${Number(booking.amount || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(booking.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(booking.createdAt).toLocaleDateString('ar-SA')}
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
                            onClick={() => handleStatusUpdate(booking.id, 'CONFIRMED')}
                            disabled={isUpdating === booking.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            title="تأكيد الحجز"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'CANCELLED')}
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
        />
      )}
    </div>
  );
};

const StatCard: FC<{ icon: React.ReactNode; title: string; value: number | string; color?: string }> = ({ icon, title, value, color = 'text-blue-500' }) => (
  <div className="bg-gray-50 p-4 rounded-lg flex items-center">
    <div className={`p-3 rounded-full bg-blue-100 ${color}`}>{icon}</div>
    <div className="mr-4">
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const StudentsTab: FC<{ students: Student[] }> = ({ students }) => (
  <>
    <PageHeader title="الطلاب" />
    <Table
      headers={['الاسم', 'البريد الإلكتروني', 'المهام المكتملة', 'متوسط الدرجات', 'تاريخ التسجيل']}
      rows={students.map(s => [
        s.name,
        s.email,
        `${s.completedTasks}/${s.totalTasks}`,
        s.averageScore?.toFixed(2) || 'N/A',
        formatDate(s.createdAt),
      ])}
    />
  </>
);

const SubmissionsTab: FC<{ 
  submissions: Submission[]; 
  pagination: { page: number; totalPages: number; total: number };
  onPageChange: (page: number) => void;
  onReview: (submission: Submission) => void;
}> = ({ submissions, pagination, onPageChange, onReview }) => (
  <>
    <PageHeader title="التقديمات" />
    <Table
      headers={['الطالب', 'المهمة', 'الحالة', 'الدرجة', 'تاريخ التقديم', 'الإجراءات']}
      rows={submissions.map(s => [
        s.user?.name || 'غير معروف',
        s.task?.title || 'غير معروف',
        <StatusBadge status={s.status} />,
        s.score ?? 'لم تقيم',
        formatDate(s.createdAt),
        <button onClick={() => onReview(s)} className="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600">مراجعة</button>
      ])}
    />
    <PaginationControl {...pagination} onPageChange={onPageChange} />
  </>
);

const PlatformsTab: FC<{ platforms: Platform[]; onEdit: (p: Platform, t: 'platform') => void; onDelete: (p: Platform, t: 'platform') => void; onCreate: () => void; }> = ({ platforms, onEdit, onDelete, onCreate }) => (
  <>
    <PageHeader title="المنصات">
      <button onClick={onCreate} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
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
        new Date(p.createdAt).toLocaleDateString('ar-EG'),
        <ActionButtons onEdit={() => onEdit(p, 'platform')} onDelete={() => onDelete(p, 'platform')} />
      ])}
    />
  </>
);

const TasksTab: FC<{ tasks: Task[]; onEdit: (t: Task, type: 'task') => void; onDelete: (t: Task, type: 'task') => void; onCreate: () => void; }> = ({ tasks, onEdit, onDelete, onCreate }) => (
  <>
    <PageHeader title="المهام">
        <button onClick={onCreate} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
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
        new Date(t.createdAt).toLocaleDateString('ar-EG'),
        <ActionButtons onEdit={() => onEdit(t, 'task')} onDelete={() => onDelete(t, 'task')} />
      ])}
    />
  </>
);

const UsersTab: FC<{ users: User[]; onEdit: (u: User, type: 'user') => void; onCreate: () => void; }> = ({ users, onEdit, onCreate }) => (
  <>
    <PageHeader title="المستخدمون">
        <button onClick={onCreate} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
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
        new Date(u.createdAt).toLocaleDateString('ar-EG'),
        <ActionButtons onEdit={() => onEdit(u, 'user')} />
      ])}
    />
  </>
);

const Table: FC<{ headers: string[]; rows: (string | number | JSX.Element)[][] }> = ({ headers, rows }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {headers.map(header => (
            <th key={header} scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {rows.length > 0 ? rows.map((row, i) => (
          <tr key={i} className="hover:bg-gray-50">
            {row.map((cell, j) => (
              <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{cell}</td>
            ))}
          </tr>
        )) : (
          <tr>
            <td colSpan={headers.length} className="px-6 py-4 text-center text-gray-500">لا توجد بيانات</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const StatusBadge: FC<{ status: 'PENDING' | 'APPROVED' | 'REJECTED' }> = ({ status }) => {
  const config = {
    PENDING: { text: 'معلق', color: 'bg-yellow-100 text-yellow-800' },
    APPROVED: { text: 'مقبول', color: 'bg-green-100 text-green-800' },
    REJECTED: { text: 'مرفوض', color: 'bg-red-100 text-red-800' },
  }
  return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config[status].color}`}>{config[status].text}</span>
};

const ActionButtons: FC<{ onEdit: () => void; onDelete?: () => void; }> = ({ onEdit, onDelete }) => (
  <div className="flex space-x-2 space-x-reverse">
    <button onClick={onEdit} className="text-indigo-600 hover:text-indigo-900">تعديل</button>
    {onDelete && <button onClick={onDelete} className="text-red-600 hover:text-red-900">حذف</button>}
  </div>
);

const PaginationControl: FC<{ page: number; totalPages: number; total: number; onPageChange: (page: number) => void; }> = ({ page, totalPages, total, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex justify-between items-center">
      <div>
        <span className="text-sm text-gray-700">
          صفحة <span className="font-medium">{page}</span> من <span className="font-medium">{totalPages}</span> ({total} إجمالي التقديمات)
        </span>
      </div>
      <div className="flex space-x-2 space-x-reverse">
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="p-2 rounded-md bg-gray-200 disabled:opacity-50">
          <ChevronRight className="h-5 w-5" />
        </button>
        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="p-2 rounded-md bg-gray-200 disabled:opacity-50">
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
}

const ReviewModal: FC<ReviewModalProps> = ({ submission, onClose, onUpdate }) => {
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
      } else {
        const error = await response.json();
        alert(`Failed to update: ${error.error}`);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('An error occurred while updating the submission.');
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-bold">مراجعة التقديم</h2>
          <button onClick={onClose}><X className="h-6 w-6" /></button>
        </div>
        <div className="space-y-4">
          <p><strong>الطالب:</strong> {submission.user?.name}</p>
          <p><strong>المهمة:</strong> {submission.task?.title}</p>
          {submission.content && <div className="p-2 bg-gray-100 rounded"><strong>المحتوى:</strong> <pre className="whitespace-pre-wrap font-sans">{submission.content}</pre></div>}
          
          <div>
            <label className="block text-sm font-medium text-gray-700">الحالة</label>
            <select value={status} onChange={e => setStatus(e.target.value as 'PENDING' | 'APPROVED' | 'REJECTED')} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
              <option value="PENDING">معلق</option>
              <option value="APPROVED">مقبول</option>
              <option value="REJECTED">مرفوض</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">الدرجة (من 100)</label>
            <input type="number" value={score} onChange={e => setScore(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ملاحظات</label>
            <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={4} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
          </div>
        </div>
        <div className="flex justify-end space-x-3 pt-4 mt-4 border-t space-x-reverse">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">إلغاء</button>
          <button onClick={handleSubmit} disabled={isUpdating} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300">
            {isUpdating ? 'جاري التحديث...' : 'تحديث'}
          </button>
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
  useEffect(() => {
    if (mode === 'edit' && entityData) {
      setFormData(entityData);
    } else {
      setFormData({});
    }
  }, [mode, entityData, setFormData]);

  const title = `${mode === 'create' ? 'إنشاء' : 'تعديل'} ${{
    platform: 'منصة',
    task: 'مهمة',
    user: 'مستخدم'
  }[entityType]}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  }

  const renderFields = () => {
    switch (entityType) {
      case 'platform':
        return (
          <>
            <InputField name="name" label="الاسم" value={formData.name || ''} onChange={handleChange} />
            <InputField name="url" label="الرابط" value={formData.url || ''} onChange={handleChange} />
            <TextAreaField name="description" label="الوصف" value={formData.description || ''} onChange={handleChange} />
          </>
        );
      case 'task':
        return (
          <>
            <InputField name="title" label="العنوان" value={formData.title || ''} onChange={handleChange} />
            <SelectField name="platformId" label="المنصة" value={formData.platformId || ''} onChange={handleChange} options={platforms?.map(p => ({ value: p.id, label: p.name })) || []} />
            <InputField name="link" label="رابط المهمة" value={formData.link || ''} onChange={handleChange} />
            <InputField name="order" label="الترتيب" type="number" value={formData.order || ''} onChange={handleChange} />
            <TextAreaField name="description" label="الوصف" value={formData.description || ''} onChange={handleChange} />
          </>
        );
      case 'user':
        return (
          <>
            <InputField name="name" label="الاسم" value={formData.name || ''} onChange={handleChange} />
            <InputField name="email" label="البريد الإلكتروني" type="email" value={formData.email || ''} onChange={handleChange} />
            {mode === 'create' && <InputField name="password" label="كلمة المرور" type="password" value={formData.password || ''} onChange={handleChange} />}
            <SelectField name="role" label="الدور" value={formData.role || ''} onChange={handleChange} options={[{value: 'STUDENT', label: 'طالب'}, {value: 'ADMIN', label: 'مدير'}]} />
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
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">إلغاء</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">حفظ</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const InputField: FC<{ name: string, label: string, value: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string }> = ({ name, label, value, onChange, type = 'text' }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input type={type} name={name} value={value} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
  </div>
);

const TextAreaField: FC<{ name: string, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void }> = ({ name, label, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <textarea name={name} value={value} onChange={onChange} rows={4} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
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

const DatesTab: FC = () => {
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

  // Handle deleting a time slot
  const handleDeleteTimeSlot = async (dateId: string) => {
    try {
      const response = await fetch(`/api/admin/available-dates?id=${dateId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete time slot')
      }
    } catch (error) {
      console.error('Error deleting time slot:', error)
      throw error
    }
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
              آخر تحديث: {new Date().toLocaleString('ar-SA')}
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

const SelectField: FC<{ name: string, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: {value: string, label: string}[] }> = ({ name, label, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <select name={name} value={value} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required>
      <option value="">اختر...</option>
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  </div>
);

interface DeleteConfirmationModalProps {
  entityType: string;
  entityName: string;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmationModal: FC<DeleteConfirmationModalProps> = ({ entityType, entityName, onClose, onConfirm }) => {
  const typeMap: { [key: string]: string } = {
    platform: 'المنصة',
    task: 'المهمة',
    user: 'المستخدم'
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-auto">
        <h3 className="text-lg font-bold text-gray-900">تأكيد الحذف</h3>
        <div className="mt-2">
          <p className="text-sm text-gray-600">
            هل أنت متأكد أنك تريد حذف {typeMap[entityType] || 'العنصر'} "{entityName}"؟ لا يمكن التراجع عن هذا الإجراء.
          </p>
        </div>
        <div className="mt-6 flex justify-end space-x-3 space-x-reverse">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
            إلغاء
          </button>
          <button type="button" onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
            حذف
          </button>
        </div>
      </div>
    </div>
  );
};
