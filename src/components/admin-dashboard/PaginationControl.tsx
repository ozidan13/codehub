'use client'

import { FC } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationControlProps {
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
}

const PaginationControl: FC<PaginationControlProps> = ({ page, totalPages, total, onPageChange }) => {
  if (totalPages <= 1) return null
  return (
    <div className="mt-6 flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200">
      <div>
        <span className="text-sm text-gray-700">
          صفحة <span className="font-bold text-blue-600">{page}</span> من <span className="font-bold">{totalPages}</span>
          <span className="text-gray-500">({total} إجمالي العناصر)</span>
        </span>
      </div>
      <div className="flex space-x-2 space-x-reverse">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium">{page}</span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

export default PaginationControl
