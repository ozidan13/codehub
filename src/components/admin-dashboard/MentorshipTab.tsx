'use client'

import { useState, FC } from 'react'
import { Calendar, RefreshCw, CheckCircle, XCircle, FileText } from 'lucide-react'
import { MentorshipBooking } from './types'
import { formatDate } from '@/lib/dateUtils'
import RecordedSessionCard from './RecordedSessionCard'
import BookingUpdateModal from './BookingUpdateModal'

interface MentorshipTabProps {
  bookings: MentorshipBooking[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
  onPageChange: (page: number) => void
  onRefresh: () => void
  onBookingStatusConfirm: (bookingId: string, status: 'CONFIRMED' | 'CANCELLED', details?: string) => void
  toastSuccess: (message: string) => void
  toastError: (message: string) => void
}

const MentorshipTab: FC<MentorshipTabProps> = ({ bookings, pagination, onPageChange, onRefresh, onBookingStatusConfirm, toastSuccess, toastError }) => {
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<MentorshipBooking | null>(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)

  const handleUpdateBooking = (booking: MentorshipBooking) => {
    setSelectedBooking(booking)
    setShowUpdateModal(true)
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      PENDING: { label: 'في الانتظار', class: 'bg-yellow-100 text-yellow-800' },
      CONFIRMED: { label: 'مؤكد', class: 'bg-green-100 text-green-800' },
      COMPLETED: { label: 'مكتمل', class: 'bg-blue-100 text-blue-800' },
      CANCELLED: { label: 'ملغي', class: 'bg-red-100 text-red-800' },
    }
    const info = statusMap[status] || { label: status, class: 'bg-gray-100 text-gray-800' }
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${info.class}`}>{info.label}</span>
  }

  return (
    <div>
      <RecordedSessionCard onRefresh={onRefresh} toastSuccess={toastSuccess} toastError={toastError} />
      <div className="flex justify-between items-center mb-6 mt-8">
        <div className="flex items-center space-x-3 space-x-reverse">
          <Calendar className="h-8 w-8 text-orange-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">إدارة حجوزات الجلسات</h2>
            <p className="text-gray-600">مراجعة وإدارة جميع حجوزات جلسات الإرشاد</p>
          </div>
        </div>
        <button onClick={onRefresh} className="flex items-center space-x-2 space-x-reverse bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors">
          <RefreshCw className="h-4 w-4" />
          <span>تحديث</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الطالب</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">نوع الجلسة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التفاصيل</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المبلغ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{booking.user?.name || 'غير محدد'}</div>
                      <div className="text-sm text-gray-500">{booking.user?.email || 'غير محدد'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${booking.sessionType === 'RECORDED' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                      {booking.sessionType === 'RECORDED' ? 'مسجلة' : 'مباشرة'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {booking.sessionType === 'FACE_TO_FACE' && <div className="text-gray-900">{booking.duration || 0} دقيقة</div>}
                      {booking.sessionDate && <div className="text-gray-500">{new Date(booking.sessionDate).toLocaleDateString('en-US')}</div>}
                      {booking.whatsappNumber && <div className="text-gray-500 text-xs">{booking.whatsappNumber}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{Number(booking.amount || 0).toFixed(2)} جنية</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(booking.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(booking.createdAt).toLocaleDateString('en-US')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2 space-x-reverse">
                      <button onClick={() => handleUpdateBooking(booking)} className="text-blue-600 hover:text-blue-900" title="تحديث الحجز">
                        <FileText className="h-5 w-5" />
                      </button>
                      {booking.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => onBookingStatusConfirm(booking.id, 'CONFIRMED', `تأكيد حجز الإرشاد للطالب ${booking.user?.name || 'غير معروف'}${booking.sessionDate ? ` في ${formatDate(booking.sessionDate)}` : ''}`)}
                            disabled={isUpdating === booking.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            title="تأكيد الحجز"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => onBookingStatusConfirm(booking.id, 'CANCELLED', `إلغاء حجز الإرشاد للطالب ${booking.user?.name || 'غير معروف'}${booking.sessionDate ? ` في ${formatDate(booking.sessionDate)}` : ''}`)}
                            disabled={isUpdating === booking.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="إلغاء الحجز"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  عرض <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> إلى{' '}
                  <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> من{' '}
                  <span className="font-medium">{pagination.total}</span> نتيجة
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => onPageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    السابق
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => onPageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pagination.page ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => onPageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    التالي
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {showUpdateModal && selectedBooking && (
        <BookingUpdateModal
          booking={selectedBooking}
          onClose={() => { setShowUpdateModal(false); setSelectedBooking(null); }}
          onUpdate={() => { setShowUpdateModal(false); setSelectedBooking(null); onRefresh(); }}
          toastSuccess={toastSuccess}
          toastError={toastError}
        />
      )}
    </div>
  )
}

export default MentorshipTab
