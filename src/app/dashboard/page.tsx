'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { BookOpen, Clock, CheckCircle, Upload, X, FileText, Trophy, Target, TrendingUp, LogOut, User, Calendar, Award } from 'lucide-react'

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
  averageScore: number;
}

// Cache implementation
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

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)
  const [submissionText, setSubmissionText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }
    if (session.user.role === 'ADMIN') {
      router.push('/admin')
      return
    }
    
    fetchData()
  }, [session, status, router])

  const fetchData = useCallback(async () => {
    try {
      // Check cache first
      const cachedPlatforms = dataCache.get('platforms')
      const cachedStats = dataCache.get('student-stats')
      
      if (cachedPlatforms && cachedStats) {
        setPlatforms(cachedPlatforms)
        setStats(cachedStats)
        setLoading(false)
        return
      }
      
      const [platformsRes, statsRes] = await Promise.all([
        fetch('/api/platforms?include_tasks=true'),
        fetch('/api/dashboard/student-stats')
      ])
      
      if (platformsRes.ok) {
        const platformsData = await platformsRes.json()
        setPlatforms(platformsData.platforms || [])
        dataCache.set('platforms', platformsData.platforms || [])
      }
      
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
        dataCache.set('student-stats', statsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const getTaskStatus = (task: Task) => {
    const submissionCount = task._count?.submissions || 0;
    if (submissionCount === 0) {
      return { status: 'not_started', color: 'gray', icon: Clock, text: 'لم يبدأ' };
    }

    const latestSubmission = task.submissions?.[0];
    if (!latestSubmission) {
      return { status: 'in_progress', color: 'blue', icon: Clock, text: 'بدأت' };
    }

    switch (latestSubmission.status) {
      case 'APPROVED':
        return { status: 'completed', color: 'green', icon: CheckCircle, text: 'مكتمل' };
      case 'PENDING':
        return { status: 'pending', color: 'yellow', icon: Clock, text: 'قيد المراجعة' };
      case 'REJECTED':
        return { status: 'rejected', color: 'red', icon: X, text: 'مرفوض' };
      default:
        return { status: 'not_started', color: 'gray', icon: Clock, text: 'لم يبدأ' };
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setShowSubmissionModal(true)
  }

  const handleSubmission = async () => {
    if (!selectedTask) return
    
    setSubmitting(true)
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          taskId: selectedTask.id,
          summary: submissionText
        })
      })
      
      if (response.ok) {
        setShowSubmissionModal(false)
        setSubmissionText('')
        setSelectedTask(null)
        // Clear cache and refresh data
        dataCache.clear()
        fetchData()
      }
    } catch (error) {
      console.error('Error submitting:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'سهل'
      case 'MEDIUM': return 'متوسط'
      case 'HARD': return 'صعب'
      default: return difficulty
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium">جاري تحميل البيانات...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" dir="rtl">
      {/* Header */}
      <div className="relative bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  لوحة التعلم
                </h1>
                <p className="text-gray-600">مرحباً بك، {session?.user?.name}!</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <LogOut className="h-4 w-4" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6 transition-shadow duration-300 hover:shadow-md">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div className="mr-4">
                    <p className="text-sm font-medium text-gray-600">إجمالي التسليمات</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalSubmissions}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 transition-shadow duration-300 hover:shadow-md">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="mr-4">
                    <p className="text-sm font-medium text-gray-600">المقبولة</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.approvedSubmissions}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 transition-shadow duration-300 hover:shadow-md">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div className="mr-4">
                    <p className="text-sm font-medium text-gray-600">قيد المراجعة</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pendingSubmissions}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 transition-shadow duration-300 hover:shadow-md">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <X className="h-6 w-6 text-white" />
                  </div>
                  <div className="mr-4">
                    <p className="text-sm font-medium text-gray-600">المرفوضة</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.rejectedSubmissions}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 transition-shadow duration-300 hover:shadow-md">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <div className="mr-4">
                    <p className="text-sm font-medium text-gray-600">متوسط النقاط</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.averageScore ? stats.averageScore.toFixed(1) : 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* Platforms and Tasks */}
        <div className="space-y-8">
          {platforms.map((platform) => (
            <div key={platform.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-6 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-b border-white/20">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div className="mr-4">
                    <h2 className="text-xl font-bold text-gray-900">{platform.name}</h2>
                    <p className="text-gray-600">{platform.description}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {platform.tasks.map((task) => {
                    const taskStatus = getTaskStatus(task)
                    const StatusIcon = taskStatus.icon
                    
                    return (
                      <div
                        key={task.id}
                        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-300"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="font-bold text-gray-900 text-lg">{task.title}</h3>
                          <div className={`p-2 rounded-xl ${
                            taskStatus.color === 'green' ? 'bg-green-100' :
                            taskStatus.color === 'yellow' ? 'bg-yellow-100' :
                            taskStatus.color === 'red' ? 'bg-red-100' :
                            'bg-gray-100'
                          }`}>
                            <StatusIcon className={`h-5 w-5 ${
                              taskStatus.color === 'green' ? 'text-green-600' :
                              taskStatus.color === 'yellow' ? 'text-yellow-600' :
                              taskStatus.color === 'red' ? 'text-red-600' :
                              'text-gray-600'
                            }`} />
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-4 leading-relaxed">{task.description}</p>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold ${
                              task.difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                              task.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {getDifficultyText(task.difficulty)}
                            </span>
                            
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <span className={`text-xs font-medium ${
                                taskStatus.color === 'green' ? 'text-green-600' :
                                taskStatus.color === 'yellow' ? 'text-yellow-600' :
                                taskStatus.color === 'red' ? 'text-red-600' :
                                'text-gray-600'
                              }`}>
                                {taskStatus.text}
                              </span>
                              
                              {task._count && task._count.submissions > 0 && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                                  {task._count.submissions} محاولة
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex space-x-2 space-x-reverse">
                            {task.link && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.open(task.link, '_blank')
                                }}
                                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-2 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm font-medium flex items-center justify-center space-x-2 space-x-reverse"
                              >
                                <BookOpen className="h-4 w-4" />
                                <span>عرض المهمة</span>
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleTaskClick(task)
                              }}
                              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm font-medium flex items-center justify-center space-x-2 space-x-reverse"
                            >
                              <Upload className="h-4 w-4" />
                              <span>تسليم الحل</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submission Modal */}
      {showSubmissionModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl max-w-md w-full p-8 shadow-2xl border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">تسليم المهمة: {selectedTask.title}</h3>
              <button
                onClick={() => setShowSubmissionModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  وصف الحل
                </label>
                <textarea
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 shadow-inner text-gray-900 placeholder-gray-500"
                  rows={4}
                  placeholder="اشرح حلك للمهمة..."
                />
              </div>
              

              
              <div className="flex space-x-3 space-x-reverse">
                <button
                  onClick={handleSubmission}
                  disabled={submitting || !submissionText.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-6 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center space-x-2 space-x-reverse">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>جاري التسليم...</span>
                    </div>
                  ) : (
                    'تسليم'
                  )}
                </button>
                <button
                  onClick={() => setShowSubmissionModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-6 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}