'use client'

import { useState, useEffect, useCallback, FC } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { BookOpen, Clock, CheckCircle, Trophy, RefreshCw, Users, CreditCard, XCircle, Play, Video, ChevronDown } from 'lucide-react'
import { CalendlyStudentCalendar } from '@/components/calendar'
import RecordedSessionsList from '@/components/mentorship/RecordedSessionsList'
import LiveSessionBooking from '@/components/mentorship/LiveSessionBooking'
import { formatDate, formatDateTime, formatTimeRange } from '@/lib/dateUtils'
import { MentorshipData, Transaction } from '@/types'

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

// --- MAIN MENTORSHIP PAGE COMPONENT ---
export default function MentorshipPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // --- STATE MANAGEMENT ---
  const [mentorshipData, setMentorshipData] = useState<MentorshipData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [isContentLoading, setIsContentLoading] = useState(false)

  // --- DATA FETCHING ---
  const fetchData = useCallback(async () => {
    if (status !== 'authenticated') return;
    setIsContentLoading(true);
    try {
      const [mentorshipRes, transactionsRes, availableDatesRes] = await Promise.all([
        fetch('/api/mentorship'),
        fetch('/api/transactions?limit=10'),
        fetch('/api/mentorship/available-dates')
      ]);
      
      if (mentorshipRes.ok) {
        const data = await mentorshipRes.json();
        
        // Merge available dates from dedicated endpoint
        if (availableDatesRes.ok) {
          const datesData = await availableDatesRes.json();
          data.availableDates = Array.isArray(datesData) ? datesData : (datesData.availableDates || []);
        }
        
        setMentorshipData(data);
      }

      if (transactionsRes.ok) {
        const data = await transactionsRes.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching mentorship data:', error);
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

  // --- RENDER LOGIC ---
  if (isPageLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
            <Users className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">جلسات الإرشاد</h1>
            <p className="text-sm text-gray-500">احجز وإدارة جلسات الإرشاد الخاصة بك</p>
          </div>
        </div>
        <button onClick={handleRefresh} className="p-2 text-gray-600 hover:bg-gray-200/80 rounded-full transition-colors">
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>
      
      {isContentLoading ? (
        <div className="text-center py-16"><div className="loader h-12 w-12 mx-auto"></div></div>
      ) : (
        <>
          <MentorshipSection 
            mentorshipData={mentorshipData} 
            onRefresh={handleRefresh} 
            purchasedRecordedSessionIds={mentorshipData?.bookedSessions
              ?.filter(s => s.sessionType === 'RECORDED' && s.recordedSessionId)
              .map(s => s.recordedSessionId!) ?? []}
          />
          <BookedSessionsSection mentorshipData={mentorshipData} transactions={transactions} />
        </>
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
      <p className="text-gray-500">يتم تجهيز صفحة الإرشاد الخاصة بك.</p>
    </div>
  </div>
);

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

  const mentorshipTransactions = transactions.filter(t => 
    t.type.includes('SESSION') || t.type.includes('MENTORSHIP')
  );

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
                          <p className="text-sm font-bold text-gray-800">{Number(transaction.amount).toFixed(2)} جنية</p>
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
                <span className="text-sm font-bold text-orange-600">{Number(booking.amount).toFixed(2)} جنية</span>
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