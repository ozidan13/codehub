'use client'

import { FC } from 'react'
import { Users, User as UserIcon, FileText, Clock } from 'lucide-react'
import { AdminStats } from './types'
import PageHeader from './PageHeader'
import StatCard from './StatCard'

interface OverviewTabProps {
  stats: AdminStats | null
}

const OverviewTab: FC<OverviewTabProps> = ({ stats }) => {
  if (!stats) return <div>لا توجد بيانات لعرضها.</div>
  return (
    <>
      <PageHeader title="نظرة عامة" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Users />} title="إجمالي المستخدمين" value={stats.totalUsers} />
        <StatCard icon={<UserIcon />} title="إجمالي الطلاب" value={stats.totalStudents} />
        <StatCard icon={<FileText />} title="إجمالي التقديمات" value={stats.totalSubmissions} />
        <StatCard icon={<Clock />} title="التقديمات المعلقة" value={stats.pendingSubmissions} color="text-yellow-500" />
      </div>
    </>
  )
}

export default OverviewTab
