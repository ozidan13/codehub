'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { BookOpen, ExternalLink, Star, Clock, CheckCircle, XCircle, AlertTriangle, Users, DollarSign, Calendar, Play, Lock, Unlock, RefreshCw, Upload, FileText, X, Wallet } from 'lucide-react'
import { formatDate } from '@/lib/dateUtils'
import { Platform, Task, Enrollment } from '@/types'

export default function PlatformsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [userBalance, setUserBalance] = useState(0)

  const fetchUserBalance = useCallback(async () => {
    try {
      const response = await fetch('/api/wallet')
      if (response.ok) {
        const data = await response.json()
        const balance = parseFloat(data.balance) || 0
        setUserBalance(balance)
      }
    } catch (error) {
      console.error('Error fetching balance:', error)
    }
  }, [])

  const fetchData = useCallback(async () => {
    if (status !== 'authenticated') return
    setIsLoading(true)
    try {
      const [platformsRes, enrollmentsRes] = await Promise.all([
        fetch('/api/platforms?include_tasks=true'),
        fetch('/api/enrollments')
      ])
      
      if (platformsRes.ok) {
        const platformsData = await platformsRes.json()
        setPlatforms(platformsData.platforms || [])
      }
      
      if (enrollmentsRes.ok) {
        const enrollmentsData = await enrollmentsRes.json()
        setEnrollments(enrollmentsData.enrollments || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [status])

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
    fetchData()
    fetchUserBalance()
  }, [session, status, router, fetchData])

  const handlePlatformEnrollment = () => {
    fetchData()
    fetchUserBalance()
  }

  const handleTaskSubmit = (task: Task) => {
    setSelectedTask(task)
    setShowSubmissionModal(true)
  }

  const handleSubmissionSubmit = async (taskId: string, summary: string) => {
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, summary }),
      })

      if (response.ok) {
        alert('تم رفع الحل بنجاح!')
        fetchData() // Refresh data to update task status
      } else {
        const error = await response.json()
        alert(error.error || 'فشل في رفع الحل')
      }
    } catch (error) {
      console.error('Submission error:', error)
      alert('حدث خطأ أثناء رفع الحل')
    }
  }

  const handleSubmissionSuccess = () => {
    setShowSubmissionModal(false)
    setSelectedTask(null)
    fetchData()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="loader h-12 w-12 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">جاري تحميل المنصات...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
              المنصات التعليمية والاشتراكات
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              اكتشف واشترك في المنصات التعليمية المتميزة وإدارة اشتراكاتك بسهولة
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{platforms.length}</p>
                  <p className="text-sm text-gray-600">منصة متاحة</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{enrollments.length}</p>
                  <p className="text-sm text-gray-600">اشتراك نشط</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{userBalance.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">رصيدك الحالي</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <PlatformsSection platforms={platforms} enrollments={enrollments} userBalance={userBalance} onPlatformEnrollment={handlePlatformEnrollment} onTaskSubmit={handleTaskSubmit} />
        
        {showSubmissionModal && selectedTask && (
          <SubmissionModal 
            isOpen={showSubmissionModal}
            task={selectedTask}
            onClose={() => setShowSubmissionModal(false)}
            onSubmit={handleSubmissionSubmit}
          />
        )}
      </div>
    </div>
  )
}

const SubmissionModal = ({ 
  isOpen, 
  onClose, 
  task, 
  onSubmit 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  task: Task | null; 
  onSubmit: (taskId: string, summary: string) => void; 
}) => {
  const [summary, setSummary] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!task || !summary.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit(task.id, summary)
      setSummary('')
      onClose()
    } catch (error) {
      console.error('Submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !task) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg m-4 animate-scale-in border border-gray-200">
        <div className="flex items-center space-x-3 space-x-reverse mb-6">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Upload className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">رفع حل المهمة</h2>
            <p className="text-sm text-gray-600">{task.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {task.link && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <a href={task.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-2 space-x-reverse text-blue-700 hover:text-blue-900 font-medium transition-colors">
                <ExternalLink className="h-4 w-4" />
                <span>عرض رابط المهمة</span>
              </a>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              ملخص الحل *
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="اكتب ملخصاً مفصلاً عن الحل الذي قمت بتطبيقه، الخطوات المتبعة، والنتائج المحققة..."
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 resize-none"
              rows={5}
              required
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">الحد الأدنى: 50 حرف</span>
              <span className={`text-xs font-medium ${
                summary.length < 50 ? 'text-red-500' : 'text-green-600'
              }`}>
                {summary.length} حرف
              </span>
            </div>
          </div>
          
          <div className="flex space-x-4 space-x-reverse pt-4 border-t border-gray-200">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isSubmitting}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-all duration-300 font-semibold border border-gray-200 hover:border-gray-300"
            >
              إلغاء
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || !summary.trim() || summary.length < 50} 
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2 space-x-reverse"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>جاري الإرسال...</span>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  <span>إرسال الحل</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const PlatformsSection = ({ platforms, enrollments, userBalance, onPlatformEnrollment, onTaskSubmit }: { platforms: Platform[]; enrollments: Enrollment[]; userBalance: number; onPlatformEnrollment: () => void; onTaskSubmit: (task: Task) => void }) => {
  if (platforms.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="text-gray-400 mb-4">
          <BookOpen className="h-16 w-16 mx-auto" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">لا توجد منصات متاحة</h3>
        <p className="text-gray-600">لا توجد منصات تعليمية متاحة حالياً</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-10">
      {/* Section Header */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-3 space-x-reverse bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-3 rounded-2xl border border-blue-200">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">المنصات التعليمية</h2>
            <p className="text-gray-600 text-sm">اختر المنصة المناسبة لك وابدأ رحلة التعلم</p>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500 bg-white px-4 py-2 rounded-full border border-gray-200 inline-block">
          📚 {platforms.length} منصة متاحة للتعلم
        </div>
      </div>
      
      {/* Platforms Grid - Vertical Layout */}
      <div className="space-y-8">
        {platforms.map((platform, index) => (
          <div key={platform.id} className="relative">
            {/* Platform Number Badge */}
            <div className="absolute -right-4 top-8 z-10">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                {index + 1}
              </div>
            </div>
            
            <PlatformCard 
              key={platform.id} 
              platform={platform} 
              userBalance={userBalance} 
              onEnrollment={onPlatformEnrollment} 
              enrollments={enrollments}
              onTaskSubmit={onTaskSubmit}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

const PlatformCard = ({ 
  platform, 
  userBalance, 
  onEnrollment, 
  enrollments, 
  onTaskSubmit 
}: { 
  platform: Platform; 
  userBalance: number; 
  onEnrollment: () => void;
  enrollments: Enrollment[];
  onTaskSubmit: (task: Task) => void;
}) => {
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [isRenewing, setIsRenewing] = useState(false)
  
  // Check if user is enrolled in this platform
  const enrollment = enrollments.find(e => e.platformId === platform.id)
  const isEnrolled = !!enrollment
  const isExpired = enrollment && new Date(enrollment.expiresAt) < new Date()
  const isExpiringSoon = enrollment && !isExpired && 
    new Date(enrollment.expiresAt).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000
  
  // Calculate days remaining
  const daysRemaining = enrollment ? Math.ceil((new Date(enrollment.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0

  const handleEnroll = async () => {
    if (platform.isPaid && userBalance < platform.price) {
      alert('رصيدك غير كافي للاشتراك في هذه المنصة')
      return
    }

    setIsEnrolling(true)
    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platformId: platform.id })
      })

      if (response.ok) {
        onEnrollment()
        alert('تم الاشتراك بنجاح!')
      } else {
        const error = await response.json()
        alert(error.error || 'فشل في الاشتراك')
      }
    } catch (error) {
      console.error('Enrollment error:', error)
      alert('حدث خطأ أثناء الاشتراك')
    } finally {
      setIsEnrolling(false)
    }
  }

  const handleRenew = async () => {
    setIsRenewing(true)
    try {
      const response = await fetch('/api/enrollments/renew', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platformId: platform.id,
          amount: platform.price || 0,
        }),
      })

      if (response.ok) {
        onEnrollment()
        alert('تم تجديد الاشتراك بنجاح!')
      } else {
        const error = await response.json()
        alert(error.error || 'فشل في تجديد الاشتراك')
      }
    } catch (error) {
      console.error('Renewal error:', error)
      alert('حدث خطأ أثناء تجديد الاشتراك')
    } finally {
      setIsRenewing(false)
    }
  }

  const canAfford = !platform.isPaid || userBalance >= platform.price

  return (
    <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.01] mr-4">
      {/* Platform Header with Enhanced Design */}
      <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-8">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black/10">
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{platform.name}</h3>
                <p className="text-blue-100 text-sm leading-relaxed max-w-md">{platform.description}</p>
              </div>
            </div>
            
            {/* Enhanced Enrollment Status Badge */}
            {isEnrolled && (
              <div className={`px-4 py-2 rounded-full text-sm font-bold backdrop-blur-sm border-2 ${
                isExpired 
                  ? 'bg-red-500/90 text-white border-red-300' 
                  : isExpiringSoon 
                  ? 'bg-amber-500/90 text-white border-amber-300'
                  : 'bg-green-500/90 text-white border-green-300'
              }`}>
                {isExpired ? '⚠️ منتهي الصلاحية' : isExpiringSoon ? `⏰ ${daysRemaining} أيام متبقية` : '✅ مشترك'}
              </div>
            )}
          </div>
          
          {/* Enhanced Platform Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="text-2xl font-bold text-white mb-1">{platform.tasks?.length || 0}</div>
              <div className="text-xs text-blue-100 font-medium">مهمة تفاعلية</div>
            </div>
            <div className="text-center p-4 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="text-2xl font-bold text-white mb-1">
                {platform.difficulty === 'easy' ? '🟢' : platform.difficulty === 'medium' ? '🟡' : '🔴'}
              </div>
              <div className="text-xs text-blue-100 font-medium">
                {platform.difficulty === 'easy' ? 'سهل' : platform.difficulty === 'medium' ? 'متوسط' : 'صعب'}
              </div>
            </div>
            <div className="text-center p-4 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="text-2xl font-bold text-white mb-1">{platform.price} جنية</div>
              <div className="text-xs text-blue-100 font-medium">شهرياً</div>
            </div>
          </div>
          
          {/* Expiration Date */}
          {enrollment && (
            <div className="mt-4 flex items-center space-x-3 space-x-reverse text-sm text-blue-100 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20">
              <Calendar className="h-5 w-5" />
              <span>📅 ينتهي في: {new Date(enrollment.expiresAt).toLocaleDateString('ar-EG')}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Platform Content with Better Spacing */}
      <div className="p-8">
        {/* Tasks Section */}
        {isEnrolled && !isExpired ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-bold text-gray-800 flex items-center space-x-3 space-x-reverse">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <span>المهام المتاحة</span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {platform.tasks?.length || 0}
                </span>
              </h4>
            </div>
            <div className="grid gap-6">
              {platform.tasks?.map((task) => (
                <TaskCard key={task.id} task={task} onSubmit={onTaskSubmit} />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-bold text-gray-800 flex items-center space-x-3 space-x-reverse">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <FileText className="h-5 w-5 text-gray-500" />
                </div>
                <span>معاينة المهام</span>
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-semibold">
                  {platform.tasks?.length || 0}
                </span>
              </h4>
              <div className="text-sm text-gray-500 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                🔒 اشترك للوصول الكامل
              </div>
            </div>
            <div className="grid gap-6">
              {platform.tasks?.slice(0, 2).map((task) => (
                <TaskCard key={task.id} task={task} isPreview={true} />
              ))}
              {(platform.tasks?.length || 0) > 2 && (
                <div className="text-center py-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-300">
                  <div className="text-gray-600 text-lg font-semibold mb-2">
                    +{(platform.tasks?.length || 0) - 2} مهام إضافية
                  </div>
                  <div className="text-gray-500 text-sm">
                    اشترك الآن للوصول إلى جميع المهام
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Enhanced Balance and Price Info */}
        <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 via-blue-50 to-purple-50 rounded-2xl border border-gray-200 shadow-inner">
          <h5 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2 space-x-reverse">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <span>معلومات الرصيد والسعر</span>
          </h5>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-white rounded-xl">
              <span className="text-gray-600 font-medium">💰 رصيدك الحالي:</span>
              <span className="font-bold text-gray-800 text-lg">{(typeof userBalance === 'number' ? userBalance : 0).toFixed(2)} جنية</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-xl">
              <span className="text-gray-600 font-medium">💳 سعر {isEnrolled ? 'التجديد' : 'الاشتراك'}:</span>
              <span className="font-bold text-blue-600 text-lg">{platform.price} جنية</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-xl border-2 border-dashed border-gray-200">
              <span className="text-gray-600 font-medium">📊 الرصيد بعد العملية:</span>
              <span className={`font-bold text-lg ${
                canAfford ? 'text-green-600' : 'text-red-600'
              }`}>
                {(typeof userBalance === 'number' ? userBalance - platform.price : -platform.price).toFixed(2)} جنية
              </span>
            </div>
          </div>
        </div>
        
        {/* Enhanced Action Button */}
        <div className="mt-8">
          {isEnrolled ? (
            (isExpired || isExpiringSoon) ? (
              <button
                onClick={handleRenew}
                disabled={isRenewing || !canAfford}
                className={`w-full py-4 px-8 rounded-2xl text-lg font-bold transition-all duration-300 flex items-center justify-center space-x-3 space-x-reverse ${
                  canAfford
                    ? 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white shadow-xl hover:shadow-2xl transform hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                } disabled:opacity-50`}
              >
                {isRenewing ? (
                  <>
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    <span>جاري التجديد...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-6 w-6" />
                    <span>🔄 جدد الاشتراك الآن</span>
                  </>
                )}
              </button>
            ) : (
              <div className="w-full py-4 px-8 rounded-2xl text-lg font-bold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-center border-2 border-green-200 shadow-lg">
                ✅ مشترك بالفعل - استمتع بالتعلم!
              </div>
            )
          ) : (
            <button
              onClick={handleEnroll}
              disabled={isEnrolling || !canAfford}
              className={`w-full py-4 px-8 rounded-2xl text-lg font-bold transition-all duration-300 flex items-center justify-center space-x-3 space-x-reverse ${
                canAfford
                  ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-600 text-white shadow-xl hover:shadow-2xl transform hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              } disabled:opacity-50`}
            >
              {isEnrolling ? (
                <>
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span>جاري الاشتراك...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-6 w-6" />
                  <span>🚀 اشترك الآن وابدأ التعلم</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper function to get task status based on submissions (like in backup.tsx)
const getTaskStatus = (task: Task) => {
  const submission = task.submissions?.[0];
  if (submission?.status === 'APPROVED') return { status: 'completed', color: 'text-green-500', icon: CheckCircle, text: 'مكتمل' };
  if (submission?.status === 'PENDING') return { status: 'pending', color: 'text-yellow-500', icon: Clock, text: 'قيد المراجعة' };
  if (submission?.status === 'REJECTED') return { status: 'rejected', color: 'text-red-500', icon: X, text: 'مرفوض' };
  return { status: 'not_started', color: 'text-gray-400', icon: Star, text: 'لم يبدأ' };
};

const TaskCard = ({ task, isPreview = false, onSubmit }: { task: Task; isPreview?: boolean; onSubmit?: (task: Task) => void }) => {
  const taskStatus = getTaskStatus(task);
  const StatusIcon = taskStatus.icon;
  const difficultyMap = { EASY: 'سهل', MEDIUM: 'متوسط', HARD: 'صعب' };
  const difficultyColors = {
    EASY: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HARD: 'bg-red-100 text-red-800',
  };

  const handleClick = () => {
    if (!isPreview && onSubmit && taskStatus.status !== 'completed') {
      onSubmit(task);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`bg-white border border-gray-200 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:border-blue-300 transform hover:scale-[1.02] ${
        isPreview 
          ? 'opacity-60 cursor-default' 
          : taskStatus.status !== 'completed' && onSubmit ? 'cursor-pointer group' : 'cursor-default'
      }`}
    >
      {/* Task Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className={`font-bold text-gray-800 text-lg leading-tight mb-2 ${
            !isPreview && onSubmit && taskStatus.status !== 'completed' ? 'group-hover:text-blue-600' : ''
          } transition-colors`}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        <div className="mr-4 flex-shrink-0">
          <StatusIcon className={`h-6 w-6 ${taskStatus.color} transition-colors`} />
        </div>
      </div>
      
      {/* Task Metadata */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-3 space-x-reverse">
          {task.difficulty && (
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${difficultyColors[task.difficulty]}`}>
              {difficultyMap[task.difficulty]}
            </span>
          )}
          
          {task.points && (
            <div className="flex items-center space-x-1 space-x-reverse text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full">
              <Star className="h-3.5 w-3.5 text-yellow-500" />
              <span className="font-medium">{task.points} نقطة</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          <span className={`text-sm font-semibold ${taskStatus.color}`}>
            {taskStatus.text}
          </span>
        </div>
      </div>
      
      {/* Action Buttons */}
      {!isPreview && (
        <div className="flex space-x-3 space-x-reverse mt-4 pt-4 border-t border-gray-100">
          {task.link && (
            <a
              href={task.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md transform hover:scale-105"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-4 w-4" />
              <span>عرض المهمة</span>
            </a>
          )}
          
          {taskStatus.status === 'completed' ? (
            <div className="flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2.5 bg-green-100 text-green-700 rounded-xl text-sm font-medium">
              <CheckCircle className="h-4 w-4" />
              <span>تم الإنجاز بنجاح</span>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onSubmit) onSubmit(task);
              }}
              className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md transform hover:scale-105 ${
                taskStatus.status === 'pending'
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : taskStatus.status === 'rejected'
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              <Upload className="h-4 w-4" />
              <span>
                {taskStatus.status === 'pending' ? 'تحديث الحل' : 
                 taskStatus.status === 'rejected' ? 'إعادة الإرسال' : 'رفع الحل'}
              </span>
            </button>
          )}
        </div>
      )}
      
      {/* Preview Mode Overlay */}
      {isPreview && (
        <div className="absolute inset-0 bg-gray-900/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-sm px-6 py-3 rounded-xl border border-gray-200 shadow-lg">
            <span className="text-sm font-semibold text-gray-700">🔒 اشترك للوصول إلى المهام</span>
          </div>
        </div>
      )}
    </div>
  )
}