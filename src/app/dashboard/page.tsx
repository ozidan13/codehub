'use client'

import { useState, useEffect, useCallback, FC, ReactNode } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { BookOpen, Clock, CheckCircle, X, FileText, Trophy, LogOut, RefreshCw, Star, Wallet, CreditCard, Users, ShoppingCart, XCircle, Play } from 'lucide-react'

// --- INTERFACES ---
interface Platform {
  id: string
  name: string
  description: string
  price?: number
  isPaid: boolean
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

interface WalletData {
  balance: number;
}

interface Enrollment {
  id: string;
  createdAt: string;
  expiresAt?: string;
  isExpired?: boolean;
  daysRemaining?: number;
  status?: 'active' | 'expiring_soon' | 'expired';
  platform: {
    id: string;
    name: string;
    description: string;
    url: string;
    price: number | null;
    isPaid: boolean;
  };
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
}

interface MentorshipData {
  mentor: {
    id: string;
    name: string;
    mentorBio: string;
    mentorRate: number;
  };
  pricing: {
    recordedSession: number;
    faceToFaceSession: number;
  };
  availableDates: {
    id: string;
    date: string;
    timeSlot: string;
    isBooked: boolean;
  }[];
  recordedSessions: {
    id: string;
    title: string;
    description: string;
    videoLink: string;
    price: number;
    isActive: boolean;
  }[];
  bookings: {
    id: string;
    duration: number;
    amount: number;
    status: string;
    sessionType: 'RECORDED' | 'FACE_TO_FACE';
    sessionDate: string | null;
    videoLink: string | null;
    meetingLink: string | null;
    whatsappNumber: string | null;
    studentNotes: string | null;
    adminNotes: string | null;
    createdAt: string;
    mentor: {
      name: string;
    };
  }[];
}

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
  const [mentorshipData, setMentorshipData] = useState<MentorshipData | null>(null)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [isContentLoading, setIsContentLoading] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)
  const [showTopUpModal, setShowTopUpModal] = useState(false)
  const [showMentorshipModal, setShowMentorshipModal] = useState(false)

  // --- DATA FETCHING ---
  const fetchData = useCallback(async () => {
    if (status !== 'authenticated') return;
    setIsContentLoading(true);
    try {
      const [platformsRes, statsRes, walletRes, enrollmentsRes, transactionsRes, mentorshipRes, availableDatesRes] = await Promise.all([
        fetch('/api/platforms?include_tasks=true'),
        fetch('/api/dashboard/student-stats'),
        fetch('/api/wallet'),
        fetch('/api/enrollments'),
        fetch('/api/transactions?limit=5'),
        fetch('/api/mentorship'),
        fetch('/api/mentorship/available-dates')
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

      if (mentorshipRes.ok) {
        const data = await mentorshipRes.json();
        
        // Merge available dates from dedicated endpoint
        if (availableDatesRes.ok) {
          const datesData = await availableDatesRes.json();
          data.availableDates = Array.isArray(datesData) ? datesData : (datesData.availableDates || []);
        }
        
        setMentorshipData(data);
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
    setShowTopUpModal(false);
    handleRefresh();
  }

  const handleEnrollmentSuccess = () => {
    handleRefresh();
  }

  const handleMentorshipSuccess = () => {
    setShowMentorshipModal(false);
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
            <ExpirationNotifications enrollments={enrollments} />
            <WalletSection wallet={wallet} onTopUp={() => setShowTopUpModal(true)} />
            <EnrollmentsSection enrollments={enrollments} onEnrollmentRenewal={handleEnrollmentSuccess} />
            <MentorshipSection mentorshipData={mentorshipData} onBookMentorship={() => setShowMentorshipModal(true)} />
            <div className="space-y-12 mt-10">
              {platforms.map((platform) => (
                <PlatformCard key={platform.id} platform={platform} enrollments={enrollments} onTaskClick={handleTaskClick} onEnrollmentSuccess={handleEnrollmentSuccess} />
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

      <TopUpModal 
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)} 
        onSuccess={handleTopUpSuccess} 
      />

      <MentorshipModal 
        isOpen={showMentorshipModal}
        mentorshipData={mentorshipData}
        userBalance={wallet?.balance || 0}
        onClose={() => setShowMentorshipModal(false)} 
        onSuccess={handleMentorshipSuccess} 
      />
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

const WalletSection: FC<{ wallet: WalletData | null; onTopUp: () => void }> = ({ wallet, onTopUp }) => {
  if (!wallet) return null;
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="p-3 rounded-lg bg-gradient-to-br from-green-400 to-green-600 text-white">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">المحفظة الإلكترونية</h2>
            <p className="text-sm text-gray-600">إدارة رصيدك المالي</p>
          </div>
        </div>
        <button
          onClick={onTopUp}
          className="flex items-center space-x-2 space-x-reverse bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-px text-sm font-medium"
        >
          <CreditCard className="h-4 w-4" />
          <span>شحن الرصيد</span>
        </button>
      </div>
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">الرصيد الحالي</p>
          <p className="text-3xl font-bold text-gray-800">$ {Number(wallet.balance).toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

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
};

const EnrollmentsSection: FC<{ enrollments: Enrollment[]; onEnrollmentRenewal: () => void }> = ({ enrollments, onEnrollmentRenewal }) => {
  const [renewingEnrollments, setRenewingEnrollments] = useState<Set<string>>(new Set());

  const handleRenewEnrollment = async (enrollmentId: string) => {
    setRenewingEnrollments(prev => new Set(prev).add(enrollmentId));
    try {
      const response = await fetch('/api/enrollments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId }),
      });
      
      if (response.ok) {
        onEnrollmentRenewal(); // Refresh data
      } else {
        const error = await response.json();
        alert(error.error || 'فشل في تجديد الاشتراك');
      }
    } catch (error) {
      console.error('Renewal error:', error);
      alert('حدث خطأ أثناء تجديد الاشتراك');
    } finally {
      setRenewingEnrollments(prev => {
        const newSet = new Set(prev);
        newSet.delete(enrollmentId);
        return newSet;
      });
    }
  };

  if (enrollments.length === 0) return null;
  
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
      <div className="flex items-center space-x-3 space-x-reverse mb-6">
        <div className="p-3 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 text-white">
          <BookOpen className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">المنصات المشترك بها</h2>
          <p className="text-sm text-gray-600">المنصات التي اشتركت بها</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {enrollments.map((enrollment) => {
          const isRenewing = renewingEnrollments.has(enrollment.id);
          const statusColor = enrollment.status === 'expired' ? 'border-red-200 bg-red-50' : 
                             enrollment.status === 'expiring_soon' ? 'border-yellow-200 bg-yellow-50' : 
                             'border-gray-200 bg-gray-50';
          
          return (
            <div key={enrollment.id} className={`border rounded-xl p-4 ${statusColor}`}>
              <h3 className="font-semibold text-gray-800 mb-2">{enrollment.platform.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{enrollment.platform.description}</p>
              
              {/* Expiration Status */}
              {enrollment.expiresAt && (
                <div className="mb-3">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    enrollment.status === 'expired' ? 'bg-red-100 text-red-800' :
                    enrollment.status === 'expiring_soon' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    <Clock className="h-3 w-3 mr-1" />
                    {enrollment.status === 'expired' ? 'منتهي الصلاحية' :
                     enrollment.status === 'expiring_soon' ? `${enrollment.daysRemaining} أيام متبقية` :
                     `${enrollment.daysRemaining} يوم متبقي`}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center text-xs mb-3">
                <span className={`px-2 py-1 rounded-full font-medium ${
                  enrollment.platform.isPaid ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                }`}>
                  {enrollment.platform.isPaid ? `$${enrollment.platform.price}` : 'مجاني'}
                </span>
                {enrollment.status !== 'expired' && (
                  <a
                    href={enrollment.platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    زيارة المنصة
                  </a>
                )}
              </div>
              
              {/* Renewal Button */}
              {(enrollment.status === 'expired' || enrollment.status === 'expiring_soon') && (
                <button
                  onClick={() => handleRenewEnrollment(enrollment.id)}
                  disabled={isRenewing}
                  className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    enrollment.status === 'expired' 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
                >
                  {isRenewing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {enrollment.status === 'expired' ? 'تجديد الاشتراك' : 'تجديد مبكر'}
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MentorshipSection: FC<{ mentorshipData: MentorshipData | null; onBookMentorship: () => void }> = ({ mentorshipData, onBookMentorship }) => {
  if (!mentorshipData) return null;
  
  // Check if user has purchased any recorded sessions
  const purchasedRecordedSessions = mentorshipData.bookings.filter(
    booking => booking.sessionType === 'RECORDED' && booking.status === 'CONFIRMED'
  );
  
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="p-3 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-white">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">جلسات الإرشاد</h2>
            <p className="text-sm text-gray-600">احجز جلسة إرشاد مع المرشد</p>
          </div>
        </div>
        <button
          onClick={onBookMentorship}
          className="flex items-center space-x-2 space-x-reverse bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-px text-sm font-medium"
        >
          <Users className="h-4 w-4" />
          <span>احجز جلسة</span>
        </button>
      </div>
      
      {/* Recorded Sessions Section */}
      {mentorshipData.recordedSessions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">الجلسات المسجلة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mentorshipData.recordedSessions.map((session) => {
              const isPurchased = purchasedRecordedSessions.some(
                booking => booking.videoLink === session.videoLink
              );
              
              return (
                <div key={session.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 mb-1">{session.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{session.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-blue-600">${Number(session.price).toFixed(2)}</span>
                        {isPurchased ? (
                          <a
                            href={session.videoLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 space-x-reverse bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                          >
                            <Play className="h-4 w-4" />
                            <span>شاهد الآن</span>
                          </a>
                        ) : (
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                            غير مشترى
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
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-2">المرشد: {mentorshipData.mentor.name}</h3>
          <p className="text-sm text-gray-600 mb-3">{mentorshipData.mentor.mentorBio}</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">جلسة مسجلة:</span>
              <span className="font-bold text-orange-600">${mentorshipData.pricing.recordedSession.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">جلسة مباشرة:</span>
              <span className="font-bold text-orange-600">${mentorshipData.pricing.faceToFaceSession.toFixed(2)}/ساعة</span>
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">جلساتك الأخيرة</h3>
          {mentorshipData.bookings.length === 0 ? (
            <p className="text-sm text-gray-500">لا توجد جلسات محجوزة</p>
          ) : (
            <div className="space-y-2">
              {mentorshipData.bookings.slice(0, 3).map((booking) => (
                <div key={booking.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        booking.sessionType === 'RECORDED' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {booking.sessionType === 'RECORDED' ? 'مسجلة' : 'مباشرة'}
                      </span>
                      {booking.sessionType === 'FACE_TO_FACE' && (
                        <span className="text-sm font-medium">{booking.duration} دقيقة</span>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                      booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      booking.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {booking.status === 'CONFIRMED' ? 'مؤكد' :
                       booking.status === 'PENDING' ? 'في الانتظار' :
                       booking.status === 'COMPLETED' ? 'مكتمل' : 'ملغي'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex justify-between items-center">
                      <span>المبلغ: ${Number(booking.amount).toFixed(2)}</span>
                      <span>تاريخ الحجز: {new Date(booking.createdAt).toLocaleDateString('ar-SA')}</span>
                    </div>
                    {booking.sessionDate && (
                      <div className="text-center">
                        <span className="font-medium text-orange-600">
                          موعد الجلسة: {new Date(booking.sessionDate).toLocaleDateString('ar-SA', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                  {booking.videoLink && booking.status === 'COMPLETED' && (
                    <div className="mt-2">
                      <a 
                        href={booking.videoLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-orange-600 hover:text-orange-800 underline"
                      >
                        مشاهدة الفيديو
                      </a>
                    </div>
                  )}
                  {booking.meetingLink && booking.status === 'CONFIRMED' && (
                    <div className="mt-2">
                      <a 
                        href={booking.meetingLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-green-600 hover:text-green-800 underline"
                      >
                        رابط الاجتماع
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{platform.name}</h2>
            <p className="text-sm text-gray-600 mt-1">{platform.description}</p>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            {platform.isPaid && (
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                ${platform.price}
              </span>
            )}
            
            {/* Enrollment Status and Actions */}
            {!isEnrolled ? (
              <button
                onClick={handleEnroll}
                disabled={isEnrolling}
                className="flex items-center space-x-1 space-x-reverse bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors disabled:bg-gray-400"
              >
                <ShoppingCart className="h-3 w-3" />
                <span>{isEnrolling ? 'جاري...' : 'اشترك'}</span>
              </button>
            ) : enrollment?.status === 'expired' ? (
              <button
                onClick={handleRenewEnrollment}
                disabled={isRenewing}
                className="flex items-center space-x-1 space-x-reverse bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors disabled:bg-gray-400"
              >
                <RefreshCw className={`h-3 w-3 ${isRenewing ? 'animate-spin' : ''}`} />
                <span>{isRenewing ? 'جاري...' : 'تجديد'}</span>
              </button>
            ) : enrollment?.status === 'expiring_soon' ? (
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                  {enrollment.daysRemaining} أيام
                </span>
                <button
                  onClick={handleRenewEnrollment}
                  disabled={isRenewing}
                  className="flex items-center space-x-1 space-x-reverse bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors disabled:bg-gray-400"
                >
                  <RefreshCw className={`h-3 w-3 ${isRenewing ? 'animate-spin' : ''}`} />
                  <span>{isRenewing ? 'جاري...' : 'تجديد مبكر'}</span>
                </button>
              </div>
            ) : (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                مشترك
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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

const TopUpModal: FC<{ isOpen: boolean; onClose: () => void; onSuccess: () => void }> = ({ isOpen, onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [senderWalletNumber, setSenderWalletNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      alert('يرجى إدخال مبلغ صحيح');
      return;
    }
    if (!senderWalletNumber.trim()) {
      alert('يرجى إدخال رقم المحفظة المرسل منها');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: parseFloat(amount),
          senderWalletNumber: senderWalletNumber.trim()
        }),
      });
      if (response.ok) {
        onSuccess();
        onClose();
        setAmount('');
        setSenderWalletNumber('');
        alert('تم إرسال طلب الشحن بنجاح. سيتم مراجعته من قبل الإدارة.');
      } else {
        const error = await response.json();
        alert(`فشل في إرسال الطلب: ${error.error}`);
      }
    } catch (error) {
      console.error('Top-up error:', error);
      alert('حدث خطأ أثناء إرسال الطلب.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">شحن الرصيد</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-1">رقم المحفظة للتحويل إليها:</label>
            <div className="text-lg font-bold text-blue-600">01026454497</div>
            <p className="text-xs text-gray-600 mt-1">قم بتحويل المبلغ إلى هذا الرقم ثم أدخل البيانات أدناه</p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">المبلغ (جنيه مصري)</label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="أدخل المبلغ المحول"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">رقم المحفظة المرسل منها</label>
            <input
              type="text"
              value={senderWalletNumber}
              onChange={(e) => setSenderWalletNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="أدخل رقم محفظتك التي حولت منها"
              required
            />
          </div>
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
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400"
            >
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MentorshipModal: FC<{ isOpen: boolean; mentorshipData: MentorshipData | null; userBalance: number; onClose: () => void; onSuccess: () => void }> = ({ isOpen, mentorshipData, userBalance, onClose, onSuccess }) => {
  const [sessionType, setSessionType] = useState<'RECORDED' | 'FACE_TO_FACE'>('RECORDED');
  const duration = '60'; // Fixed 60 minutes for face-to-face sessions
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [selectedDateId, setSelectedDateId] = useState('');
  const [selectedRecordedSessionId, setSelectedRecordedSessionId] = useState('');
  const [studentNotes, setStudentNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">حجز جلسة إرشاد</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">نوع الجلسة</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSessionType('RECORDED')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  sessionType === 'RECORDED'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-sm font-medium">جلسة مسجلة</div>
                <div className="text-xs text-gray-500 mt-1">فيديو جاهز للمشاهدة</div>
              </button>
              <button
                type="button"
                onClick={() => setSessionType('FACE_TO_FACE')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  sessionType === 'FACE_TO_FACE'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-sm font-medium">جلسة مباشرة</div>
                <div className="text-xs text-gray-500 mt-1">لقاء مباشر مع المرشد</div>
              </button>
            </div>
          </div>

          {sessionType === 'RECORDED' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">اختر الجلسة المسجلة</label>
              <select
                value={selectedRecordedSessionId}
                onChange={(e) => setSelectedRecordedSessionId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              >
                <option value="">اختر الجلسة</option>
                {mentorshipData.recordedSessions
                  .filter(session => {
                    const alreadyPurchased = purchasedRecordedSessions.some(
                      booking => booking.videoLink === session.videoLink
                    );
                    return session.isActive && !alreadyPurchased;
                  })
                  .map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.title} - ${Number(session.price).toFixed(2)}
                    </option>
                  ))}
              </select>
              {selectedRecordedSession && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">{selectedRecordedSession.description}</p>
                </div>
              )}
            </div>
          )}

          {sessionType === 'FACE_TO_FACE' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">مدة الجلسة</label>
                <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                  60 دقيقة (ثابت)
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">رقم الواتساب</label>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="مثال: +966501234567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">اختر التاريخ المتاح</label>
                <select
                  value={selectedDateId}
                  onChange={(e) => setSelectedDateId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">اختر التاريخ</option>
                  {mentorshipData.availableDates && mentorshipData.availableDates.length > 0 ? (
                    mentorshipData.availableDates
                      .filter(date => !date.isBooked)
                      .map((date) => (
                        <option key={date.id} value={date.id}>
                          {date.timeSlot}
                        </option>
                      ))
                  ) : (
                    <option value="" disabled>لا توجد مواعيد متاحة حالياً</option>
                  )}
                </select>
              </div>
            </>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات إضافية (اختياري)</label>
            <textarea
              value={studentNotes}
              onChange={(e) => setStudentNotes(e.target.value)}
              placeholder="أي ملاحظات أو أسئلة تريد مناقشتها..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>
          <div className="mb-4 p-3 bg-orange-50 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>نوع الجلسة:</span>
              <span>{sessionType === 'RECORDED' ? 'جلسة مسجلة' : 'جلسة مباشرة'}</span>
            </div>
            {sessionType === 'FACE_TO_FACE' && (
              <div className="flex justify-between text-sm">
                <span>المدة:</span>
                <span>{duration} دقيقة</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>السعر:</span>
              <span>
                {sessionType === 'RECORDED' 
                  ? `$${Number(sessionPrice || 0).toFixed(2)} (ثابت)`
                : `$${Number(sessionPrice || 0).toFixed(2)}/ساعة`
                }
              </span>
            </div>
            <div className="flex justify-between font-bold text-orange-600 border-t border-orange-200 pt-2 mt-2">
              <span>المجموع:</span>
              <span>${Number(totalAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>رصيدك الحالي:</span>
              <span className={Number(userBalance) >= totalAmount ? 'text-green-600' : 'text-red-600'}>${Number(userBalance).toFixed(2)}</span>
            </div>
          </div>
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
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-400"
            >
              {isSubmitting ? 'جاري الحجز...' : 'احجز الآن'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
