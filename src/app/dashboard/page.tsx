'use client'

import { useState, useEffect, useCallback, FC, ReactNode } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { BookOpen, Clock, CheckCircle, Upload, X, FileText, Trophy, LogOut, RefreshCw, Star, TrendingUp, Award } from 'lucide-react'

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50" dir="rtl">
      <DashboardHeader userName={session?.user?.name || ''} onRefresh={handleRefresh} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isContentLoading ? (
          <div className="text-center py-16"><div className="loader h-12 w-12 mx-auto"></div></div>
        ) : (
          <>
            <StatsSection stats={stats} />
            <div className="space-y-12 mt-10">
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
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-100">
    <div className="text-center">
      <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-32 w-32 mb-4 mx-auto"></div>
      <h2 className="text-2xl font-semibold text-gray-700">جاري التحميل...</h2>
      <p className="text-gray-500">يتم تجهيز لوحة التحكم الخاصة بك.</p>
    </div>
  </div>
);

const DashboardHeader: FC<{ userName: string; onRefresh: () => void; }> = ({ userName, onRefresh }) => (
  <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-40">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center py-4">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
            <BookOpen className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">لوحة التعلم</h1>
            <p className="text-sm text-gray-500">أهلاً بك مجدداً، <span className="font-semibold text-gray-700">{userName}</span>!</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
            <button onClick={onRefresh} className="p-2 text-gray-600 hover:bg-gray-200/80 rounded-full transition-colors"><RefreshCw className="h-5 w-5" /></button>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center space-x-2 space-x-reverse bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-px text-sm font-medium"
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
      <StatCard icon={<FileText />} title="إجمالي التسليمات" value={stats.totalSubmissions} color="blue" />
      <StatCard icon={<CheckCircle />} title="المقبولة" value={stats.approvedSubmissions} color="green" />
      <StatCard icon={<Clock />} title="قيد المراجعة" value={stats.pendingSubmissions} color="yellow" />
      <StatCard icon={<Trophy />} title="متوسط الدرجات" value={stats.averageScore ? `${stats.averageScore.toFixed(1)}%` : 'N/A'} color="purple" />
    </div>
  );
}

const StatCard: FC<{ icon: ReactNode; title: string; value: number | string; color: 'blue' | 'green' | 'yellow' | 'purple' }> = ({ icon, title, value, color }) => {
  const colors = {
    blue: 'from-blue-400 to-blue-600',
    green: 'from-green-400 to-green-600',
    yellow: 'from-yellow-400 to-yellow-600',
    purple: 'from-purple-400 to-purple-600',
  };

  return (
    <div className={`bg-white p-5 rounded-xl shadow-md flex items-center transition-all duration-300 hover:shadow-lg hover:scale-105`}>
      <div className={`p-3 rounded-lg bg-gradient-to-br ${colors[color]} text-white shadow-sm`}>{icon}</div>
      <div className="mr-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

const PlatformCard: FC<{ platform: Platform; onTaskClick: (task: Task) => void }> = ({ platform, onTaskClick }) => (
  <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
      <h2 className="text-xl font-bold text-gray-800">{platform.name}</h2>
      <p className="text-sm text-gray-600 mt-1">{platform.description}</p>
    </div>
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
  const difficultyColors = {
    EASY: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HARD: 'bg-red-100 text-red-800',
  };

  return (
    <div onClick={onClick} className="bg-gray-50 border border-gray-200/80 rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:border-blue-400 hover:scale-105 cursor-pointer group">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{task.title}</h3>
        <StatusIcon className={`h-5 w-5 transition-colors ${taskStatus.color}`} />
      </div>
      <p className="text-sm text-gray-500 mb-4 line-clamp-2 h-10">{task.description}</p>
      <div className="flex justify-between items-center text-xs pt-3 border-t border-gray-200">
        <span className={`px-2.5 py-1 rounded-full font-medium ${difficultyColors[task.difficulty]}`}>
          {difficultyMap[task.difficulty]}
        </span>
        <span className={`font-medium ${taskStatus.color}`}>{taskStatus.text}</span>
      </div>
    </div>
  );
};

const getTaskStatus = (task: Task) => {
  const submission = task.submissions?.[0];
  if (submission?.status === 'APPROVED') return { status: 'completed', color: 'text-green-500', icon: CheckCircle, text: 'مكتمل' };
  if (submission?.status === 'PENDING') return { status: 'pending', color: 'text-yellow-500', icon: Clock, text: 'قيد المراجعة' };
  if (submission?.status === 'REJECTED') return { status: 'rejected', color: 'text-red-500', icon: X, text: 'مرفوض' };
  return { status: 'not_started', color: 'text-gray-400', icon: Star, text: 'لم يبدأ' };
};

interface SubmissionModalProps {
  task: Task;
  onClose: () => void;
  onSuccess: () => void;
}

const SubmissionModal: FC<SubmissionModalProps> = ({ task, onClose, onSuccess }) => {
  const [summary, setSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-lg m-4 animate-scale-in">
        <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-5">
          <h2 className="text-2xl font-bold text-gray-800">تقديم الحل: <span className="text-blue-600">{task.title}</span></h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-7 w-7" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {task.link && 
            <a href={task.link} target="_blank" rel="noopener noreferrer" className="inline-block text-blue-600 hover:underline font-medium">
              عرض رابط المهمة
            </a>
          }
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="اكتب ملخص الحل أو رابط المشروع هنا..."
            className="w-full h-36 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-shadow"
            rows={6}
            required
          />
          <div className="flex justify-end space-x-4 pt-4 mt-4 border-t border-gray-200 space-x-reverse">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">إلغاء</button>
            <button type="submit" disabled={isSubmitting || !summary} className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:shadow-lg hover:from-blue-600 hover:to-purple-700 disabled:bg-gray-300 disabled:from-gray-300 disabled:to-gray-400 transition-all transform hover:scale-105">
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال الحل'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
