'use client'

import { useState, useEffect, useCallback, FC, ReactNode, CSSProperties } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  BookOpen, Clock, CheckCircle, X, FileText, Trophy, RefreshCw, Star, 
  Wallet, CreditCard, ShoppingCart, TrendingUp, Award, Target, 
  BarChart3, Activity, Zap, Calendar, Users, Play, XCircle,
  ArrowUp, ArrowDown, Sparkles, GraduationCap, Medal, ExternalLink,
  Box, Code2, Database, Layers, Wifi, Palette, FileCode, Cpu, Globe, Terminal, Braces, CircuitBoard, GitBranch, FolderOpen, ChevronRight, CheckCircle2, Hexagon, Brain, PenTool, Codepen, Server
} from 'lucide-react'

import { formatDate, formatDateTime, formatTimeRange } from '@/lib/dateUtils';
import { Platform, Task, Submission, StudentStats, WalletData, Enrollment, Transaction } from '@/types';

// --- INTERFACES ---


// --- CACHE IMPLEMENTATION ---
class DataCache {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>()
  private isClient = typeof window !== 'undefined'
  
  set(key: string, data: unknown, ttl: number = 5 * 60 * 1000) { // 5 minutes default
    if (!this.isClient) return // Skip caching on server
    this.cache.set(key, { data, timestamp: Date.now(), ttl })
  }
  
  get(key: string) {
    if (!this.isClient) return null // Always return null on server
    const item = this.cache.get(key)
    if (!item || Date.now() - item.timestamp > item.ttl) {
      if (item) this.cache.delete(key)
      return null
    }
    return item.data
  }
  
  clear() {
    if (this.isClient) {
      this.cache.clear()
    }
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

  const orderedPlatforms = [...platforms].sort((a, b) => {
    const isJavaScriptA = a.name.includes('JavaScript Tasks');
    const isJavaScriptB = b.name.includes('JavaScript Tasks');

    if (isJavaScriptA && !isJavaScriptB) return -1;
    if (!isJavaScriptA && isJavaScriptB) return 1;
    return 0;
  });



// --- RENDER LOGIC ---
  if (isPageLoading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen w-full bg-[#0B0F1E]" dir="rtl">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">

        {isContentLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="relative">
                <div className="h-16 w-16 mx-auto mb-4">
                  <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-200 mb-2">جاري تحميل البيانات...</h3>
              <p className="text-slate-500">يتم تجهيز المحتوى الخاص بك</p>
            </div>
          </div>
        ) : (
          <>
            {/* Full-Width Platform Hub */}
            <div className="mb-8">
              <PlatformHub platforms={orderedPlatforms} enrollments={enrollments} />
            </div>

            {/* Two-Column Content Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 xl:gap-8 max-w-none">
              {/* Left Column - Stats & Wallet (25% width on xl screens) */}
              <div className="xl:col-span-1 space-y-6">
                <StatsSection stats={stats} />
                <WalletSection wallet={wallet} onTopUp={handleTopUpSuccess} />
                <ExpirationNotifications enrollments={enrollments} />
              </div>

              {/* Right Column - Platform Cards (75% width on xl screens) */}
              <div className="xl:col-span-3">
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  {orderedPlatforms.map((platform, index) => (
                    <div 
                      key={platform.id} 
                      id={`platform-${platform.id}`}
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
  <div className="flex items-center justify-center min-h-screen bg-[#0B0F1E]">
    <div className="text-center">
      <div className="relative h-32 w-32 mb-4 mx-auto">
        <div className="absolute inset-0 rounded-full border-8 border-slate-800"></div>
        <div className="absolute inset-0 rounded-full border-8 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
      </div>
      <h2 className="text-2xl font-semibold text-slate-200">جاري التحميل...</h2>
      <p className="text-slate-500 mt-2">يتم تجهيز لوحة التحكم الخاصة بك.</p>
    </div>
  </div>
);

// DashboardHeader component removed - now handled by layout.tsx

const PLATFORM_ICON_MAP: Record<string, { icon: typeof Box; color: string; bg: string }> = {
  'system design': { icon: Box, color: 'text-violet-400', bg: 'bg-violet-500/15' },
  'oop': { icon: Code2, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  'object oriented': { icon: Code2, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  'database': { icon: Database, color: 'text-blue-400', bg: 'bg-blue-500/15' },
  'solid': { icon: Layers, color: 'text-amber-400', bg: 'bg-amber-500/15' },
  'design pattern': { icon: Layers, color: 'text-amber-400', bg: 'bg-amber-500/15' },
  'network': { icon: Wifi, color: 'text-purple-400', bg: 'bg-purple-500/15' },
  'ui/ux': { icon: Palette, color: 'text-pink-400', bg: 'bg-pink-500/15' },
  'ui ux': { icon: Palette, color: 'text-pink-400', bg: 'bg-pink-500/15' },
  'javascript': { icon: FileCode, color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  'js': { icon: FileCode, color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  'interview': { icon: Terminal, color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  'algorithm': { icon: Cpu, color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
  'data structure': { icon: GitBranch, color: 'text-rose-400', bg: 'bg-rose-500/15' },
  'web': { icon: Globe, color: 'text-sky-400', bg: 'bg-sky-500/15' },
  'frontend': { icon: Codepen, color: 'text-orange-400', bg: 'bg-orange-500/15' },
  'backend': { icon: Server, color: 'text-indigo-400', bg: 'bg-indigo-500/15' },
};

const FALLBACK_ICONS = [
  { icon: Box, color: 'text-violet-400', bg: 'bg-violet-500/15' },
  { icon: Code2, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  { icon: Database, color: 'text-blue-400', bg: 'bg-blue-500/15' },
  { icon: Layers, color: 'text-amber-400', bg: 'bg-amber-500/15' },
  { icon: Wifi, color: 'text-purple-400', bg: 'bg-purple-500/15' },
  { icon: Palette, color: 'text-pink-400', bg: 'bg-pink-500/15' },
  { icon: FileCode, color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  { icon: Cpu, color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
];

function getPlatformIcon(platformName: string, index: number) {
  const lower = platformName.toLowerCase();
  for (const [key, value] of Object.entries(PLATFORM_ICON_MAP)) {
    if (lower.includes(key)) return value;
  }
  return FALLBACK_ICONS[index % FALLBACK_ICONS.length];
}

const PlatformHubCard: FC<{
  platform: Platform;
  isActive: boolean;
  iconMeta: { icon: typeof Box; color: string; bg: string };
  Icon: typeof Box;
  onClick: () => void;
  delay: number;
}> = ({ platform, isActive, iconMeta, Icon, onClick, delay }) => (
  <button
    type="button"
    onClick={onClick}
    className="group h-full text-left"
    style={{ animationDelay: `${delay}ms` }}
  >
    <span className="flex h-full items-start gap-4 rounded-2xl border border-white/[0.06] bg-[#111628]/80 px-5 py-4 shadow-lg shadow-black/20 backdrop-blur-md transition-all duration-300 hover:border-white/[0.12] hover:bg-[#161d35]/90 hover:scale-[1.02]">
      <span className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconMeta.bg}`}>
        <Icon className={`h-5 w-5 ${iconMeta.color}`} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block break-words text-sm font-semibold leading-snug text-slate-100 sm:text-base">
          {platform.name}
        </span>
        <span className="mt-1 flex items-center gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            {isActive ? 'Active' : 'Locked'}
          </span>
        </span>
        <span className="mt-1 block text-xs font-medium text-slate-500">
          {platform.tasks?.length || 0} <span className="text-slate-600">Lessons</span>
        </span>
      </span>
      <span className="mt-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-slate-500 transition-colors duration-300 group-hover:bg-white/[0.08] group-hover:text-slate-300">
        <ChevronRight className="h-4 w-4" />
      </span>
    </span>
  </button>
);

const PlatformHub: FC<{ platforms: Platform[]; enrollments: Enrollment[] }> = ({ platforms, enrollments }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const orbitPlatforms = platforms.slice(0, 8);
  const totalTasks = orbitPlatforms.reduce((sum, platform) => sum + (platform.tasks?.length || 0), 0);
  const activeCount = orbitPlatforms.filter((platform) => {
    const enrollment = enrollments.find((item) => item.platform.id === platform.id);
    return enrollment && enrollment.status !== 'expired';
  }).length;

  useEffect(() => {
    const timer = window.setTimeout(() => setIsExpanded(true), 120);
    return () => window.clearTimeout(timer);
  }, []);

  const handlePlatformSelect = (platformId: string) => {
    setIsExpanded(true);
    document.getElementById(`platform-${platformId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  if (orbitPlatforms.length === 0) return null;

  return (
    <section className="relative w-full rounded-3xl bg-[#0B0F1E] shadow-2xl shadow-black/40" aria-label="Coding platform hub">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/5 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/5 blur-2xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Desktop: 3x3 Grid with center node in middle */}
        <div className="hidden lg:grid lg:grid-cols-3 lg:gap-5 lg:items-center">
          {orbitPlatforms.slice(0, 4).map((platform, index) => {
            const enrollment = enrollments.find((item) => item.platform.id === platform.id);
            const isActive = enrollment && enrollment.status !== 'expired';
            const iconMeta = getPlatformIcon(platform.name, index);
            const Icon = iconMeta.icon;
            return (
              <PlatformHubCard
                key={platform.id}
                platform={platform}
                isActive={isActive}
                iconMeta={iconMeta}
                Icon={Icon}
                onClick={() => handlePlatformSelect(platform.id)}
                delay={index * 80}
              />
            );
          })}

          {/* Center Node */}
          <div className="flex items-center justify-center py-4">
            <button
              type="button"
              onClick={() => setIsExpanded((v) => !v)}
              className="group relative flex h-28 w-28 items-center justify-center rounded-full focus:outline-none"
              aria-pressed={isExpanded}
            >
              <span className="absolute inset-0 rounded-full border border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.25),inset_0_0_20px_rgba(6,182,212,0.1)]" />
              <span className="absolute inset-[3px] rounded-full bg-[#0B0F1E]" />
              <span className="absolute inset-[3px] rounded-full bg-gradient-to-br from-blue-600/20 via-indigo-600/20 to-cyan-500/20" />
              <span className="relative font-black text-3xl tracking-wider text-white">
                C<span className="text-cyan-400">/</span>
              </span>
            </button>
          </div>

          {orbitPlatforms.slice(4, 8).map((platform, index) => {
            const enrollment = enrollments.find((item) => item.platform.id === platform.id);
            const isActive = enrollment && enrollment.status !== 'expired';
            const iconMeta = getPlatformIcon(platform.name, index + 4);
            const Icon = iconMeta.icon;
            return (
              <PlatformHubCard
                key={platform.id}
                platform={platform}
                isActive={isActive}
                iconMeta={iconMeta}
                Icon={Icon}
                onClick={() => handlePlatformSelect(platform.id)}
                delay={(index + 4) * 80}
              />
            );
          })}
        </div>

        {/* Tablet: 2-column grid */}
        <div className="hidden sm:grid sm:grid-cols-2 sm:gap-4 lg:hidden">
          {/* Center node full width */}
          <div className="col-span-2 flex justify-center py-6">
            <button
              type="button"
              onClick={() => setIsExpanded((v) => !v)}
              className="group relative flex h-24 w-24 items-center justify-center rounded-full focus:outline-none"
            >
              <span className="absolute inset-0 rounded-full border border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.25)]" />
              <span className="absolute inset-[3px] rounded-full bg-[#0B0F1E]" />
              <span className="relative font-black text-2xl tracking-wider text-white">
                C<span className="text-cyan-400">/</span>
              </span>
            </button>
          </div>
          {orbitPlatforms.map((platform, index) => {
            const enrollment = enrollments.find((item) => item.platform.id === platform.id);
            const isActive = enrollment && enrollment.status !== 'expired';
            const iconMeta = getPlatformIcon(platform.name, index);
            const Icon = iconMeta.icon;
            return (
              <PlatformHubCard
                key={platform.id}
                platform={platform}
                isActive={isActive}
                iconMeta={iconMeta}
                Icon={Icon}
                onClick={() => handlePlatformSelect(platform.id)}
                delay={index * 60}
              />
            );
          })}
        </div>

        {/* Mobile: stacked */}
        <div className="flex flex-col gap-4 sm:hidden">
          <div className="flex justify-center py-4">
            <button
              type="button"
              onClick={() => setIsExpanded((v) => !v)}
              className="group relative flex h-20 w-20 items-center justify-center rounded-full focus:outline-none"
            >
              <span className="absolute inset-0 rounded-full border border-cyan-400/40" />
              <span className="absolute inset-[3px] rounded-full bg-[#0B0F1E]" />
              <span className="relative font-black text-xl tracking-wider text-white">
                C<span className="text-cyan-400">/</span>
              </span>
            </button>
          </div>
          {orbitPlatforms.map((platform, index) => {
            const enrollment = enrollments.find((item) => item.platform.id === platform.id);
            const isActive = enrollment && enrollment.status !== 'expired';
            const iconMeta = getPlatformIcon(platform.name, index);
            const Icon = iconMeta.icon;
            return (
              <PlatformHubCard
                key={platform.id}
                platform={platform}
                isActive={isActive}
                iconMeta={iconMeta}
                Icon={Icon}
                onClick={() => handlePlatformSelect(platform.id)}
                delay={index * 60}
              />
            );
          })}
        </div>

        {/* Bottom Stats Bar */}
        <div className={`mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6 rounded-2xl border border-white/[0.06] bg-[#111628]/80 px-6 py-4 shadow-lg shadow-black/20 backdrop-blur-md transition-all duration-700 ${isExpanded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15">
              <Box className="h-5 w-5 text-emerald-400" />
            </span>
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-none text-slate-100">{activeCount}</span>
              <span className="mt-0.5 text-[11px] font-medium text-slate-500">Active Platforms</span>
            </div>
          </div>
          <span className="hidden h-8 w-px bg-white/[0.08] sm:block" />
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15">
              <CheckCircle2 className="h-5 w-5 text-violet-400" />
            </span>
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-none text-slate-100">{totalTasks}</span>
              <span className="mt-0.5 text-[11px] font-medium text-slate-500">Lessons Completed</span>
            </div>
          </div>
          <span className="hidden h-8 w-px bg-white/[0.08] sm:block" />
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15">
              <Users className="h-5 w-5 text-blue-400" />
            </span>
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-none text-slate-100">{orbitPlatforms.length}</span>
              <span className="mt-0.5 text-[11px] font-medium text-slate-500">Platforms</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const StatsSection: FC<{ stats: StudentStats | null }> = ({ stats }) => {
  if (!stats) return null;
  
  const totalTasks = stats.totalSubmissions;
  const completionRate = totalTasks > 0 ? (stats.approvedSubmissions / totalTasks) * 100 : 0;
  const averageScore = stats.averageScore ? Number(stats.averageScore) : 0;
  
  return (
    <div className="space-y-6">
      {/* Main Stats Grid - Dark Mode */}
      <div className="grid grid-cols-2 gap-4">
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

      {/* Progress Overview - Dark */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#111628]/80 p-6 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            نظرة عامة على الأداء
          </h3>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Activity className="h-4 w-4" />
            تحديث مباشر
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {/* Completion Rate */}
          <div className="text-center">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 sm:mb-3">
              <svg className="w-16 h-16 sm:w-20 sm:h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-700"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-400"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${completionRate}, 100`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm sm:text-lg font-bold text-slate-200">{completionRate.toFixed(0)}%</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-300">معدل الإنجاز</p>
            <p className="text-xs text-slate-500 hidden sm:block">من المهام المقبولة</p>
          </div>

          {/* Average Score */}
          <div className="text-center">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 sm:mb-3">
              <svg className="w-16 h-16 sm:w-20 sm:h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-700"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`${averageScore >= 70 ? 'text-emerald-400' : averageScore >= 50 ? 'text-amber-400' : 'text-rose-400'}`}
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${averageScore}, 100`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm sm:text-lg font-bold text-slate-200">{averageScore.toFixed(0)}</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-300">متوسط الدرجات</p>
            <p className="text-xs text-slate-500 hidden sm:block">من 100 درجة</p>
          </div>

          {/* Performance Level */}
          <div className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 sm:mb-3 flex items-center justify-center">
              {averageScore >= 90 ? (
                <div className="relative">
                  <Medal className="h-8 w-8 sm:h-12 sm:w-12 text-yellow-400" />
                  <Sparkles className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 text-yellow-300 animate-pulse" />
                </div>
              ) : averageScore >= 70 ? (
                <Award className="h-8 w-8 sm:h-12 sm:w-12 text-emerald-400" />
              ) : averageScore >= 50 ? (
                <Target className="h-8 w-8 sm:h-12 sm:w-12 text-amber-400" />
              ) : (
                <TrendingUp className="h-8 w-8 sm:h-12 sm:w-12 text-blue-400" />
              )}
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-300">
              {averageScore >= 90 ? 'ممتاز' : averageScore >= 70 ? 'جيد جداً' : averageScore >= 50 ? 'جيد' : 'يحتاج تحسين'}
            </p>
            <p className="text-xs text-slate-500 hidden sm:block">مستوى الأداء</p>
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
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/20'
    },
    green: {
      gradient: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20'
    },
    yellow: {
      gradient: 'from-amber-500 to-amber-600',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20'
    },
    purple: {
      gradient: 'from-violet-500 to-violet-600',
      bg: 'bg-violet-500/10',
      text: 'text-violet-400',
      border: 'border-violet-500/20'
    },
  };

  const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Activity;
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-slate-500';

  return (
    <div className={`p-6 rounded-2xl border ${colors[color].border} bg-[#111628]/80 backdrop-blur-md transition-all duration-200 hover:shadow-lg hover:shadow-black/20`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colors[color].gradient} text-white shadow-sm`}>
          <div className="h-5 w-5">{icon}</div>
        </div>
        <div className={`flex items-center gap-1 ${trendColor}`}>
          <TrendIcon className="h-4 w-4" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-slate-100">{value}</span>
          {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
        </div>

        {/* Minimalist Progress Bar */}
        {progress !== undefined && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>التقدم</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-2">
              <div
                className={`h-full bg-gradient-to-r ${colors[color].gradient} rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
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
        
        <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 sm:gap-0">
          <div className="space-y-2 text-center sm:text-right w-full sm:w-auto">
            <div className="flex items-baseline gap-2 justify-center sm:justify-start">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">{balance.toLocaleString()}</span>
              <span className="text-base sm:text-lg font-medium text-white/80">جنية</span>
            </div>
            <div className="flex items-center gap-2 text-white/70 justify-center sm:justify-start">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">متاح للاستخدام الفوري</span>
            </div>
          </div>
          
          <button
            onClick={() => setShowTopUpForm(!showTopUpForm)}
            className="group/btn relative overflow-hidden bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg border border-white/30 hover:border-white/50 w-full sm:w-auto min-h-[48px]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center gap-2 justify-center">
              <Zap className="h-4 w-4 group-hover/btn:rotate-12 transition-transform duration-300" />
              <span className="text-sm sm:text-base">{showTopUpForm ? 'إخفاء الشحن' : 'شحن الرصيد'}</span>
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
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
          <div className="flex items-center space-x-2 space-x-reverse mb-2">
            <XCircle className="h-5 w-5 text-rose-400" />
            <h3 className="font-semibold text-rose-300">اشتراكات منتهية الصلاحية</h3>
          </div>
          <p className="text-sm text-rose-400/80 mb-3">
            لديك {expiredEnrollments.length} اشتراك منتهي الصلاحية. يرجى التجديد للوصول إلى المحتوى.
          </p>
          <div className="flex flex-wrap gap-2">
            {expiredEnrollments.map(enrollment => (
              <span key={enrollment.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-rose-500/15 text-rose-300 border border-rose-500/20">
                {enrollment.platform.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {expiringSoonEnrollments.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
          <div className="flex items-center space-x-2 space-x-reverse mb-2">
            <Clock className="h-5 w-5 text-amber-400" />
            <h3 className="font-semibold text-amber-300">اشتراكات تنتهي قريباً</h3>
          </div>
          <p className="text-sm text-amber-400/80 mb-3">
            لديك {expiringSoonEnrollments.length} اشتراك ينتهي خلال 7 أيام. فكر في التجديد المبكر.
          </p>
          <div className="flex flex-wrap gap-2">
            {expiringSoonEnrollments.map(enrollment => (
              <span key={enrollment.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/20">
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
    <div className="group relative rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl border border-white/[0.06] bg-[#111628]/80 shadow-lg shadow-black/20">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* Status Indicator Bar */}
      <div className={`h-1 w-full ${
        !isEnrolled ? 'bg-slate-600' :
        enrollment?.status === 'expired' ? 'bg-gradient-to-r from-rose-400 to-rose-600' :
        enrollment?.status === 'expiring_soon' ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
        'bg-gradient-to-r from-emerald-400 to-emerald-500'
      }`}></div>
      
      <div className="relative z-10 p-3 sm:p-4 lg:p-8">
        <div className="flex justify-between items-start mb-3 sm:mb-4 lg:mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className={`p-2 sm:p-2.5 lg:p-3 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg ${
                !isEnrolled ? 'bg-gradient-to-br from-slate-500 to-slate-700' :
                enrollment?.status === 'expired' ? 'bg-gradient-to-br from-rose-400 to-rose-600' :
                enrollment?.status === 'expiring_soon' ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                'bg-gradient-to-br from-emerald-400 to-emerald-600'
              } text-white group-hover:scale-110 transition-transform duration-300`}>
                <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
              </div>
              <div>
                <h2 className="text-sm sm:text-lg lg:text-2xl font-bold text-slate-200 group-hover:text-white transition-colors">{platform.name}</h2>
                <p className="text-slate-400 text-xs sm:text-sm mt-0.5 sm:mt-1 hidden sm:block">{platform.description}</p>
              </div>
            </div>
            
            {/* Enrollment Details */}
            {isEnrolled && enrollment && (
              <div className="mt-2 sm:mt-3 lg:mt-4 space-y-2 sm:space-y-3">
                {/* Expiration Date */}
                {enrollment.expiresAt && (
                  <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm bg-white/[0.03] rounded-lg sm:rounded-xl p-2 sm:p-3 border border-white/[0.06]">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-slate-500" />
                    <span className="text-slate-400 hidden sm:inline">تاريخ الانتهاء:</span>
                    <span className="font-semibold text-slate-200">{formatDate(enrollment.expiresAt)}</span>
                  </div>
                )}
                
                {/* Days Remaining with Progress */}
                <div className="space-y-1 sm:space-y-2">
                  <div className={`inline-flex items-center px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-lg sm:rounded-xl lg:rounded-2xl text-xs sm:text-sm font-semibold shadow-sm ${
                    enrollment.status === 'expired' ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' :
                    enrollment.status === 'expiring_soon' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
                    'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                  }`}>
                    <Activity className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                    {enrollment.status === 'expired' ? 'منتهي الصلاحية' :
                     enrollment.status === 'expiring_soon' ? `${enrollment.daysRemaining} أيام متبقية` :
                     `${enrollment.daysRemaining} يوم متبقي`}
                  </div>
                  
                  {/* Progress Bar for Days Remaining */}
                  {enrollment.status !== 'expired' && enrollment.daysRemaining !== undefined && (
                    <div className="w-full bg-slate-700/50 rounded-full h-1.5 sm:h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          enrollment.status === 'expiring_soon' ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                          'bg-gradient-to-r from-emerald-400 to-emerald-500'
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
                      className="group/link inline-flex items-center gap-1 sm:gap-2 text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-semibold bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105"
                    >
                      <span className="hidden sm:inline">زيارة المنصة</span>
                      <span className="sm:hidden">زيارة</span>
                      <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4 rotate-45 group-hover/link:rotate-12 transition-transform duration-300" />
                    </a>
                  </div>
                )}

                {/* Course Link for active enrollments */}
                {enrollment.status !== 'expired' && platform.courseLink && (
                  <div className="mt-2 sm:mt-3">
                    <a
                      href={platform.courseLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/link inline-flex items-center gap-1 sm:gap-2 text-emerald-400 hover:text-emerald-300 text-xs sm:text-sm font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105"
                    >
                      <span className="hidden sm:inline">رابط الكورس</span>
                      <span className="sm:hidden">كورس</span>
                      <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 group-hover/link:scale-110 transition-transform duration-300" />
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
                <span className="relative bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-300 px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-lg sm:rounded-xl lg:rounded-2xl text-xs sm:text-sm font-bold border border-amber-500/20 shadow-sm">
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
                <span className="relative bg-gradient-to-r from-emerald-500/10 to-emerald-500/10 text-emerald-300 px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-lg sm:rounded-xl lg:rounded-2xl text-xs sm:text-sm font-bold border border-emerald-500/20 shadow-sm flex items-center gap-1 sm:gap-2">
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
            <div className="text-rose-400 mb-2">
              <XCircle className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-rose-400 font-medium mb-2">انتهت صلاحية اشتراكك في هذه المنصة</p>
            <p className="text-slate-500 text-sm">يرجى تجديد الاشتراك للوصول إلى المهام</p>
          </div>
        ) : (
          <div className="col-span-full text-center py-8">
            <div className="text-slate-500 mb-2">
              <BookOpen className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-slate-400">يجب الاشتراك في المنصة لعرض المهام</p>
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
      bg: 'bg-gradient-to-r from-emerald-500/10 to-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      icon: 'text-emerald-400'
    },
    MEDIUM: {
      bg: 'bg-gradient-to-r from-amber-500/10 to-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
      icon: 'text-amber-400'
    },
    HARD: {
      bg: 'bg-gradient-to-r from-rose-500/10 to-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/20',
      icon: 'text-rose-400'
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
      className="group relative border border-white/[0.06] bg-[#111628]/80 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 transition-all duration-500 hover:shadow-2xl hover:border-blue-500/30 hover:scale-[1.03] hover:-translate-y-1 cursor-pointer overflow-hidden"
    >
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* Status Indicator */}
      <div className={`absolute top-0 right-0 w-2 h-2 sm:w-3 sm:h-3 rounded-full m-2 sm:m-3 ${taskStatus.color.includes('green') ? 'bg-emerald-400' : taskStatus.color.includes('yellow') ? 'bg-amber-400' : taskStatus.color.includes('blue') ? 'bg-blue-400' : 'bg-slate-500'} animate-pulse`}></div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-2 sm:mb-3 lg:mb-4">
          <div className="flex-1 pr-2 sm:pr-3 lg:pr-4">
            <h3 className="font-bold text-sm sm:text-base lg:text-lg text-slate-200 group-hover:text-blue-400 transition-colors duration-300 leading-tight">{task.title}</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 sm:mt-2 line-clamp-2 leading-relaxed hidden sm:block">{task.description}</p>
          </div>
          <div className={`p-1.5 sm:p-2 lg:p-3 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg ${currentDifficultyColors.bg} ${currentDifficultyColors.border} border group-hover:scale-110 transition-transform duration-300`}>
            <StatusIcon className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 transition-colors duration-300 ${taskStatus.color}`} />
          </div>
        </div>

        {/* Score Display with Progress */}
        {submission?.score !== null && submission?.score !== undefined && (
          <div className="mb-2 sm:mb-3 lg:mb-4 p-2 sm:p-3 lg:p-4 bg-white/[0.03] rounded-lg sm:rounded-xl lg:rounded-2xl border border-white/[0.06]">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="p-1 sm:p-1.5 lg:p-2 bg-amber-500/10 rounded-lg sm:rounded-xl border border-amber-500/20">
                  <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-300 hidden sm:inline">النتيجة</span>
              </div>
              <span className={`text-sm sm:text-base lg:text-lg font-bold ${
                submission.score >= 80 ? 'text-emerald-400' :
                submission.score >= 60 ? 'text-blue-400' :
                submission.score >= 40 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {submission.score}/100
              </span>
            </div>
            {/* Score Progress Bar */}
            <div className="w-full bg-slate-700/50 rounded-full h-1.5 sm:h-2 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${getScoreColor(submission.score)} rounded-full transition-all duration-1000 ease-out`}
                style={{ width: `${scorePercentage}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Enhanced Feedback Display */}
        {submission?.feedback && (submission.status === 'APPROVED' || submission.status === 'REJECTED') && (
          <div className="mb-2 sm:mb-3 lg:mb-4 p-2 sm:p-3 lg:p-4 bg-white/[0.03] rounded-lg sm:rounded-xl lg:rounded-2xl border border-white/[0.06] shadow-sm hidden sm:block">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg sm:rounded-xl border border-blue-500/20">
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-slate-300">ملاحظات المدرب</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed bg-white/[0.03] p-2 sm:p-3 rounded-lg sm:rounded-xl border border-white/[0.06]">{submission.feedback}</p>
          </div>
        )}

        {/* Enhanced Footer */}
        <div className="flex justify-between items-center pt-2 sm:pt-3 lg:pt-4 border-t border-white/[0.06]">
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
              taskStatus.color.includes('green') ? 'bg-emerald-400' :
              taskStatus.color.includes('yellow') ? 'bg-amber-400' :
              taskStatus.color.includes('blue') ? 'bg-blue-400' : 'bg-slate-500'
            } animate-pulse`}></div>
            <span className={`text-xs sm:text-sm font-semibold ${taskStatus.color} hidden sm:inline`}>{taskStatus.text}</span>
          </div>
        </div>

        {/* Hover Effect Indicator */}
        <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:block">
          <div className="flex items-center gap-1 text-xs text-blue-400 font-medium">
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in" dir="rtl">
      <div className="bg-[#111628] border border-white/[0.08] rounded-2xl shadow-2xl p-7 w-full max-w-lg m-4 animate-scale-in">
        <div className="flex justify-between items-center border-b border-white/[0.08] pb-4 mb-5">
          <h2 className="text-2xl font-bold text-slate-100">تقديم الحل: <span className="text-blue-400">{task.title}</span></h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors"><X className="h-7 w-7" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {task.link &&
            <a href={task.link} target="_blank" rel="noopener noreferrer" className="inline-block text-blue-400 hover:text-blue-300 hover:underline font-medium">
              عرض رابط المهمة
            </a>
          }
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="اكتب ملخص الحل أو رابط المشروع هنا..."
            className="w-full h-36 p-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 transition-shadow"
            rows={6}
            required
          />
          <div className="flex justify-end space-x-4 pt-4 mt-4 border-t border-white/[0.08] space-x-reverse">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-300 bg-white/[0.05] rounded-lg hover:bg-white/[0.08] transition-colors border border-white/[0.08]">إلغاء</button>
            <button type="submit" disabled={isSubmitting || !summary} className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-violet-600 rounded-lg hover:shadow-lg hover:from-blue-600 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105">
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال الحل'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
