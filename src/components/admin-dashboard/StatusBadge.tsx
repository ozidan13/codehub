'use client'

import { FC } from 'react'
import { Clock, CheckCircle, XCircle } from 'lucide-react'

interface StatusBadgeProps {
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

const StatusBadge: FC<StatusBadgeProps> = ({ status }) => {
  const config = {
    PENDING: {
      text: 'معلق',
      color: 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300',
      icon: Clock,
    },
    APPROVED: {
      text: 'مقبول',
      color: 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300',
      icon: CheckCircle,
    },
    REJECTED: {
      text: 'مرفوض',
      color: 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300',
      icon: XCircle,
    },
  }
  const statusConfig = config[status]
  const IconComponent = statusConfig.icon
  return (
    <span className={`px-3 py-1 inline-flex items-center text-xs font-semibold rounded-full ${statusConfig.color}`}>
      <IconComponent className="w-3 h-3 mr-1" />
      {statusConfig.text}
    </span>
  )
}

export default StatusBadge
