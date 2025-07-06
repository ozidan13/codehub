'use client'

import { useState, useEffect, useCallback, FC } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { BookOpen, Clock, CheckCircle, Upload, X, FileText, Trophy, LogOut, RefreshCw } from 'lucide-react'

// --- INTERFACES ---
interface Platform {
  id: string
  name: string
  description: string
  tasks: Task[]
}

interface Task {
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

interface Submission {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  score?: number
  feedback?: string
  createdAt: string
}

interface StudentStats {
  totalSubmissions: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  averageScore: number | null;
}

// --- CACHE IMPLEMENTATION ---
class DataCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  
  set(key: string, data: any, ttl: number = 5 * 60 * 1000) { // 5 minutes default
    this.cache.set(key, { data, timestamp: Date.now(), ttl })
  }
  
  get(key: string) {
    const item = this.cache.get(key)
    if (!item || Date.now() - item.timestamp > item.ttl) {
      if (item) this.cache.delete(key)
      return null
    }
    return item.data
  }
  
  clear() {
    this.cache.clear()
  }
}

const dataCache = new DataCache()

// --- MAIN DASHBOARD PAGE COMPONENT ---
export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // --- STATE MANAGEMENT ---
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [isContentLoading, setIsContentLoading] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)

  // --- DATA FETCHING ---
  const fetchData = useCallback(async () => {
    if (status !== 'authenticated') return;
    setIsContentLoading(true);
    try {
      const cachedPlatforms = dataCache.get('platforms');
      const cachedStats = dataCache.get('student-stats');
      
      if (cachedPlatforms && cachedStats) {
        setPlatforms(cachedPlatforms);
        setStats(cachedStats);
      } else {
        const [platformsRes, statsRes] = await Promise.all([
          fetch('/api/platforms?include_tasks=true'),
          fetch('/api/dashboard/student-stats')
        ]);
        
        if (platformsRes.ok) {
          const data = await platformsRes.json();
          setPlatforms(data.platforms || []);
          dataCache.set('platforms', data.platforms || []);
        }
        
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
          dataCache.set('student-stats', data);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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
    if (session?.user?.role === 'ADMIN') {
      router.push('/admin');
      return;
    }
    setIsPageLoading(false);
  }, [session, status, router]);

  useEffect(() => {
    if (!isPageLoading) {
      fetchData();
    }
  }, [isPageLoading, fetchData]);

  // --- HANDLERS ---
  const handleRefresh = () => {
    dataCache.clear();
    fetchData();
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowSubmissionModal(true);
  }

  const handleSubmissionSuccess = () => {
    setShowSubmissionModal(false);
    handleRefresh();
  }

  // --- RENDER LOGIC ---
  if (isPageLoading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <DashboardHeader userName={session?.user?.name || ''} onRefresh={handleRefresh} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isContentLoading ? (
          <div className="text-center py-16"><div className="loader h-12 w-12 mx-auto"></div></div>
        ) : (
          <>
            <StatsSection stats={stats} />
            <div className="space-y-8 mt-8">
              {platforms.map((platform) => (
                <PlatformCard key={platform.id} platform={platform} onTaskClick={handleTaskClick} />
              ))}
            </div>
          </>
        )}
      </main>

      {showSubmissionModal && selectedTask && (
        <SubmissionModal 
          task={selectedTask} 
          onClose={() => setShowSubmissionModal(false)} 
          onSuccess={handleSubmissionSuccess} 
        />
      )}
    </div>
  )
}

// --- CHILD COMPONENTS ---

const PageLoader: FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-100">
    <div className="text-center">
      <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-32 w-32 mb-4 mx-auto"></div>
      <h2 className="text-2xl font-semibold text-gray-700">جاري التحميل...</h2>
      <p className="text-gray-500">يتم تجهيز لوحة التحكم الخاصة بك.</p>
    </div>
  </div>
);

const DashboardHeader: FC<{ userName: string; onRefresh: () => void; }> = ({ userName, onRefresh }) => (
  <header className="bg-white shadow-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center py-4">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">لوحة التعلم</h1>
            <p className="text-sm text-gray-500">أهلاً بك مجدداً، {userName}!</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
            <button onClick={onRefresh} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><RefreshCw className="h-5 w-5" /></button>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center space-x-2 space-x-reverse bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <LogOut className="h-4 w-4" />
              <span>تسجيل الخروج</span>
            </button>
        </div>
      </div>
    </div>
  </header>
);

const StatsSection: FC<{ stats: StudentStats | null }> = ({ stats }) => {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard icon={<FileText />} title="إجمالي التسليمات" value={stats.totalSubmissions} />
      <StatCard icon={<CheckCircle />} title="المقبولة" value={stats.approvedSubmissions} color="text-green-500" />
      <StatCard icon={<Clock />} title="قيد المراجعة" value={stats.pendingSubmissions} color="text-yellow-500" />
      <StatCard icon={<Trophy />} title="متوسط الدرجات" value={stats.averageScore ? `${stats.averageScore.toFixed(1)}%` : 'N/A'} color="text-purple-500" />
    </div>
  );
}

const StatCard: FC<{ icon: React.ReactNode; title: string; value: number | string; color?: string }> = ({ icon, title, value, color = 'text-blue-500' }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm flex items-center">
    <div className={`p-2 rounded-lg bg-gray-100 ${color}`}>{icon}</div>
    <div className="mr-4">
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const PlatformCard: FC<{ platform: Platform; onTaskClick: (task: Task) => void }> = ({ platform, onTaskClick }) => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
    <div className="p-5 border-b border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800">{platform.name}</h2>
      <p className="text-sm text-gray-500 mt-1">{platform.description}</p>
    </div>
    <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {platform.tasks.map((task) => (
        <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
      ))}
    </div>
  </div>
);

const TaskCard: FC<{ task: Task; onClick: () => void }> = ({ task, onClick }) => {
  const taskStatus = getTaskStatus(task);
  const StatusIcon = taskStatus.icon;
  const difficultyMap = { EASY: 'سهل', MEDIUM: 'متوسط', HARD: 'صعب' };

  return (
    <div onClick={onClick} className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-500 transition-all cursor-pointer">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-800">{task.title}</h3>
        <StatusIcon className={`h-5 w-5 ${taskStatus.color === 'green' ? 'text-green-500' : taskStatus.color === 'yellow' ? 'text-yellow-500' : taskStatus.color === 'red' ? 'text-red-500' : 'text-gray-400'}`} />
      </div>
      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{task.description}</p>
      <div className="flex justify-between items-center text-xs">
        <span className={`px-2 py-1 rounded-full font-medium ${task.difficulty === 'EASY' ? 'bg-green-100 text-green-800' : task.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
          {difficultyMap[task.difficulty]}
        </span>
        <span className="text-gray-500">{taskStatus.text}</span>
      </div>
    </div>
  );
};

const getTaskStatus = (task: Task) => {
  const submission = task.submissions?.[0];
  if (submission?.status === 'APPROVED') return { status: 'completed', color: 'green', icon: CheckCircle, text: 'مكتمل' };
  if (submission?.status === 'PENDING') return { status: 'pending', color: 'yellow', icon: Clock, text: 'قيد المراجعة' };
  if (submission?.status === 'REJECTED') return { status: 'rejected', color: 'red', icon: X, text: 'مرفوض' };
  return { status: 'not_started', color: 'gray', icon: Clock, text: 'لم يبدأ' };
};

interface SubmissionModalProps {
  task: Task;
  onClose: () => void;
  onSuccess: () => void;
}

const SubmissionModal: FC<SubmissionModalProps> = ({ task, onClose, onSuccess }) => {
  const [summary, setSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id, summary }),
      });
      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(`فشل الإرسال: ${error.error}`);
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('حدث خطأ أثناء إرسال الحل.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-bold">تقديم الحل: {task.title}</h2>
          <button onClick={onClose}><X className="h-6 w-6" /></button>
        </div>
        <div className="space-y-4">
          {task.link && <a href={task.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">عرض رابط المهمة</a>}
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="اكتب ملخص الحل أو رابط المشروع هنا..."
            className="w-full h-32 p-2 border border-gray-300 rounded-md"
            rows={5}
          />
        </div>
        <div className="flex justify-end space-x-3 pt-4 mt-4 border-t space-x-reverse">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">إلغاء</button>
          <button onClick={handleSubmit} disabled={isSubmitting || !summary} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300">
            {isSubmitting ? 'جاري الإرسال...' : 'إرسال الحل'}
          </button>
        </div>
      </div>
    </div>
  );
};
