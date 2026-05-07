'use client'

import { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

import { dataCache } from '@/lib/dataCache'
import { Platform, Task, StudentStats, WalletData, Enrollment, Transaction } from '@/types'

import PageLoader from '@/components/student-dashboard/PageLoader'
import PlatformHub from '@/components/student-dashboard/PlatformHub'
import StatsSection from '@/components/student-dashboard/StatsSection'
import WalletSection from '@/components/student-dashboard/WalletSection'
import ExpirationNotifications from '@/components/student-dashboard/ExpirationNotifications'
import PlatformCard from '@/components/student-dashboard/PlatformCard'

const SubmissionModal = lazy(() => import('@/components/student-dashboard/SubmissionModal'))

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

  const [isContentLoading, setIsContentLoading] = useState(true)
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
    fetchData();
  }, [session, status, router, fetchData]);

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
  return (
    <div className="min-h-screen w-full bg-[#0B0F1E]" dir="rtl">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">

            {/* Full-Width Platform Hub */}
            <div className="mb-8">
              {isContentLoading ? (
                <PageLoader compact title="جاري تحميل المنصات..." subtitle="يتم جلب بيانات المنصات التعليمية." />
              ) : (
                <PlatformHub platforms={orderedPlatforms} enrollments={enrollments} />
              )}
            </div>

            {/* Two-Column Content Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 xl:gap-8 max-w-none">
              {/* Left Column - Stats & Wallet (25% width on xl screens) */}
              <div className="xl:col-span-1 space-y-6">
                {isContentLoading ? (
                  <PageLoader compact title="جاري تحميل الإحصائيات..." subtitle="يتم حساب أدائك." />
                ) : (
                  <StatsSection stats={stats} />
                )}
                {isContentLoading ? (
                  <PageLoader compact title="جاري تحميل المحفظة..." subtitle="يتم جلب رصيدك." />
                ) : (
                  <WalletSection wallet={wallet} onTopUp={handleTopUpSuccess} />
                )}
                <ExpirationNotifications enrollments={enrollments} />
              </div>

              {/* Right Column - Platform Cards (75% width on xl screens) */}
              <div className="xl:col-span-3">
                {isContentLoading ? (
                  <PageLoader compact title="جاري تحميل المهام..." subtitle="يتم جلب بيانات المنصات والمهام." />
                ) : (
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
                )}
              </div>
            </div>
      </div>

      {showSubmissionModal && selectedTask && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <SubmissionModal
            task={selectedTask}
            onClose={() => setShowSubmissionModal(false)}
            onSuccess={handleSubmissionSuccess}
          />
        </Suspense>
      )}



      
    </div>
  )
}
