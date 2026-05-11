'use client'

import { useState, useEffect, FC, FormEvent } from 'react'
import { X, CheckCircle } from 'lucide-react'
import { MentorshipBooking } from './types'

interface BookingUpdateModalProps {
  booking: MentorshipBooking
  onClose: () => void
  onUpdate: () => void
  toastSuccess: (message: string) => void
  toastError: (message: string) => void
}

const BookingUpdateModal: FC<BookingUpdateModalProps> = ({ booking, onClose, onUpdate, toastSuccess, toastError }) => {
  const [status, setStatus] = useState(booking.status)
  const [videoLink, setVideoLink] = useState(booking.videoLink || '')
  const [meetingLink, setMeetingLink] = useState(booking.meetingLink || '')
  const [adminNotes, setAdminNotes] = useState(booking.adminNotes || '')
  const [sessionDate, setSessionDate] = useState(booking.sessionDate || '')
  const [availableDates, setAvailableDates] = useState<any[]>([])
  const [isUpdating, setIsUpdating] = useState(false)
  const [isLoadingDates, setIsLoadingDates] = useState(false)

  useEffect(() => {
    if (booking.sessionType === 'FACE_TO_FACE') {
      fetchAvailableDates()
    }
  }, [booking.sessionType])

  const fetchAvailableDates = async () => {
    setIsLoadingDates(true)
    try {
      const response = await fetch('/api/admin/available-dates')
      if (response.ok) {
        const data = await response.json()
        setAvailableDates(data.availableDates.filter((date: any) => !date.isBooked || date.id === booking.availableDateId))
      }
    } catch (error) {
      console.error('Error fetching available dates:', error)
    } finally {
      setIsLoadingDates(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    try {
      const updateData: any = {
        bookingId: booking.id,
        status,
        adminNotes: adminNotes.trim() || undefined,
      }
      if (booking.sessionType === 'RECORDED' && videoLink.trim()) {
        updateData.videoLink = videoLink.trim()
      }
      if (booking.sessionType === 'FACE_TO_FACE') {
        if (meetingLink.trim()) updateData.meetingLink = meetingLink.trim()
        if (sessionDate && sessionDate !== booking.sessionDate) updateData.sessionDate = sessionDate
      }
      const response = await fetch('/api/admin/mentorship', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })
      if (response.ok) {
        onUpdate()
        toastSuccess('تم تحديث الحجز بنجاح')
      } else {
        const error = await response.json()
        toastError(`فشل في تحديث الحجز: ${error.error}`)
      }
    } catch (error) {
      console.error('Booking update error:', error)
      toastError('حدث خطأ أثناء تحديث الحجز.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">تحديث حجز الجلسة</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">معلومات الحجز</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">الطالب:</span>
                <span className="font-medium mr-2">{booking.user?.name}</span>
              </div>
              <div>
                <span className="text-gray-600">نوع الجلسة:</span>
                <span className="font-medium mr-2">{booking.sessionType === 'RECORDED' ? 'جلسة مسجلة' : 'جلسة مباشرة'}</span>
              </div>
              {booking.sessionType === 'FACE_TO_FACE' && (
                <>
                  <div><span className="text-gray-600">المدة:</span><span className="font-medium mr-2">{booking.duration} دقيقة</span></div>
                  <div><span className="text-gray-600">رقم الواتساب:</span><span className="font-medium mr-2">{booking.whatsappNumber}</span></div>
                </>
              )}
              <div><span className="text-gray-600">المبلغ:</span><span className="font-medium mr-2">{Number(booking.amount).toFixed(2)} جنية</span></div>
              <div>
                <span className="text-gray-600">تاريخ الحجز:</span>
                <span className="font-medium mr-2">{new Date(booking.createdAt).toLocaleDateString('en-US')}</span>
              </div>
            </div>
            {booking.studentNotes && (
              <div className="mt-3">
                <span className="text-gray-600">ملاحظات الطالب:</span>
                <p className="text-sm text-gray-800 mt-1 p-2 bg-white rounded border">{booking.studentNotes}</p>
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">حالة الحجز</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="PENDING">في الانتظار</option>
              <option value="CONFIRMED">مؤكد</option>
              <option value="COMPLETED">مكتمل</option>
              <option value="CANCELLED">ملغي</option>
            </select>
          </div>

          {booking.sessionType === 'RECORDED' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">رابط الفيديو</label>
              <input type="url" value={videoLink} onChange={(e) => setVideoLink(e.target.value)} placeholder="https://example.com/video" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          )}

          {booking.sessionType === 'FACE_TO_FACE' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ ووقت الجلسة</label>
                {isLoadingDates ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">جاري تحميل المواعيد المتاحة...</div>
                ) : (
                  <select value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="">اختر موعد الجلسة</option>
                    {availableDates.map((date) => (
                      <option key={date.id} value={date.id}>{date.timeSlot}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">رابط الاجتماع</label>
                <input type="url" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="https://zoom.us/j/..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            </>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات الإدارة</label>
            <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="أي ملاحظات إضافية..." rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
          </div>

          <div className="flex space-x-3 space-x-reverse">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">إلغاء</button>
            <button type="submit" disabled={isUpdating} className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-400">
              {isUpdating ? 'جاري التحديث...' : 'تحديث الحجز'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BookingUpdateModal
