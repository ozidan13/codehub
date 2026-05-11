'use client'

import { FC } from 'react'

interface DeleteConfirmationModalProps {
  entityType: string
  entityName: string
  entityDetails?: string
  onClose: () => void
  onConfirm: () => void
  isLoading?: boolean
}

const typeMap: { [key: string]: string } = {
  platform: 'المنصة',
  task: 'المهمة',
  user: 'المستخدم',
}

const getWarningMessage = (type: string) => {
  switch (type) {
    case 'user':
      return 'تحذير: حذف المستخدم سيؤثر على جميع التقديمات والمعاملات المرتبطة به.'
    case 'platform':
      return 'تحذير: حذف المنصة سيؤثر على جميع المهام المرتبطة بها.'
    case 'task':
      return 'تحذير: حذف المهمة سيؤثر على جميع التقديمات المرتبطة بها.'
    default:
      return 'تحذير: هذا الإجراء لا يمكن التراجع عنه.'
  }
}

const DeleteConfirmationModal: FC<DeleteConfirmationModalProps> = ({
  entityType,
  entityName,
  entityDetails,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" dir="rtl">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 transform transition-all">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <div className="mr-4">
            <h3 className="text-lg font-bold text-gray-900">تأكيد الحذف</h3>
            <p className="text-sm text-gray-500">هذا الإجراء لا يمكن التراجع عنه</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-3">
            هل أنت متأكد أنك تريد حذف {typeMap[entityType] || 'العنصر'}:
          </p>
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <p className="font-semibold text-gray-900">&ldquo;{entityName}&rdquo;</p>
            {entityDetails && <p className="text-sm text-gray-600 mt-1">{entityDetails}</p>}
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{getWarningMessage(entityType)}</p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 space-x-reverse">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-colors flex items-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                جاري الحذف...
              </>
            ) : (
              'تأكيد الحذف'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmationModal
