'use client'

import { FC } from 'react'
import { Edit, Trash2 } from 'lucide-react'

interface ActionButtonsProps {
  onEdit: () => void
  onDelete?: () => void
}

const ActionButtons: FC<ActionButtonsProps> = ({ onEdit, onDelete }) => (
  <div className="flex space-x-2 space-x-reverse">
    <button
      onClick={onEdit}
      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 hover:text-indigo-700 transition-all duration-200"
    >
      <Edit className="w-4 h-4 mr-1" />
      تعديل
    </button>
    {onDelete && (
      <button
        onClick={onDelete}
        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 hover:text-red-700 transition-all duration-200"
      >
        <Trash2 className="w-4 h-4 mr-1" />
        حذف
      </button>
    )}
  </div>
)

export default ActionButtons
