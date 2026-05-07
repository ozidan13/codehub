'use client'

import { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

import { dataCache } from '@/lib/dataCache'
import { Platform, Task, StudentStats, WalletData, Enrollment } from '@/types'

import PageLoader from '@/components/student-dashboard/PageLoader'
import PlatformHub from '@/components/student-dashboard/PlatformHub'
import StatsSection from '@/components/student-dashboard/StatsSection'
import WalletSection from '@/components/student-dashboard/WalletSection'
import ExpirationNotifications from '@/components/student-dashboard/ExpirationNotifications'
import PlatformCard from '@/components/student-dashboard/PlatformCard'
import PlatformCardSkeleton from '@/components/student-dashboard/PlatformCardSkeleton'

const SubmissionModal = lazy(() => import('@/components/student-dashboard/SubmissionModal'))

// --- MAIN DASHBOARD PAGE COMPONENT ---
export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // --- PER-SECTION STATE ---
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [platformsLoading, setPlatformsLoading] = useState(true)

  const [stats, setStats] = useState<StudentStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [walletLoading, setWalletLoading] = useState(true)

  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true)

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)

  // --- INDEPENDENT DATA FETCHERS ---
  const fetchPlatforms = useCallback(async () => {
    if (status !== 'authenticated') return
    setPlatformsLoading(true)
    try {
      const cached = dataCache.get('platforms')
      if (cached) {
        setPlatforms(cached as Platform[])
        setPlatformsLoading(false)
        return
      }
      const res = await fetch('/api/platforms?include_tasks=true')
      if (res.ok) {
        const data = await res.json()
        const list = data.platforms || []
        setPlatforms(list)
        dataCache.set('platforms', list)
      }
    } catch (error) {
      console.error('Error fetching platforms:', error)
    } finally {
      setPlatformsLoading(false)
    }
  }, [status])

  const fetchStats = useCallback(async () => {
    if (status !== 'authenticated') return
    setStatsLoading(true)
    try {
      const cached = dataCache.get('stats')
      if (cached) {
        setStats(cached as StudentStats)
        setStatsLoading(false)
        return
      }
      const res = await fetch('/api/student/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
        dataCache.set('stats', data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }, [status])

  const fetchWallet = useCallback(async () => {
    if (status !== 'authenticated') return
    setWalletLoading(true)
    try {
      const cached = dataCache.get('wallet')
      if (cached) {
        setWallet(cached as WalletData)
        setWalletLoading(false)
        return
      }
      const res = await fetch('/api/wallet')
      if (res.ok) {
        const data = await res.json()
        setWallet(data)
        dataCache.set('wallet', data)
      }
    } catch (error) {
      console.error('Error fetching wallet:', error)
    } finally {
      setWalletLoading(false)
    }
  }, [status])

  const fetchEnrollments = useCallback(async () => {
    if (status !== 'authenticated') return
    setEnrollmentsLoading(true)
    try {
      const cached = dataCache.get('enrollments')
      if (cached) {
        setEnrollments(cached as Enrollment[])
        setEnrollmentsLoading(false)
        return
      }
      const res = await fetch('/api/enrollments')
      if (res.ok) {
        const data = await res.json()
        const list = data.enrollments || []
        setEnrollments(list)
        dataCache.set('enrollments', list)
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error)
    } finally {
      setEnrollmentsLoading(false)
    }
  }, [status])

  // --- EFFECTS ---
  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (session?.user?.role === 'ADMIN') {
      router.push('/admin')
      return
    }
    // Fire all fetches independently so each section resolves on its own
    fetchPlatforms()
    fetchStats()
    fetchWallet()
    fetchEnrollments()
  }, [session, status, router, fetchPlatforms, fetchStats, fetchWallet, fetchEnrollments])

  // --- TARGETED HANDLERS (only refresh affected sections) ---
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setShowSubmissionModal(true)
  }

  const handleSubmissionSuccess = () => {
    setShowSubmissionModal(false)
    // Submission affects stats and platform task statuses
    dataCache.delete('stats')
    dataCache.delete('platforms')
    fetchStats()
    fetchPlatforms()
  }

  const handleTopUpSuccess = () => {
    // Top-up only affects wallet
    dataCache.delete('wallet')
    fetchWallet()
  }

  const handleEnrollmentSuccess = () => {
    // Enrollment affects platforms (status), enrollments list, and wallet (if paid)
    dataCache.delete('platforms')
    dataCache.delete('enrollments')
    dataCache.delete('wallet')
    fetchPlatforms()
    fetchEnrollments()
    fetchWallet()
  }

  const orderedPlatforms = [...platforms].sort((a, b) => {
    const isJavaScriptA = a.name.includes('JavaScript Tasks')
    const isJavaScriptB = b.name.includes('JavaScript Tasks')
    if (isJavaScriptA && !isJavaScriptB) return -1
    if (!isJavaScriptA && isJavaScriptB) return 1
    return 0
  })

  // --- RENDER LOGIC ---
  return (
    <div className="min-h-screen w-full bg-[#0B0F1E]" dir="rtl">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">

        {/* Full-Width Platform Hub */}
        <div className="mb-8">
          {platformsLoading || enrollmentsLoading ? (
            <PageLoader compact title="جاري تحميل المنصات..." subtitle="يتم جلب بيانات المنصات التعليمية." />
          ) : (
            <PlatformHub platforms={orderedPlatforms} enrollments={enrollments} />
          )}
        </div>

        {/* Two-Column Content Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 xl:gap-8 max-w-none">
          {/* Left Column - Stats & Wallet */}
          <div className="xl:col-span-1 space-y-6">
            {statsLoading ? (
              <PageLoader compact title="جاري تحميل الإحصائيات..." subtitle="يتم حساب أدائك." />
            ) : (
              <StatsSection stats={stats} />
            )}
            {walletLoading ? (
              <PageLoader compact title="جاري تحميل المحفظة..." subtitle="يتم جلب رصيدك." />
            ) : (
              <WalletSection wallet={wallet} onTopUp={handleTopUpSuccess} />
            )}
            <ExpirationNotifications enrollments={enrollments} />
          </div>

          {/* Right Column - Platform Cards */}
          <div className="xl:col-span-3">
            {platformsLoading || enrollmentsLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <PlatformCardSkeleton />
                <PlatformCardSkeleton />
                <PlatformCardSkeleton />
              </div>
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
