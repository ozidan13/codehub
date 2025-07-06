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
  RefreshCw
} from 'lucide-react'

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
}

interface Platform {
  id: string
  name: string
  description: string
  url: string
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

interface AdminStats {
  totalUsers: number
  totalStudents: number
  totalSubmissions: number
  pendingSubmissions: number
  totalPlatforms?: number
  platformStats: {
    platformId: string
    platformName: string
    totalTasks: number
    totalSubmissions: number
  }[]
}

// --- CACHE IMPLEMENTATION ---
class DataCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  
  set(key: string, data: any, ttl: number = 5 * 60 * 1000) { // 5 minutes default
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
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'submissions' | 'platforms' | 'tasks' | 'users'>('overview')
  
  // --- STATE MANAGEMENT ---
  const [overviewStats, setOverviewStats] = useState<AdminStats | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])

  const [isPageLoading, setIsPageLoading] = useState(true)
  const [isContentLoading, setIsContentLoading] = useState(false)

  // Modals and selected entities
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState<any>(null)
  const [entityType, setEntityType] = useState<'platform' | 'task' | 'user'>('platform')
  const [formData, setFormData] = useState<FormData>({})

  const [pagination, setPagination] = useState<Record<string, { page: number; limit: number; total: number; totalPages: number; }>>({
    submissions: { page: 1, limit: 10, total: 0, totalPages: 1 },
  });

  // --- DATA FETCHING ---
  const fetchAdminData = useCallback(async (tab: string, page: number = 1) => {
    if (status !== 'authenticated') return;
    setIsContentLoading(true);
    try {
      const cacheKey = `admin-${tab}-${page}`;
      const cachedData = dataCache.get(cacheKey);

      if (cachedData) {
        if (tab === 'overview') setOverviewStats(cachedData);
        else if (tab === 'students') setStudents(cachedData);
        else if (tab === 'submissions') {
          setSubmissions(cachedData.submissions || []);
          setPagination(prev => ({ ...prev, submissions: cachedData.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 } }));
        }
        else if (tab === 'platforms') setPlatforms(cachedData);
        else if (tab === 'tasks') setTasks(cachedData);
        else if (tab === 'users') setUsers(cachedData);
        setIsContentLoading(false);
        return;
      }

      let response;
      switch (tab) {
        case 'overview':
          response = await fetch('/api/dashboard/stats');
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
            const formattedStudents = data.users.map((user: any) => ({
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
      router.push('/dashboard');
      return;
    }
    setIsPageLoading(false);
  }, [session, status, router]);

  useEffect(() => {
    if (!isPageLoading) {
        fetchAdminData(activeTab, pagination.submissions.page);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPageLoading, activeTab, pagination.submissions.page]);

  // --- HANDLERS ---
  const refreshData = (tab: string) => {
    const page = tab === 'submissions' ? pagination.submissions.page : 1;
    dataCache.clear(); // Consider more granular cache invalidation
    fetchAdminData(tab, page);
  }

  const handleTabChange = (tab: 'overview' | 'students' | 'submissions' | 'platforms' | 'tasks' | 'users') => {
    setActiveTab(tab);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.submissions.totalPages) {
      setPagination(prev => ({ ...prev, submissions: { ...prev.submissions, page: newPage } }));
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

  const handleEdit = (entity: any, type: 'platform' | 'task' | 'user') => {
    setSelectedEntity(entity)
    setEntityType(type)
    setFormData(entity)
    setShowEditModal(true)
  }

  const handleDelete = (entity: any, type: 'platform' | 'task' | 'user') => {
    setSelectedEntity(entity)
    setEntityType(type)
    setShowDeleteModal(true)
  }

  const submitForm = async (method: 'POST' | 'PUT' | 'DELETE') => {
    try {
      let endpoint = ''
      let body = method !== 'DELETE' ? JSON.stringify(formData) : undefined;
      
      switch (entityType) {
        case 'platform': endpoint = `/api/platforms${method !== 'POST' ? `/${selectedEntity.id}`: ''}`; break
        case 'task': endpoint = `/api/tasks${method !== 'POST' ? `/${selectedEntity.id}`: ''}`; break
        case 'user': endpoint = `/api/users${method !== 'POST' ? `?id=${selectedEntity.id}`: ''}`; break
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
                                onPageChange={handlePageChange} 
                                onReview={handleReviewSubmission} 
                              />
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
          entityName={selectedEntity.name || selectedEntity.title || ''}
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
        new Date(s.createdAt).toLocaleDateString('ar-EG'),
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
        new Date(s.createdAt).toLocaleDateString('ar-EG'),
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
            <select value={status} onChange={e => setStatus(e.target.value as any)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
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
  entityData?: any;
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

const InputField: FC<{ name: string, label: string, value: string | number, onChange: any, type?: string }> = ({ name, label, value, onChange, type = 'text' }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input type={type} name={name} value={value} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
  </div>
);

const TextAreaField: FC<{ name: string, label: string, value: string, onChange: any }> = ({ name, label, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <textarea name={name} value={value} onChange={onChange} rows={4} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
  </div>
);

const SelectField: FC<{ name: string, label: string, value: string, onChange: any, options: {value: string, label: string}[] }> = ({ name, label, value, onChange, options }) => (
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
