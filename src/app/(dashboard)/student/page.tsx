'use client'

import { useState, useEffect, useCallback, FC, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  BookOpen, Clock, CheckCircle, X, FileText, Trophy, RefreshCw, Star, 
  Wallet, CreditCard, ShoppingCart, TrendingUp, Award, Target, 
  BarChart3, Activity, Zap, Calendar, Users, Play, XCircle,
  ArrowUp, ArrowDown, Sparkles, GraduationCap, Medal
} from 'lucide-react'

import { formatDate, formatDateTime, formatTimeRange } from '@/lib/dateUtils';
import { Platform, Task, Submission, StudentStats, WalletData, Enrollment, Transaction } from '@/types';

// --- INTERFACES ---


// --- CACHE IMPLEMENTATION ---
class DataCache {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>()
  
  set(key: string, data: unknown, ttl: number = 5 * 60 * 1000) { // 5 minutes default
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
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const [isPageLoading, setIsPageLoading] = useState(true)
  const [isContentLoading, setIsContentLoading] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)
  

  // --- DATA FETCHING ---
  const fetchData = useCallback(async () => {
    if (status !== 'authenticated') return;
    setIsContentLoading(true);
    try {
      const [platformsRes, statsRes, walletRes, enrollmentsRes, transactionsRes] = await Promise.all([
        fetch('/api/platforms?include_tasks=true'),
        fetch('/api/student/stats'),
        fetch('/api/wallet'),
        fetch('/api/enrollments'),
        fetch('/api/transactions?limit=5')
      ]);
      
      if (platformsRes.ok) {
        const data = await platformsRes.json();
        setPlatforms(data.platforms || []);
      }
      
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      if (walletRes.ok) {
        const data = await walletRes.json();
        setWallet(data);
      }

      if (enrollmentsRes.ok) {
        const data = await enrollmentsRes.json();
        setEnrollments(data.enrollments || []);
      }

      if (transactionsRes.ok) {
        const data = await transactionsRes.json();
        setTransactions(data.transactions || []);
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

  const handleTopUpSuccess = () => {
    handleRefresh();
  }

  const handleEnrollmentSuccess = () => {
    handleRefresh();
  }

  



// --- RENDER LOGIC ---
  if (isPageLoading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" dir="rtl">
      <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Enhanced Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4 space-x-reverse">
              <div className="relative">
                <div className="h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                  <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 h-4 w-4 sm:h-6 sm:w-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Sparkles className="h-2 w-2 sm:h-3 sm:w-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  لوحة التعلم الذكية
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1">
                  أهلاً بك مجدداً، <span className="font-bold text-blue-600">{session?.user?.name || 'الطالب'}</span>! 🎯
                </p>
                <div className="flex items-center space-x-2 space-x-reverse mt-1 sm:mt-2">
                  <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 font-medium">متصل الآن</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse">
              <button 
                onClick={handleRefresh} 
                className="group relative p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 ${isContentLoading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                <div className="absolute inset-0 bg-white/20 rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </div>
        
        {isContentLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="relative">
                <div className="h-16 w-16 mx-auto mb-4">
                  <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">جاري تحميل البيانات...</h3>
              <p className="text-gray-500">يتم تجهيز المحتوى الخاص بك</p>
            </div>
          </div>
        ) : (
          <>
            <StatsSection stats={stats} />
            <ExpirationNotifications enrollments={enrollments} />
            <WalletSection wallet={wallet} onTopUp={handleTopUpSuccess} />
            
            {/* Enhanced Platforms Section */}
            <div className="space-y-6">
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                  منصات التعلم المتاحة
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">اختر المنصة التي تريد التعلم منها وابدأ رحلتك التعليمية</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4 lg:gap-6">
                {platforms.map((platform, index) => (
                  <div 
                    key={platform.id} 
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <PlatformCard 
                      platform={platform} 
                      enrollments={enrollments} 
                      onTaskClick={handleTaskClick} 
                      onEnrollmentSuccess={handleEnrollmentSuccess} 
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

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

// RecentTransactions component moved to /student/recenttransactions/page.tsx

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

// DashboardHeader component removed - now handled by layout.tsx

const StatsSection: FC<{ stats: StudentStats | null }> = ({ stats }) => {
  if (!stats) return null;
  
  const totalTasks = stats.totalSubmissions;
  const completionRate = totalTasks > 0 ? (stats.approvedSubmissions / totalTasks) * 100 : 0;
  const averageScore = stats.averageScore ? Number(stats.averageScore) : 0;
  
  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <EnhancedStatCard 
          icon={<FileText />} 
          title="إجمالي التسليمات" 
          value={stats.totalSubmissions} 
          color="blue"
          trend={stats.totalSubmissions > 0 ? 'up' : 'neutral'}
          subtitle="مهمة مكتملة"
        />
        <EnhancedStatCard 
          icon={<CheckCircle />} 
          title="المقبولة" 
          value={stats.approvedSubmissions} 
          color="green"
          trend={stats.approvedSubmissions > 0 ? 'up' : 'neutral'}
          subtitle="تم قبولها"
          progress={completionRate}
        />
        <EnhancedStatCard 
          icon={<Clock />} 
          title="قيد المراجعة" 
          value={stats.pendingSubmissions} 
          color="yellow"
          trend={stats.pendingSubmissions > 0 ? 'up' : 'neutral'}
          subtitle="في انتظار المراجعة"
        />
        <EnhancedStatCard 
          icon={<Trophy />} 
          title="متوسط الدرجات" 
          value={averageScore > 0 ? `${averageScore.toFixed(1)}%` : 'لا يوجد'} 
          color="purple"
          trend={averageScore >= 70 ? 'up' : averageScore >= 50 ? 'neutral' : 'down'}
          subtitle="من إجمالي الدرجات"
          progress={averageScore}
        />
      </div>
      
      {/* Progress Overview */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            <span className="hidden sm:inline">نظرة عامة على الأداء</span>
            <span className="sm:hidden">الأداء</span>
          </h3>
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600">
            <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">تحديث مباشر</span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {/* Completion Rate */}
          <div className="text-center">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 sm:mb-3">
              <svg className="w-16 h-16 sm:w-20 sm:h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-200"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-green-500"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${completionRate}, 100`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm sm:text-lg font-bold text-gray-800">{completionRate.toFixed(0)}%</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-700">معدل الإنجاز</p>
            <p className="text-xs text-gray-500 hidden sm:block">من المهام المقبولة</p>
          </div>
          
          {/* Average Score */}
          <div className="text-center">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 sm:mb-3">
              <svg className="w-16 h-16 sm:w-20 sm:h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-200"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`${averageScore >= 70 ? 'text-green-500' : averageScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${averageScore}, 100`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm sm:text-lg font-bold text-gray-800">{averageScore.toFixed(0)}</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-700">متوسط الدرجات</p>
            <p className="text-xs text-gray-500 hidden sm:block">من 100 درجة</p>
          </div>
          
          {/* Performance Level */}
          <div className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 sm:mb-3 flex items-center justify-center">
              {averageScore >= 90 ? (
                <div className="relative">
                  <Medal className="h-8 w-8 sm:h-12 sm:w-12 text-yellow-500" />
                  <Sparkles className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 animate-pulse" />
                </div>
              ) : averageScore >= 70 ? (
                <Award className="h-8 w-8 sm:h-12 sm:w-12 text-green-500" />
              ) : averageScore >= 50 ? (
                <Target className="h-8 w-8 sm:h-12 sm:w-12 text-yellow-500" />
              ) : (
                <TrendingUp className="h-8 w-8 sm:h-12 sm:w-12 text-blue-500" />
              )}
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-700">
              {averageScore >= 90 ? 'ممتاز' : averageScore >= 70 ? 'جيد جداً' : averageScore >= 50 ? 'جيد' : 'يحتاج تحسين'}
            </p>
            <p className="text-xs text-gray-500 hidden sm:block">مستوى الأداء</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const EnhancedStatCard: FC<{ 
  icon: ReactNode; 
  title: string; 
  value: number | string; 
  color: 'blue' | 'green' | 'yellow' | 'purple';
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  progress?: number;
}> = ({ icon, title, value, color, trend = 'neutral', subtitle, progress }) => {
  const colors = {
    blue: {
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200'
    },
    green: {
      gradient: 'from-green-500 to-green-600',
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200'
    },
    yellow: {
      gradient: 'from-yellow-500 to-yellow-600',
      bg: 'bg-yellow-50',
      text: 'text-yellow-600',
      border: 'border-yellow-200'
    },
    purple: {
      gradient: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200'
    },
  };

  const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Activity;
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400';

  return (
    <div className={`group relative bg-white/80 backdrop-blur-sm p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl shadow-lg border ${colors[color].border} transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2 sm:mb-3 lg:mb-4">
          <div className={`p-2 sm:p-2.5 lg:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br ${colors[color].gradient} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <div className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6">{icon}</div>
          </div>
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs font-medium hidden sm:inline">
              {trend === 'up' ? 'متزايد' : trend === 'down' ? 'متناقص' : 'ثابت'}
            </span>
          </div>
        </div>
        
        <div className="space-y-1 sm:space-y-2">
          <h3 className="text-xs sm:text-sm font-medium text-gray-600 leading-tight">{title}</h3>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
            <span className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800">{value}</span>
            {subtitle && <span className="text-xs text-gray-500 hidden sm:inline">{subtitle}</span>}
          </div>
          
          {/* Progress Bar */}
          {progress !== undefined && (
            <div className="mt-2 sm:mt-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span className="hidden sm:inline">التقدم</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${colors[color].gradient} rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Glow Effect */}
      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-br ${colors[color].gradient} blur-xl`}></div>
    </div>
  );
}

const WalletSection: FC<{ wallet: WalletData | null; onTopUp: () => void }> = ({ wallet, onTopUp }) => {
  const { data: session } = useSession();
  const [showTopUpForm, setShowTopUpForm] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  if (!wallet) return null;
  
  const balance = Number(wallet.balance);
  
  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topUpAmount || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(topUpAmount) })
      });
      
      if (response.ok) {
        setTopUpAmount('');
        setShowTopUpForm(false);
        onTopUp(); // Refresh wallet data
      }
    } catch (error) {
      console.error('Top-up failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-8 rounded-3xl text-white shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] mt-8">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-1000"></div>
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12 group-hover:scale-125 transition-transform duration-1000 delay-200"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white rounded-full group-hover:scale-110 transition-transform duration-1000 delay-100"></div>
      </div>
      
      {/* Glowing Border Effect */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm group-hover:bg-white/30 transition-colors duration-300">
              <Wallet className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">المحفظة الإلكترونية</h3>
              <p className="text-white/80 text-sm">الرصيد المتاح للاستخدام</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-white/60">
            <Activity className="h-4 w-4 animate-pulse" />
            <span className="text-xs font-medium">نشط</span>
          </div>
        </div>
        
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-bold tracking-tight">{balance.toLocaleString()}</span>
              <span className="text-lg font-medium text-white/80">جنية</span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">متاح للاستخدام الفوري</span>
            </div>
          </div>
          
          <button
            onClick={() => setShowTopUpForm(!showTopUpForm)}
            className="group/btn relative overflow-hidden bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg border border-white/30 hover:border-white/50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center gap-2">
              <Zap className="h-4 w-4 group-hover/btn:rotate-12 transition-transform duration-300" />
              <span>{showTopUpForm ? 'إخفاء الشحن' : 'شحن الرصيد'}</span>
            </div>
          </button>
        </div>
        
        {/* Top-up Form */}
        {showTopUpForm && (
          <div className="mt-6 pt-6 border-t border-white/20 animate-fade-in-up">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                شحن الرصيد
              </h4>
              
              <div className="space-y-4 mb-6">
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-sm text-white/80 mb-2">رقم المحفظة للتحويل إليها:</p>
                  <p className="text-xl font-bold font-mono">01026454497</p>
                  <p className="text-xs text-white/70 mt-1">قم بتحويل المبلغ من رقمك المسجل إلى هذا الرقم</p>
                </div>
                
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-sm text-white/80 mb-2">رقمك المسجل:</p>
                  <p className="text-lg font-bold font-mono">{session?.user?.phoneNumber || 'غير محدد'}</p>
                  <p className="text-xs text-white/70 mt-1">تأكد من التحويل من هذا الرقم</p>
                </div>
              </div>
              
              <form onSubmit={handleTopUpSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    المبلغ (جنيه مصري)
                  </label>
                  <input
                    type="number"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    placeholder="أدخل المبلغ"
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-300"
                    required
                    min="1"
                    step="0.01"
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || !topUpAmount}
                    className="flex-1 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 disabled:hover:scale-100 border border-white/30 hover:border-white/50"
                  >
                    {isSubmitting ? 'جاري الإرسال...' : 'تأكيد الشحن'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setShowTopUpForm(false);
                      setTopUpAmount('');
                    }}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all duration-300 border border-white/20 hover:border-white/30"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Balance Status Indicator */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-white/70">
              <div className={`w-2 h-2 rounded-full ${balance > 100 ? 'bg-green-400' : balance > 50 ? 'bg-yellow-400' : 'bg-red-400'} animate-pulse`}></div>
              <span>
                {balance > 100 ? 'رصيد ممتاز' : balance > 50 ? 'رصيد جيد' : 'رصيد منخفض'}
              </span>
            </div>
            <div className="text-white/60">
              آخر تحديث: الآن
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


const ExpirationNotifications: FC<{ enrollments: Enrollment[] }> = ({ enrollments }) => {
  const expiredEnrollments = enrollments.filter(e => e.status === 'expired');
  const expiringSoonEnrollments = enrollments.filter(e => e.status === 'expiring_soon');
  
  if (expiredEnrollments.length === 0 && expiringSoonEnrollments.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-4 mb-8">
      {expiredEnrollments.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 space-x-reverse mb-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-800">اشتراكات منتهية الصلاحية</h3>
          </div>
          <p className="text-sm text-red-700 mb-3">
            لديك {expiredEnrollments.length} اشتراك منتهي الصلاحية. يرجى التجديد للوصول إلى المحتوى.
          </p>
          <div className="flex flex-wrap gap-2">
            {expiredEnrollments.map(enrollment => (
              <span key={enrollment.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {enrollment.platform.name}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {expiringSoonEnrollments.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 space-x-reverse mb-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-800">اشتراكات تنتهي قريباً</h3>
          </div>
          <p className="text-sm text-yellow-700 mb-3">
            لديك {expiringSoonEnrollments.length} اشتراك ينتهي خلال 7 أيام. فكر في التجديد المبكر.
          </p>
          <div className="flex flex-wrap gap-2">
            {expiringSoonEnrollments.map(enrollment => (
              <span key={enrollment.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {enrollment.platform.name} - {enrollment.daysRemaining} أيام
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Mentorship components moved to /student/mentorship/page.tsx


const PlatformCard: FC<{ platform: Platform; enrollments: Enrollment[]; onTaskClick: (task: Task) => void; onEnrollmentSuccess: () => void }> = ({ platform, enrollments, onTaskClick, onEnrollmentSuccess }) => {
  const enrollment = enrollments.find(e => e.platform.id === platform.id);
  const isEnrolled = !!enrollment;
  const isActive = enrollment && enrollment.status !== 'expired';
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);

  const handleRenewEnrollment = async () => {
    if (!enrollment) return;
    
    setIsRenewing(true);
    try {
      const response = await fetch('/api/enrollments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId: enrollment.id }),
      });
      
      if (response.ok) {
        onEnrollmentSuccess();
      } else {
        const error = await response.json();
        alert(error.error || 'فشل في تجديد الاشتراك');
      }
    } catch (error) {
      console.error('Renewal error:', error);
      alert('حدث خطأ أثناء تجديد الاشتراك');
    } finally {
      setIsRenewing(false);
    }
  };

  const handleEnroll = async () => {
    setIsEnrolling(true);
    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platformId: platform.id }),
      });
      if (response.ok) {
        onEnrollmentSuccess();
      } else {
        const error = await response.json();
        alert(`فشل الاشتراك: ${error.error}`);
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      alert('حدث خطأ أثناء الاشتراك.');
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <div className="group relative bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-xl overflow-hidden transition-all duration-500 hover:shadow-2xl border border-gray-100">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Status Indicator Bar */}
      <div className={`h-1 w-full ${
        !isEnrolled ? 'bg-gray-300' :
        enrollment?.status === 'expired' ? 'bg-gradient-to-r from-red-400 to-red-600' :
        enrollment?.status === 'expiring_soon' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
        'bg-gradient-to-r from-green-400 to-emerald-500'
      }`}></div>
      
      <div className="relative z-10 p-3 sm:p-4 lg:p-8">
        <div className="flex justify-between items-start mb-3 sm:mb-4 lg:mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className={`p-2 sm:p-2.5 lg:p-3 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg ${
                !isEnrolled ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                enrollment?.status === 'expired' ? 'bg-gradient-to-br from-red-400 to-red-600' :
                enrollment?.status === 'expiring_soon' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                'bg-gradient-to-br from-green-400 to-emerald-600'
              } text-white group-hover:scale-110 transition-transform duration-300`}>
                <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
              </div>
              <div>
                <h2 className="text-sm sm:text-lg lg:text-2xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors">{platform.name}</h2>
                <p className="text-gray-600 text-xs sm:text-sm mt-0.5 sm:mt-1 hidden sm:block">{platform.description}</p>
              </div>
            </div>
            
            {/* Enrollment Details */}
            {isEnrolled && enrollment && (
              <div className="mt-2 sm:mt-3 lg:mt-4 space-y-2 sm:space-y-3">
                {/* Expiration Date */}
                {enrollment.expiresAt && (
                  <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-3">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                    <span className="text-gray-600 hidden sm:inline">تاريخ الانتهاء:</span>
                    <span className="font-semibold text-gray-800">{formatDate(enrollment.expiresAt)}</span>
                  </div>
                )}
                
                {/* Days Remaining with Progress */}
                <div className="space-y-1 sm:space-y-2">
                  <div className={`inline-flex items-center px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-lg sm:rounded-xl lg:rounded-2xl text-xs sm:text-sm font-semibold shadow-sm ${
                    enrollment.status === 'expired' ? 'bg-red-100 text-red-800 border border-red-200' :
                    enrollment.status === 'expiring_soon' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                    'bg-green-100 text-green-800 border border-green-200'
                  }`}>
                    <Activity className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                    {enrollment.status === 'expired' ? 'منتهي الصلاحية' :
                     enrollment.status === 'expiring_soon' ? `${enrollment.daysRemaining} أيام متبقية` :
                     `${enrollment.daysRemaining} يوم متبقي`}
                  </div>
                  
                  {/* Progress Bar for Days Remaining */}
                  {enrollment.status !== 'expired' && enrollment.daysRemaining !== undefined && (
                    <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          enrollment.status === 'expiring_soon' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                          'bg-gradient-to-r from-green-400 to-emerald-500'
                        }`}
                        style={{ width: `${Math.min((enrollment.daysRemaining / 30) * 100, 100)}%` }}
                      ></div>
                    </div>
                  )}
                </div>
                
                {/* Platform URL for active enrollments */}
                {enrollment.status !== 'expired' && platform.url && (
                  <div className="mt-2 sm:mt-3">
                    <a
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/link inline-flex items-center gap-1 sm:gap-2 text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-semibold bg-blue-50 hover:bg-blue-100 px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105"
                    >
                      <span className="hidden sm:inline">زيارة المنصة</span>
                      <span className="sm:hidden">زيارة</span>
                      <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4 rotate-45 group-hover/link:rotate-12 transition-transform duration-300" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-end space-y-2 sm:space-y-3">
            {/* Price with Enhanced Design */}
            {platform.isPaid && (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg sm:rounded-xl lg:rounded-2xl blur opacity-30"></div>
                <span className="relative bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-lg sm:rounded-xl lg:rounded-2xl text-xs sm:text-sm font-bold border border-yellow-200 shadow-sm">
                  {platform.price} جنية
                </span>
              </div>
            )}
            
            {/* Enhanced Enrollment Status and Actions */}
            {!isEnrolled ? (
              <button
                onClick={handleEnroll}
                disabled={isEnrolling}
                className="group/btn relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl lg:rounded-2xl text-xs sm:text-sm lg:text-base font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-2">
                  <ShoppingCart className={`h-3 w-3 sm:h-4 sm:w-4 ${isEnrolling ? 'animate-bounce' : 'group-hover/btn:scale-110'} transition-transform duration-300`} />
                  <span className="hidden sm:inline">{isEnrolling ? 'جاري الاشتراك...' : 'اشترك الآن'}</span>
                  <span className="sm:hidden">{isEnrolling ? '...' : 'اشترك'}</span>
                </div>
              </button>
            ) : enrollment?.status === 'expired' ? (
              <button
                onClick={handleRenewEnrollment}
                disabled={isRenewing}
                className="group/btn relative overflow-hidden bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl lg:rounded-2xl text-xs sm:text-sm lg:text-base font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:from-gray-400 disabled:to-gray-500"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-2">
                  <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isRenewing ? 'animate-spin' : 'group-hover/btn:rotate-180'} transition-transform duration-500`} />
                  <span className="hidden sm:inline">{isRenewing ? 'جاري التجديد...' : 'تجديد الاشتراك'}</span>
                  <span className="sm:hidden">{isRenewing ? '...' : 'تجديد'}</span>
                </div>
              </button>
            ) : enrollment?.status === 'expiring_soon' ? (
              <button
                onClick={handleRenewEnrollment}
                disabled={isRenewing}
                className="group/btn relative overflow-hidden bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl lg:rounded-2xl text-xs sm:text-sm lg:text-base font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:from-gray-400 disabled:to-gray-500"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-2">
                  <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isRenewing ? 'animate-spin' : 'group-hover/btn:rotate-180'} transition-transform duration-500`} />
                  <span className="hidden sm:inline">{isRenewing ? 'جاري التجديد...' : 'تجديد مبكر'}</span>
                  <span className="sm:hidden">{isRenewing ? '...' : 'تجديد مبكر'}</span>
                </div>
              </button>
            ) : (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg sm:rounded-xl lg:rounded-2xl blur opacity-30"></div>
                <span className="relative bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-lg sm:rounded-xl lg:rounded-2xl text-xs sm:text-sm font-bold border border-green-200 shadow-sm flex items-center gap-1 sm:gap-2">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">مشترك ونشط</span>
                  <span className="sm:hidden">نشط</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="p-3 sm:p-4 lg:p-6 grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
        {isActive ? (
          platform.tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))
        ) : isEnrolled && enrollment?.status === 'expired' ? (
          <div className="col-span-full text-center py-8">
            <div className="text-red-400 mb-2">
              <XCircle className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-red-600 font-medium mb-2">انتهت صلاحية اشتراكك في هذه المنصة</p>
            <p className="text-gray-600 text-sm">يرجى تجديد الاشتراك للوصول إلى المهام</p>
          </div>
        ) : (
          <div className="col-span-full text-center py-8">
            <div className="text-gray-400 mb-2">
              <BookOpen className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-gray-600">يجب الاشتراك في المنصة لعرض المهام</p>
          </div>
        )}
      </div>
    </div>
  );
};

const TaskCard: FC<{ task: Task; onClick: () => void }> = ({ task, onClick }) => {
  const taskStatus = getTaskStatus(task);
  const StatusIcon = taskStatus.icon;
  const submission = task.submissions?.[0];
  const difficultyMap = { EASY: 'سهل', MEDIUM: 'متوسط', HARD: 'صعب' };
  const difficultyColors = {
    EASY: {
      bg: 'bg-gradient-to-r from-green-100 to-emerald-100',
      text: 'text-green-800',
      border: 'border-green-200',
      icon: 'text-green-600'
    },
    MEDIUM: {
      bg: 'bg-gradient-to-r from-yellow-100 to-orange-100',
      text: 'text-yellow-800',
      border: 'border-yellow-200',
      icon: 'text-yellow-600'
    },
    HARD: {
      bg: 'bg-gradient-to-r from-red-100 to-pink-100',
      text: 'text-red-800',
      border: 'border-red-200',
      icon: 'text-red-600'
    },
  };

  // Fallback for undefined difficulty
  const difficulty = task.difficulty || 'MEDIUM';
  const currentDifficultyColors = difficultyColors[difficulty as keyof typeof difficultyColors] || difficultyColors.MEDIUM;

  const scorePercentage = submission?.score ? (submission.score / 100) * 100 : 0;
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-400 to-emerald-500';
    if (score >= 60) return 'from-blue-400 to-blue-500';
    if (score >= 40) return 'from-yellow-400 to-orange-500';
    return 'from-red-400 to-red-500';
  };

  return (
    <div 
      onClick={onClick} 
      className="group relative bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 transition-all duration-500 hover:shadow-2xl hover:border-blue-300 hover:scale-[1.03] hover:-translate-y-1 cursor-pointer overflow-hidden"
    >
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Status Indicator */}
      <div className={`absolute top-0 right-0 w-2 h-2 sm:w-3 sm:h-3 rounded-full m-2 sm:m-3 ${taskStatus.color.includes('green') ? 'bg-green-400' : taskStatus.color.includes('yellow') ? 'bg-yellow-400' : taskStatus.color.includes('blue') ? 'bg-blue-400' : 'bg-gray-400'} animate-pulse`}></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-2 sm:mb-3 lg:mb-4">
          <div className="flex-1 pr-2 sm:pr-3 lg:pr-4">
            <h3 className="font-bold text-sm sm:text-base lg:text-lg text-gray-800 group-hover:text-blue-600 transition-colors duration-300 leading-tight">{task.title}</h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 line-clamp-2 leading-relaxed hidden sm:block">{task.description}</p>
          </div>
          <div className={`p-1.5 sm:p-2 lg:p-3 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg ${currentDifficultyColors.bg} ${currentDifficultyColors.border} border group-hover:scale-110 transition-transform duration-300`}>
            <StatusIcon className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 transition-colors duration-300 ${taskStatus.color}`} />
          </div>
        </div>
        
        {/* Score Display with Progress */}
        {submission?.score !== null && submission?.score !== undefined && (
          <div className="mb-2 sm:mb-3 lg:mb-4 p-2 sm:p-3 lg:p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg sm:rounded-xl lg:rounded-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="p-1 sm:p-1.5 lg:p-2 bg-yellow-100 rounded-lg sm:rounded-xl">
                  <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-gray-700 hidden sm:inline">النتيجة</span>
              </div>
              <span className={`text-sm sm:text-base lg:text-lg font-bold ${
                submission.score >= 80 ? 'text-green-600' : 
                submission.score >= 60 ? 'text-blue-600' : 
                submission.score >= 40 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {submission.score}/100
              </span>
            </div>
            {/* Score Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${getScoreColor(submission.score)} rounded-full transition-all duration-1000 ease-out`}
                style={{ width: `${scorePercentage}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {/* Enhanced Feedback Display */}
        {submission?.feedback && (submission.status === 'APPROVED' || submission.status === 'REJECTED') && (
          <div className="mb-2 sm:mb-3 lg:mb-4 p-2 sm:p-3 lg:p-4 bg-white rounded-lg sm:rounded-xl lg:rounded-2xl border border-gray-200 shadow-sm hidden sm:block">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg sm:rounded-xl">
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-gray-700">ملاحظات المدرب</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed bg-gray-50 p-2 sm:p-3 rounded-lg sm:rounded-xl">{submission.feedback}</p>
          </div>
        )}
        
        {/* Enhanced Footer */}
        <div className="flex justify-between items-center pt-2 sm:pt-3 lg:pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1 sm:gap-2">
             <div className={`p-1 sm:p-1.5 lg:p-2 rounded-lg sm:rounded-xl ${currentDifficultyColors.bg} ${currentDifficultyColors.border} border`}>
               <Target className={`h-3 w-3 sm:h-4 sm:w-4 ${currentDifficultyColors.icon}`} />
             </div>
             <span className={`text-xs sm:text-sm font-semibold ${currentDifficultyColors.text} hidden sm:inline`}>
               {difficultyMap[difficulty as keyof typeof difficultyMap] || 'متوسط'}
             </span>
           </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
              taskStatus.color.includes('green') ? 'bg-green-400' : 
              taskStatus.color.includes('yellow') ? 'bg-yellow-400' : 
              taskStatus.color.includes('blue') ? 'bg-blue-400' : 'bg-gray-400'
            } animate-pulse`}></div>
            <span className={`text-xs sm:text-sm font-semibold ${taskStatus.color} hidden sm:inline`}>{taskStatus.text}</span>
          </div>
        </div>
        
        {/* Hover Effect Indicator */}
        <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:block">
          <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
            <Play className="h-3 w-3" />
            <span>انقر للتفاصيل</span>
          </div>
        </div>
      </div>
      
      {/* Glow Effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl"></div>
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



  const MentorshipModal: FC<{ isOpen: boolean; userBalance: number; onClose: () => void; onSuccess: () => void }> = ({ isOpen, userBalance, onClose, onSuccess }) => {
  const [sessionType, setSessionType] = useState<'RECORDED' | 'FACE_TO_FACE'>('RECORDED');
  const duration = '60'; // Fixed 60 minutes for face-to-face sessions
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [selectedDateId, setSelectedDateId] = useState('');
  const [selectedRecordedSessionId, setSelectedRecordedSessionId] = useState('');
  const [studentNotes, setStudentNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

    if (!isOpen || !mentorshipData) return null;

  // Check if user has purchased any recorded sessions
  const purchasedRecordedSessions = mentorshipData.bookings.filter(
    booking => booking.sessionType === 'RECORDED' && booking.status === 'CONFIRMED'
  );

  const selectedRecordedSession = mentorshipData.recordedSessions?.find(s => s.id === selectedRecordedSessionId);
  const sessionPrice = Number(sessionType === 'RECORDED' 
    ? (selectedRecordedSession?.price || mentorshipData.pricing?.recordedSession || 100)
    : (mentorshipData.pricing?.faceToFaceSession || 500));
  const totalAmount = sessionType === 'RECORDED' ? sessionPrice : (parseInt(duration) / 60) * sessionPrice;

  const handleBookTimeSlot = async (dateId: string, sessionType: 'RECORDED' | 'FACE_TO_FACE', whatsappNumber?: string) => {
    if (sessionType === 'FACE_TO_FACE' && !whatsappNumber?.trim()) {
      alert('يرجى إدخال رقم الواتساب');
      return;
    }

    if (totalAmount > userBalance) {
      alert('رصيدك غير كافي لحجز هذه الجلسة. يرجى شحن رصيدك أولاً.');
      return;
    }

    setIsSubmitting(true);
    try {
      const requestBody: any = {
        sessionType,
        studentNotes: studentNotes.trim() || undefined,
        duration: parseInt(duration),
        selectedDateId: dateId
      };

      if (sessionType === 'FACE_TO_FACE') {
        requestBody.whatsappNumber = whatsappNumber?.trim();
      }

      const response = await fetch('/api/mentorship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      if (response.ok) {
        const result = await response.json();
        onSuccess();
        onClose();
        // Reset form
        setSessionType('RECORDED');
        setWhatsappNumber('');
        setSelectedDateId('');
        setSelectedRecordedSessionId('');
        setStudentNotes('');
        setShowCalendar(false);
        alert(result.message || 'تم حجز الجلسة بنجاح!');
      } else {
        const error = await response.json();
        alert(`فشل في حجز الجلسة: ${error.error}`);
      }
    } catch (error) {
      console.error('Mentorship booking error:', error);
      alert('حدث خطأ أثناء حجز الجلسة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (sessionType === 'RECORDED') {
      if (!selectedRecordedSessionId) {
        alert('يرجى اختيار جلسة مسجلة');
        return;
      }
      // Check if already purchased
      const alreadyPurchased = purchasedRecordedSessions.some(
        booking => booking.videoLink === selectedRecordedSession?.videoLink
      );
      if (alreadyPurchased) {
        alert('لقد قمت بشراء هذه الجلسة مسبقاً');
        return;
      }
    }
    
    if (sessionType === 'FACE_TO_FACE') {
      if (!whatsappNumber.trim()) {
        alert('يرجى إدخال رقم الواتساب');
        return;
      }
      if (!selectedDateId) {
        alert('يرجى اختيار تاريخ للجلسة');
        return;
      }
    }

    if (totalAmount > userBalance) {
      alert('رصيدك غير كافي لحجز هذه الجلسة. يرجى شحن رصيدك أولاً.');
      return;
    }

    setIsSubmitting(true);
    try {
      const requestBody: any = {
        sessionType,
        studentNotes: studentNotes.trim() || undefined
      };

      if (sessionType === 'RECORDED') {
        requestBody.recordedSessionId = selectedRecordedSessionId;
      }

      if (sessionType === 'FACE_TO_FACE') {
        requestBody.duration = parseInt(duration);
        requestBody.whatsappNumber = whatsappNumber.trim();
        requestBody.selectedDateId = selectedDateId;
      }

      const response = await fetch('/api/mentorship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      if (response.ok) {
        const result = await response.json();
        onSuccess();
        onClose();
        // Reset form
        setSessionType('RECORDED');
        setWhatsappNumber('');
        setSelectedDateId('');
        setSelectedRecordedSessionId('');
        setStudentNotes('');
        alert(result.message || 'تم حجز الجلسة بنجاح!');
      } else {
        const error = await response.json();
        alert(`فشل في حجز الجلسة: ${error.error}`);
      }
    } catch (error) {
      console.error('Mentorship booking error:', error);
      alert('حدث خطأ أثناء حجز الجلسة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">حجز جلسة إرشاد</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Session Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">نوع الجلسة</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSessionType('RECORDED')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    sessionType === 'RECORDED'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <Play className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-medium">جلسة مسجلة</div>
                    <div className="text-sm text-gray-500">شاهد الجلسات المسجلة</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSessionType('FACE_TO_FACE')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    sessionType === 'FACE_TO_FACE'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <Users className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-medium">جلسة مباشرة</div>
                    <div className="text-sm text-gray-500">احجز جلسة مباشرة</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Content based on session type */}
            {sessionType === 'RECORDED' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">اختر الجلسة المسجلة</label>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {mentorshipData.recordedSessions?.map((session) => {
                    const isPurchased = purchasedRecordedSessions.some(
                      booking => booking.videoLink === session.videoLink
                    );
                    
                    return (
                      <div
                        key={session.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedRecordedSessionId === session.id
                            ? 'border-blue-500 bg-blue-50'
                            : isPurchased
                            ? 'border-green-200 bg-green-50 opacity-60'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${isPurchased ? 'cursor-not-allowed' : ''}`}
                        onClick={() => !isPurchased && setSelectedRecordedSessionId(session.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800">{session.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{session.description}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-lg font-bold text-blue-600">{Number(session.price).toFixed(2)} جنية</span>
                              {isPurchased && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                  تم الشراء مسبقاً
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رقم الواتساب</label>
                  <input
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="أدخل رقم الواتساب"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اختر التاريخ والوقت</label>
                  <button
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right hover:bg-gray-50 transition-colors"
                  >
                    {selectedDateId ? 'تم اختيار التاريخ' : 'اختر التاريخ والوقت'}
                  </button>
                  
                  {showCalendar && (
                    <div className="mt-3 border rounded-lg p-4">
                      <CalendlyStudentCalendar
                        availableDates={mentorshipData.availableDates || []}
                        onDateSelect={(dateId) => {
                          setSelectedDateId(dateId);
                          setShowCalendar(false);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Student Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات إضافية (اختياري)</label>
              <textarea
                value={studentNotes}
                onChange={(e) => setStudentNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="أي ملاحظات أو متطلبات خاصة..."
              />
            </div>

            {/* Price Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">سعر الجلسة:</span>
                <span className="font-medium">{Number(sessionPrice).toFixed(2)} جنية</span>
              </div>
              {sessionType === 'FACE_TO_FACE' && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">المدة:</span>
                  <span className="font-medium">{duration} دقيقة</span>
                </div>
              )}
              <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                <span>المجموع:</span>
                <span className="text-blue-600">{Number(totalAmount).toFixed(2)} جنية</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600 mt-1">
                <span>رصيدك الحالي:</span>
                <span className={userBalance >= totalAmount ? 'text-green-600' : 'text-red-600'}>
                  {Number(userBalance).toFixed(2)} جنية
                </span>
              </div>
            </div>

            {/* Submit Button */}
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
                disabled={isSubmitting || totalAmount > userBalance}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'جاري الحجز...' : 'احجز الجلسة'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
