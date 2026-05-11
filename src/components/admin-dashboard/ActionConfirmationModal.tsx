'use client'

import { FC } from 'react'

interface ActionConfirmationModalProps {
  actionType: 'transaction' | 'booking' | 'timeSlot'
  action: string
  details?: string
  onClose: () => void
  onConfirm: () => void
  isLoading?: boolean
}

const ActionConfirmationModal: FC<ActionConfirmationModalProps> = ({
  actionType,
  action,
  details,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const getActionInfo = () => {
    switch (actionType) {
      case 'transaction':
        return {
          title: action === 'APPROVED' ? 'تأكيد قبول المعاملة' : 'تأكيد رفض المعاملة',
          message:
            action === 'APPROVED'
              ? 'هل أنت متأكد من قبول هذه المعاملة المالية؟'
              : 'هل أنت متأكد من رفض هذه المعاملة المالية؟',
          warning:
            action === 'APPROVED'
              ? 'سيتم إضافة المبلغ إلى رصيد المستخدم فوراً.'
              : 'لن يتم إضافة المبلغ إلى رصيد المستخدم.',
          confirmText: action === 'APPROVED' ? 'تأكيد القبول' : 'تأكيد الرفض',
          color: action === 'APPROVED' ? 'green' : 'red',
        }
      case 'booking':
        return {
          title: action === 'CONFIRMED' ? 'تأكيد الحجز' : 'إلغاء الحجز',
          message:
            action === 'CONFIRMED'
              ? 'هل أنت متأكد من تأكيد هذا الحجز؟'
              : 'هل أنت متأكد من إلغاء هذا الحجز؟',
          warning:
            action === 'CONFIRMED'
              ? 'سيتم إرسال تأكيد الحجز للمستخدم.'
              : 'سيتم إشعار المستخدم بإلغاء الحجز.',
          confirmText: action === 'CONFIRMED' ? 'تأكيد الحجز' : 'إلغاء الحجز',
          color: action === 'CONFIRMED' ? 'green' : 'red',
        }
      case 'timeSlot':
        return {
          title: 'حذف الموعد المتاح',
          message: 'هل أنت متأكد من حذف هذا الموعد المتاح؟',
          warning: 'سيؤثر هذا على جميع الحجوزات المرتبطة بهذا الموعد.',
          confirmText: 'حذف الموعد',
          color: 'red',
        }
      default:
        return {
          title: 'تأكيد العملية',
          message: 'هل أنت متأكد من تنفيذ هذه العملية؟',
          warning: 'هذا الإجراء لا يمكن التراجع عنه.',
          confirmText: 'تأكيد',
          color: 'red',
        }
    }
  }

  const actionInfo = getActionInfo()
  const isDestructive = actionInfo.color === 'red'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" dir="rtl">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 transform transition-all">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDestructive ? 'bg-red-100' : 'bg-green-100'}`}>
              {isDestructive ? (
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <div className="mr-4">
            <h3 className="text-lg font-bold text-gray-900">{actionInfo.title}</h3>
            <p className="text-sm text-gray-500">تأكيد العملية</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-3">{actionInfo.message}</p>
          {details && (
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <p className="text-sm text-gray-600">{details}</p>
            </div>
          )}
          <div className={`border rounded-lg p-3 ${isDestructive ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <p className={`text-sm ${isDestructive ? 'text-red-700' : 'text-green-700'}`}>{actionInfo.warning}</p>
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
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center ${
              isDestructive ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400' : 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                جاري التنفيذ...
              </>
            ) : (
              actionInfo.confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ActionConfirmationModal
