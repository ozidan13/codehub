'use client'

import { useState, useEffect, useCallback, FC, ReactNode } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { BookOpen, Clock, CheckCircle, X, FileText, Trophy, LogOut, RefreshCw, Star, Wallet, CreditCard, Users, ShoppingCart, XCircle, Play, Video, ChevronDown } from 'lucide-react'
import { CalendlyStudentCalendar } from '@/components/calendar';
import RecordedSessionsList from '@/components/mentorship/RecordedSessionsList';
import LiveSessionBooking from '@/components/mentorship/LiveSessionBooking';
import { formatDate, formatDateTime, formatTimeRange } from '@/lib/dateUtils';
import { Platform, Task, Submission, StudentStats, WalletData, Enrollment, Transaction, MentorshipData } from '@/types';

// Data Cache Class
class DataCache {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>()

  set(key: string, data: unknown, ttl: number = 5 * 60 * 1000) {
    this.cache.set(key, { data, timestamp: Date.now(), ttl })
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

export default function MentorshipPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mentorshipData, setMentorshipData] = useState<MentorshipData | null>(null)
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showMentorshipModal, setShowMentorshipModal] = useState(false)
  const [showTopUpModal, setShowTopUpModal] = useState(false)

  const fetchData = useCallback(async () => {
    if (!session?.user?.email) return

    try {
      setIsLoading(true)
      
      // Check cache first
      const cachedMentorship = dataCache.get('mentorship')
      const cachedWallet = dataCache.get('wallet')
      const cachedTransactions = dataCache.get('transactions')
      
      if (cachedMentorship && cachedWallet && cachedTransactions) {
        setMentorshipData(cachedMentorship as MentorshipData)
        setWalletData(cachedWallet as WalletData)
        // Ensure cached transactions is always an array
        const cachedTransactionsArray = Array.isArray(cachedTransactions) ? cachedTransactions : []
        setTransactions(cachedTransactionsArray as Transaction[])
        setIsLoading(false)
        return
      }

      // Fetch fresh data
      const [mentorshipRes, walletRes, transactionsRes] = await Promise.all([
        fetch('/api/mentorship'),
        fetch('/api/wallet'),
        fetch('/api/transactions')
      ])

      if (mentorshipRes.ok) {
        const mentorshipData = await mentorshipRes.json()
        setMentorshipData(mentorshipData)
        dataCache.set('mentorship', mentorshipData)
      }

      if (walletRes.ok) {
        const walletData = await walletRes.json()
        setWalletData(walletData)
        dataCache.set('wallet', walletData)
      }

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json()
        // Ensure transactions is always an array
        const transactionsArray = Array.isArray(transactionsData) ? transactionsData : (transactionsData?.transactions || [])
        setTransactions(transactionsArray)
        dataCache.set('transactions', transactionsArray)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.email])

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    fetchData()
  }, [status, fetchData, router])

  const handleRefresh = useCallback(() => {
    dataCache.clear()
    fetchData()
  }, [fetchData])

  const handleMentorshipSuccess = useCallback(() => {
    setShowMentorshipModal(false)
    handleRefresh()
  }, [handleRefresh])

  const handleTopUpSuccess = useCallback(() => {
    setShowTopUpModal(false)
    handleRefresh()
  }, [handleRefresh])

  if (status === 'loading' || isLoading) {
    return <PageLoader />
  }

  if (status === 'unauthenticated') {
    return null
  }

  const userName = session?.user?.name || 'المستخدم'
  const userBalance = walletData?.balance || 0
  const purchasedRecordedSessionIds = mentorshipData?.bookings
    .filter(booking => booking.sessionType === 'RECORDED' && booking.status === 'CONFIRMED')
    .map(booking => booking.videoLink || '')
    .filter(Boolean) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100" dir="rtl">
      <DashboardHeader userName={userName} onRefresh={handleRefresh} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Wallet Section */}
        <WalletSection 
          wallet={walletData} 
          onTopUp={() => setShowTopUpModal(true)} 
        />

        {/* Mentorship Section */}
        <MentorshipSection 
          mentorshipData={mentorshipData}
          onRefresh={handleRefresh}
          purchasedRecordedSessionIds={purchasedRecordedSessionIds}
        />

        {/* Booked Sessions Section */}
        <BookedSessionsSection 
          mentorshipData={mentorshipData}
          transactions={transactions}
        />
      </main>

      {/* Modals */}
      {showMentorshipModal && (
        <MentorshipModal
          isOpen={showMentorshipModal}
          userBalance={userBalance}
          onClose={() => setShowMentorshipModal(false)}
          onSuccess={handleMentorshipSuccess}
        />
      )}

      {showTopUpModal && (
        <TopUpModal
          isOpen={showTopUpModal}
          onClose={() => setShowTopUpModal(false)}
          onSuccess={handleTopUpSuccess}
        />
      )}
    </div>
  )
}

// Page Loader Component
const PageLoader: FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-100">
    <div className="text-center">
      <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-32 w-32 mb-4 mx-auto"></div>
      <h2 className="text-2xl font-semibold text-gray-700">جاري التحميل...</h2>
      <p className="text-gray-500">يتم تجهيز صفحة الإرشاد الخاصة بك.</p>
    </div>
  </div>
);

// Dashboard Header Component
const DashboardHeader: FC<{ userName: string; onRefresh: () => void; }> = ({ userName, onRefresh }) => (
  <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-40">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center py-4">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
            <Users className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">الإرشاد الأكاديمي</h1>
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

// Wallet Section Component
const WalletSection: FC<{ wallet: WalletData | null; onTopUp: () => void }> = ({ wallet, onTopUp }) => {
  if (!wallet) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="p-3 rounded-lg bg-gradient-to-br from-green-400 to-green-600 text-white">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">المحفظة</h2>
            <p className="text-sm text-gray-600">رصيدك الحالي</p>
          </div>
        </div>
        <div className="text-left">
          <p className="text-3xl font-bold text-green-600">{Number(wallet.balance).toFixed(2)} جنيه مصري</p>
          <button
            onClick={onTopUp}
            className="mt-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            شحن الرصيد
          </button>
        </div>
      </div>
    </div>
  );
};

// Booked Sessions Section Component
const BookedSessionsSection: FC<{ mentorshipData: MentorshipData | null; transactions: Transaction[]; }> = ({ mentorshipData, transactions }) => {
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  
  if (!mentorshipData || mentorshipData.bookings.length === 0) return null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'completed': return <Trophy className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const mentorshipTransactions = Array.isArray(transactions) ? transactions.filter(t => 
    t.type.includes('SESSION') || t.type.includes('MENTORSHIP')
  ) : [];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="p-3 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-white">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">جلسات الإرشاد المحجوزة</h2>
            <p className="text-sm text-gray-600">{mentorshipData.bookings.length} جلسة محجوزة</p>
          </div>
        </div>
        
        {/* Transaction History Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowTransactionHistory(!showTransactionHistory)}
            className="flex items-center space-x-2 space-x-reverse bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
          >
            <CreditCard className="h-4 w-4" />
            <span>سجل المعاملات</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showTransactionHistory ? 'rotate-180' : ''}`} />
          </button>
          
          {showTransactionHistory && (
            <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800">سجل معاملات الإرشاد</h3>
              </div>
              <div className="p-2">
                {mentorshipTransactions.length > 0 ? (
                  mentorshipTransactions.map((transaction) => (
                    <div key={transaction.id} className="p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{transaction.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatDate(transaction.createdAt)}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-gray-800">{Number(transaction.amount).toFixed(2)} جنيه مصري</p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {transaction.status === 'APPROVED' ? 'مكتمل' : 'معلق'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <p className="text-sm">لا توجد معاملات إرشاد</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mentorshipData.bookings.map((booking) => (
          <div key={booking.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-lg font-bold">
                  {booking.mentor.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{booking.mentor.name}</h3>
                  <p className="text-sm text-gray-600">
                    {booking.sessionType === 'RECORDED' ? 'جلسة مسجلة' : 'جلسة مباشرة'}
                  </p>
                </div>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                {getStatusIcon(booking.status)}
                <span className="mr-1">
                  {booking.status === 'CONFIRMED' ? 'مؤكدة' :
                   booking.status === 'PENDING' ? 'معلقة' :
                   booking.status === 'COMPLETED' ? 'مكتملة' :
                   booking.status === 'CANCELLED' ? 'ملغية' : booking.status}
                </span>
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">المدة:</span>
                <span className="text-sm font-medium text-gray-800">{booking.duration} دقيقة</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">المبلغ:</span>
                <span className="text-sm font-bold text-orange-600">{Number(booking.amount).toFixed(2)} جنيه مصري</span>
              </div>

              {booking.sessionDate && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">تاريخ الجلسة:</span>
                  <span className="text-sm font-medium text-gray-800">{formatDate(booking.sessionDate)}</span>
                </div>
              )}

              {booking.sessionStartTime && booking.sessionEndTime && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">وقت الجلسة:</span>
                  <span className="text-sm font-medium text-gray-800">{formatTimeRange(booking.sessionStartTime, booking.sessionEndTime)}</span>
                </div>
              )}

              {booking.whatsappNumber && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">واتساب:</span>
                  <span className="text-sm font-medium text-gray-800">{booking.whatsappNumber}</span>
                </div>
              )}

              {booking.studentNotes && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">ملاحظات الطالب:</p>
                  <p className="text-sm text-gray-800">{booking.studentNotes}</p>
                </div>
              )}

              {booking.adminNotes && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600 mb-1">ملاحظات المرشد:</p>
                  <p className="text-sm text-blue-800">{booking.adminNotes}</p>
                </div>
              )}

              {booking.videoLink && (
                <div className="mt-4">
                  <a
                    href={booking.videoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 space-x-reverse bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Play className="h-4 w-4" />
                    <span>مشاهدة الجلسة</span>
                  </a>
                </div>
              )}

              {booking.meetingLink && booking.status === 'CONFIRMED' && (
                <div className="mt-4">
                  <a
                    href={booking.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 space-x-reverse bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Video className="h-4 w-4" />
                    <span>انضمام للجلسة</span>
                  </a>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">تم الحجز في: {formatDate(booking.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Mentorship Section Component
const MentorshipSection: FC<{ mentorshipData: MentorshipData | null; onRefresh: () => void; purchasedRecordedSessionIds: string[]; }> = ({ mentorshipData, onRefresh, purchasedRecordedSessionIds }) => {
  const [activeTab, setActiveTab] = useState('live');
  if (!mentorshipData) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mt-8">
      <div className="flex items-center space-x-3 space-x-reverse mb-6">
        <div className="p-3 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-white">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">حجز جلسات الإرشاد</h2>
          <p className="text-sm text-gray-600">احجز جلسة إرشاد مع المرشد</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Mentor Info */}
        <div className="md:col-span-1">
          <div className="flex items-center space-x-4 space-x-reverse mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-4xl font-bold">
              {mentorshipData.mentor.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{mentorshipData.mentor.name}</h2>
              <p className="text-md text-gray-600">Mentor</p>
            </div>
          </div>
          <p className="text-gray-700 mb-6">{mentorshipData.mentor.mentorBio}</p>
          
        </div>

        {/* Right Column: Booking Options */}
        <div className="md:col-span-2">
            <div className="flex border-b border-gray-200">
              <button onClick={() => setActiveTab('live')} className={`px-6 py-3 font-semibold ${activeTab === 'live' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}>سيشن Live انا وانت</button>
              <button onClick={() => setActiveTab('recorded')} className={`px-6 py-3 font-semibold ${activeTab === 'recorded' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}>سيشن مسجلة</button>
            </div>

            <div className="py-6">
              {activeTab === 'live' && (
                <LiveSessionBooking availableDates={mentorshipData.availableDates} onBookingSuccess={onRefresh} />
              )}
              {activeTab === 'recorded' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Available for Purchase</h3>
                  <RecordedSessionsList sessions={mentorshipData.recordedSessions.filter(s => !purchasedRecordedSessionIds.includes(s.id))} onPurchaseSuccess={onRefresh} />

                </div>
              )}
            </div>
          </div>
      </div>
    </div>
  );
};

// Mentorship Modal Component
const MentorshipModal: FC<{ isOpen: boolean; userBalance: number; onClose: () => void; onSuccess: () => void }> = ({ isOpen, userBalance, onClose, onSuccess }) => {
  const [sessionType, setSessionType] = useState<'RECORDED' | 'FACE_TO_FACE'>('RECORDED');
  const duration = '60'; // Fixed 60 minutes for face-to-face sessions
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [selectedDateId, setSelectedDateId] = useState('');
  const [selectedRecordedSessionId, setSelectedRecordedSessionId] = useState('');
  const [studentNotes, setStudentNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [mentorshipData, setMentorshipData] = useState<MentorshipData | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch mentorship data when modal opens
      fetch('/api/mentorship')
        .then(res => res.json())
        .then(data => setMentorshipData(data))
        .catch(console.error);
    }
  }, [isOpen]);

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
                              <span className="text-lg font-bold text-blue-600">{Number(session.price).toFixed(2)} جنيه مصري</span>
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
                <span className="font-medium">{Number(sessionPrice).toFixed(2)} جنيه مصري</span>
              </div>
              {sessionType === 'FACE_TO_FACE' && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">المدة:</span>
                  <span className="font-medium">{duration} دقيقة</span>
                </div>
              )}
              <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                <span>المجموع:</span>
                <span className="text-blue-600">{Number(totalAmount).toFixed(2)} جنيه مصري</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600 mt-1">
                <span>رصيدك الحالي:</span>
                <span className={userBalance >= totalAmount ? 'text-green-600' : 'text-red-600'}>
                  {Number(userBalance).toFixed(2)} جنيه مصري
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

// Top Up Modal Component
const TopUpModal: FC<{ isOpen: boolean; onClose: () => void; onSuccess: () => void }> = ({ isOpen, onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('يرجى إدخال مبلغ صحيح');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount }),
      });
      
      if (response.ok) {
        const result = await response.json();
        onSuccess();
        onClose();
        setAmount('');
        alert(result.message || 'تم شحن الرصيد بنجاح!');
      } else {
        const error = await response.json();
        alert(`فشل في شحن الرصيد: ${error.error}`);
      }
    } catch (error) {
      console.error('Top up error:', error);
      alert('حدث خطأ أثناء شحن الرصيد.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">شحن الرصيد</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">المبلغ ($)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="أدخل المبلغ"
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
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'جاري الشحن...' : 'شحن الرصيد'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
