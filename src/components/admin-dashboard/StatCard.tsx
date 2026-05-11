'use client'

import { FC, ReactNode } from 'react'

interface StatCardProps {
  icon: ReactNode
  title: string
  value: number | string
  color?: string
}

const StatCard: FC<StatCardProps> = ({ icon, title, value, color = 'text-blue-500' }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 ${color}`}>{icon}</div>
        <div className="mr-4">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
      <div className="text-green-500 text-sm font-medium bg-green-50 px-2 py-1 rounded-full">+12%</div>
    </div>
  </div>
)

export default StatCard
