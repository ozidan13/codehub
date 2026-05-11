'use client'

import { FC, ReactNode } from 'react'
import { Settings } from 'lucide-react'

interface PageHeaderProps {
  title: string
  children?: ReactNode
}

const PageHeader: FC<PageHeaderProps> = ({ title, children }) => (
  <div className="flex justify-between items-center mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
    <div className="flex items-center">
      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center ml-4">
        <Settings className="w-6 h-6 text-white" />
      </div>
      <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent capitalize">{title}</h2>
    </div>
    <div className="flex items-center space-x-4 space-x-reverse">{children}</div>
  </div>
)

export default PageHeader
