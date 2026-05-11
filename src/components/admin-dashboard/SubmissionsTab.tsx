'use client'

import { FC } from 'react'
import { FileText, Clipboard, User as UserIcon, BookOpen } from 'lucide-react'
import { Submission } from './types'
import { formatDate } from '@/lib/dateUtils'
import PageHeader from './PageHeader'
import StatusBadge from './StatusBadge'
import PaginationControl from './PaginationControl'

interface SubmissionsTabProps {
  submissions: Submission[]
  pagination: { page: number; totalPages: number; total: number }
  onPageChange: (page: number) => void
  onReview: (submission: Submission) => void
}

const SubmissionsTab: FC<SubmissionsTabProps> = ({ submissions, pagination, onPageChange, onReview }) => (
  <>
    <PageHeader title="التقديمات" />
    <div className="space-y-6">
      {submissions.length > 0 ? (
        submissions.map((submission) => (
          <div key={submission.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-5 h-5 text-blue-500" />
                      <span className="font-semibold text-gray-900">{submission.user?.name || 'غير معروف'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700">{submission.task?.title || 'غير معروف'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span>تاريخ التقديم: {formatDate(submission.createdAt)}</span>
                    <span>الدرجة: {submission.score ?? 'لم تقيم'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={submission.status} />
                  <button
                    onClick={() => onReview(submission)}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                  >
                    مراجعة
                  </button>
                </div>
              </div>

              {submission.content && (
                <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-700">محتوى التقديم:</span>
                  </div>
                  <div className="text-sm text-gray-800 leading-relaxed max-h-32 overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-sans">{submission.content}</pre>
                  </div>
                </div>
              )}

              {submission.feedback && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Clipboard className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-semibold text-yellow-700">ملاحظات المراجع:</span>
                  </div>
                  <p className="text-sm text-yellow-800">{submission.feedback}</p>
                </div>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد تقديمات</h3>
          <p className="text-gray-500">لم يتم العثور على أي تقديمات حتى الآن</p>
        </div>
      )}
    </div>
    <div className="mt-8">
      <PaginationControl {...pagination} onPageChange={onPageChange} />
    </div>
  </>
)

export default SubmissionsTab
