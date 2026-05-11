'use client'

import { useState, FC } from 'react'
import { FileText, Clipboard, User as UserIcon, BookOpen, Settings, Star, X, CheckCircle, RefreshCw } from 'lucide-react'
import { Submission } from './types'
import { formatDateTime } from '@/lib/dateUtils'

interface ReviewModalProps {
  submission: Submission
  onClose: () => void
  onUpdate: () => void
  toastSuccess: (message: string) => void
  toastError: (message: string) => void
}

const ReviewModal: FC<ReviewModalProps> = ({ submission, onClose, onUpdate, toastSuccess, toastError }) => {
  const [feedback, setFeedback] = useState(submission.feedback || '')
  const [score, setScore] = useState<number | string>(submission.score || '')
  const [status, setStatus] = useState(submission.status)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleSubmit = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/submissions/${submission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback,
          score: score ? Number(score) : null,
          status,
        }),
      })
      if (response.ok) {
        onUpdate()
        toastSuccess('تم تحديث التقديم بنجاح')
        onClose()
      } else {
        const error = await response.json()
        toastError(`فشل في التحديث: ${error.error}`)
      }
    } catch (error) {
      console.error('Update error:', error)
      toastError('حدث خطأ أثناء تحديث التقديم.')
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'APPROVED':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'REJECTED':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    }
  }

  const getStatusIcon = (s: string) => {
    switch (s) {
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5" />
      case 'REJECTED':
        return <X className="w-5 h-5" />
      default:
        return <RefreshCw className="w-5 h-5" />
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">مراجعة التقديم</h2>
                <p className="text-blue-100 text-sm">تقييم وإضافة ملاحظات للطالب</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center hover:bg-opacity-30 transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                <div className="flex items-center space-x-3 space-x-reverse mb-2">
                  <UserIcon className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-800">معلومات الطالب</h3>
                </div>
                <p className="text-gray-700 font-medium">{submission.user?.name}</p>
                <p className="text-gray-500 text-sm">{submission.user?.email}</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                <div className="flex items-center space-x-3 space-x-reverse mb-2">
                  <BookOpen className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-800">معلومات المهمة</h3>
                </div>
                <p className="text-gray-700 font-medium">{submission.task?.title}</p>
                <p className="text-gray-500 text-sm">{submission.task?.platform?.name}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <h3 className="font-semibold text-gray-800">الحالة الحالية</h3>
                  <div className={`flex items-center space-x-2 space-x-reverse px-3 py-1 rounded-full border ${getStatusColor(submission.status)}`}>
                    {getStatusIcon(submission.status)}
                    <span className="text-sm font-medium">
                      {submission.status === 'PENDING' ? 'معلق' : submission.status === 'APPROVED' ? 'مقبول' : 'مرفوض'}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">تاريخ التقديم: {formatDateTime(submission.createdAt)}</div>
              </div>
            </div>

            {submission.summary && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800 flex items-center space-x-2 space-x-reverse">
                    <Clipboard className="w-5 h-5 text-gray-600" />
                    <span>محتوى التقديم</span>
                  </h3>
                </div>
                <div className="p-4 max-h-60 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">{submission.summary}</pre>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2 space-x-reverse">
                  <Settings className="w-4 h-4" />
                  <span>تحديث الحالة</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'PENDING' | 'APPROVED' | 'REJECTED')}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                >
                  <option value="PENDING">معلق</option>
                  <option value="APPROVED">مقبول</option>
                  <option value="REJECTED">مرفوض</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2 space-x-reverse">
                  <Star className="w-4 h-4" />
                  <span>الدرجة (من 100)</span>
                </label>
                <input
                  type="number"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  min="0"
                  max="100"
                  placeholder="أدخل الدرجة..."
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2 space-x-reverse">
                <FileText className="w-4 h-4" />
                <span>ملاحظات وتوجيهات للطالب</span>
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                placeholder="اكتب ملاحظاتك وتوجيهاتك للطالب هنا..."
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end space-x-3 space-x-reverse">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center space-x-2 space-x-reverse"
            >
              <X className="w-4 h-4" />
              <span>إلغاء</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={isUpdating}
              className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-300 disabled:to-indigo-300 transition-all duration-200 flex items-center space-x-2 space-x-reverse shadow-lg hover:shadow-xl"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري التحديث...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>حفظ التحديثات</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReviewModal
