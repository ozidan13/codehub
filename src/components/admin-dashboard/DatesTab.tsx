'use client'

import { useState, useEffect, useCallback, FC } from 'react'
import { Calendar, Clock, CheckCircle, RefreshCw, Settings } from 'lucide-react'
import { CalendlyAdminCalendar } from '@/components/calendar'
import { AvailableDate } from './types'

interface DatesTabProps {
  onTimeSlotDeleteConfirm: (dateId: string, details: string) => void
}

const DatesTab: FC<DatesTabProps> = ({ onTimeSlotDeleteConfirm }) => {
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAvailableDates = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/available-dates')
      if (response.ok) {
        const data = await response.json()
        setAvailableDates(data.availableDates || [])
      }
    } catch (error) {
      console.error('Error fetching available dates:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAvailableDates()
  }, [fetchAvailableDates])

  const handleCreateTimeSlot = async (date: Date, timeSlot: { start: string; end: string }) => {
    try {
      const response = await fetch('/api/admin/available-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: date.toISOString(), startTime: timeSlot.start, endTime: timeSlot.end, isRecurring: false }),
      })
      if (!response.ok) {
        const error = await response.json()
        if (error.error === 'This date and time slot already exists') {
          console.log('Time slot already exists, skipping creation')
          return
        }
        throw new Error(error.error || 'Failed to create time slot')
      }
    } catch (error) {
      console.error('Error creating time slot:', error)
      throw error
    }
  }

  const handleDeleteTimeSlot = async (dateId: string, dateInfo?: string) => {
    onTimeSlotDeleteConfirm(dateId, dateInfo || 'حذف الفترة الزمنية المحددة')
  }

  const handleBulkCreate = async (date: Date, timeSlots: { start: string; end: string }[]) => {
    try {
      const response = await fetch('/api/admin/available-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dates: timeSlots.map((slot) => ({ date: date.toISOString(), startTime: slot.start, endTime: slot.end, isRecurring: false })),
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create time slots')
      }
    } catch (error) {
      console.error('Error creating bulk time slots:', error)
      throw error
    }
  }

  const handleBulkDateRangeCreate = async (startDate: Date, endDate: Date, timeSlots: { start: string; end: string }[], excludeWeekends: boolean) => {
    try {
      const response = await fetch('/api/admin/available-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
          timeSlots: timeSlots.map((slot) => ({ startTime: slot.start, endTime: slot.end })),
          excludeWeekends,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create time slots')
      }
      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error creating bulk date range:', error)
      throw error
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">إجمالي الأوقات المتاحة</p>
              <p className="text-3xl font-bold mt-2">{availableDates.length}</p>
            </div>
            <div className="bg-blue-400 bg-opacity-30 rounded-full p-3">
              <Calendar className="w-8 h-8 text-blue-100" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">الأوقات المتاحة للحجز</p>
              <p className="text-3xl font-bold mt-2">{availableDates.filter((d) => !d.isBooked).length}</p>
            </div>
            <div className="bg-green-400 bg-opacity-30 rounded-full p-3">
              <Clock className="w-8 h-8 text-green-100" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">الأوقات المحجوزة</p>
              <p className="text-3xl font-bold mt-2">{availableDates.filter((d) => d.isBooked).length}</p>
            </div>
            <div className="bg-orange-400 bg-opacity-30 rounded-full p-3">
              <CheckCircle className="w-8 h-8 text-orange-100" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">القوالب المتكررة</p>
              <p className="text-3xl font-bold mt-2">{availableDates.filter((d) => d.isRecurring).length}</p>
            </div>
            <div className="bg-purple-400 bg-opacity-30 rounded-full p-3">
              <RefreshCw className="w-8 h-8 text-purple-100" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Settings className="w-5 h-5 ml-2 text-gray-600" />
          إجراءات سريعة
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button onClick={fetchAvailableDates} className="flex items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200">
            <RefreshCw className="w-5 h-5 ml-2 text-blue-600" />
            <span className="text-blue-700 font-medium">تحديث البيانات</span>
          </button>
          <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-gray-600 text-sm">آخر تحديث: {new Date().toLocaleString('en-US')}</span>
          </div>
          <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg border border-green-200">
            <span className="text-green-700 font-medium">
              معدل الحجز: {availableDates.length > 0 ? Math.round((availableDates.filter((d) => d.isBooked).length / availableDates.length) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      <CalendlyAdminCalendar
        availableDates={availableDates}
        onRefresh={fetchAvailableDates}
        onCreateTimeSlot={handleCreateTimeSlot}
        onDeleteTimeSlot={handleDeleteTimeSlot}
        onBulkCreate={handleBulkCreate}
        onBulkDateRangeCreate={handleBulkDateRangeCreate}
        loading={loading}
        className="p-6"
      />
    </div>
  )
}

export default DatesTab
