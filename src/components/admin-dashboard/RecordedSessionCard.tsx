'use client'

import { useState, useEffect, FC } from 'react'
import { FileText } from 'lucide-react'
import { RecordedSession } from './types'

interface RecordedSessionCardProps {
  onRefresh: () => void
  toastSuccess: (message: string) => void
  toastError: (message: string) => void
}

const RecordedSessionCard: FC<RecordedSessionCardProps> = ({ onRefresh, toastSuccess, toastError }) => {
  const [recordedSession, setRecordedSession] = useState<RecordedSession | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState({ title: '', description: '', videoLink: '', price: 150, isActive: true })

  const fetchRecordedSession = async () => {
    try {
      const response = await fetch('/api/admin/recorded-sessions')
      if (response.ok) {
        const sessions = await response.json()
        const activeSession = sessions.find((s: RecordedSession) => s.isActive) || sessions[0]
        setRecordedSession(activeSession || null)
        if (activeSession) {
          setFormData({
            title: activeSession.title,
            description: activeSession.description || '',
            videoLink: activeSession.videoLink,
            price: activeSession.price,
            isActive: activeSession.isActive,
          })
        }
      }
    } catch (error) {
      console.error('Error fetching recorded session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRecordedSession()
  }, [])

  const handleSave = async () => {
    try {
      const url = '/api/admin/recorded-sessions'
      const method = recordedSession ? 'PUT' : 'POST'
      const body = recordedSession ? { id: recordedSession.id, ...formData } : formData
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (response.ok) {
        await fetchRecordedSession()
        setIsEditing(false)
        onRefresh()
        toastSuccess('تم حفظ الجلسة المسجلة بنجاح')
      } else {
        const error = await response.json()
        toastError(`خطأ في حفظ الجلسة المسجلة: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving recorded session:', error)
      toastError('حدث خطأ أثناء حفظ الجلسة المسجلة')
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="p-3 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 text-white">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">إدارة الجلسة المسجلة</h3>
            <p className="text-sm text-gray-600">رابط واحد لجميع الطلاب</p>
          </div>
        </div>
        <button onClick={() => setIsEditing(!isEditing)} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
          {isEditing ? 'إلغاء' : 'تعديل'}
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الجلسة</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="أدخل عنوان الجلسة" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">وصف الجلسة</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" rows={3} placeholder="أدخل وصف الجلسة" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رابط الفيديو</label>
            <input type="url" value={formData.videoLink} onChange={(e) => setFormData({ ...formData, videoLink: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="https://example.com/video" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">السعر</label>
              <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" min="0" step="0.01" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
              <select value={formData.isActive.toString()} onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                <option value="true">نشط</option>
                <option value="false">غير نشط</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 space-x-reverse">
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">إلغاء</button>
            <button onClick={handleSave} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">حفظ</button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {recordedSession ? (
            <>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-800">{recordedSession.title}</h4>
                  {recordedSession.description && <p className="text-gray-600 mt-1">{recordedSession.description}</p>}
                </div>
                <div className="text-left">
                  <span className="text-2xl font-bold text-purple-600">{Number(recordedSession.price).toFixed(2)} جنية</span>
                  <div className="mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${recordedSession.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {recordedSession.isActive ? 'نشط' : 'غير نشط'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600 mb-1">رابط الفيديو:</p>
                <a href={recordedSession.videoLink} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800 text-sm break-all">
                  {recordedSession.videoLink}
                </a>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">لا توجد جلسة مسجلة</p>
              <button onClick={() => setIsEditing(true)} className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">إضافة جلسة مسجلة</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default RecordedSessionCard
