'use client'

import { useState, useEffect, FC, ReactNode } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Clock, CheckCircle, FileText, Trophy, LogOut, RefreshCw, Wallet, CreditCard, Users, ShoppingCart, Video, Calendar } from 'lucide-react'
import { StudentStats } from '@/types';

// --- INTERFACES ---
interface NavigationCard {
  title: string
  description: string
  icon: ReactNode
  href: string
  color: string
}

// --- MAIN DASHBOARD PAGE COMPONENT ---
export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // --- STATE MANAGEMENT ---
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [isContentLoading, setIsContentLoading] = useState(false)

  // --- DATA FETCHING ---
  const fetchStats = async () => {
    if (status !== 'authenticated') return;
    setIsContentLoading(true);
    try {
      const statsRes = await fetch('/api/student/stats');
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsContentLoading(false);
    }
  };

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
      fetchStats();
    }
  }, [isPageLoading, status]);

  // --- HANDLERS ---
  const handleRefresh = () => {
    fetchStats();
  }

  // --- NAVIGATION CARDS DATA ---
  const navigationCards: NavigationCard[] = [
    {
      title: 'المحفظة',
      description: 'عرض الرصيد والمعاملات وإضافة أموال',
      icon: <Wallet className="h-8 w-8" />,
      href: '/student/wallet',
      color: 'from-green-400 to-green-600'
    },
    {
      title: 'الإرشاد الأكاديمي والجلسات',
      description: 'حجز جلسات إرشادية ومشاهدة الجلسات المسجلة',
      icon: <Users className="h-8 w-8" />,
      href: '/student/mentorship',
      color: 'from-purple-400 to-purple-600'
    },
    {
      title: 'المنصات التعليمية',
      description: 'تصفح المنصات المتاحة والتسجيل فيها',
      icon: <BookOpen className="h-8 w-8" />,
      href: '/student/platforms',
      color: 'from-indigo-400 to-indigo-600'
    }
  ];

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
            
            {/* Welcome Section */}
            <div className="bg-white p-8 rounded-xl shadow-md mt-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">مرحباً بك في لوحة التعلم</h2>
              <p className="text-gray-600 mb-6">اختر القسم الذي تريد الوصول إليه من الأقسام التالية:</p>
              
              {/* Navigation Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {navigationCards.map((card, index) => (
                  <NavigationCardComponent key={index} card={card} />
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

// --- CHILD COMPONENTS ---

const NavigationCardComponent: FC<{ card: NavigationCard }> = ({ card }) => (
  <Link href={card.href} className="block group">
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
      <div className="flex items-center space-x-4 space-x-reverse mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${card.color} text-white shadow-sm group-hover:scale-110 transition-transform duration-300`}>
          {card.icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{card.title}</h3>
        </div>
      </div>
      <p className="text-gray-600 text-sm leading-relaxed">{card.description}</p>
      <div className="mt-4 flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-700">
        <span>انتقل إلى {card.title}</span>
        <svg className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </div>
    </div>
  </Link>
);

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
      <StatCard icon={<Trophy />} title="متوسط الدرجات" value={stats.averageScore ? `${Number(stats.averageScore).toFixed(1)}%` : 'N/A'} color="purple" />
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









