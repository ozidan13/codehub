'use client'

import { FC } from 'react'
import { Plus } from 'lucide-react'
import { Platform } from './types'
import PageHeader from './PageHeader'
import Table from './Table'
import ActionButtons from './ActionButtons'

interface PlatformsTabProps {
  platforms: Platform[]
  onEdit: (p: Platform, t: 'platform') => void
  onDelete: (p: Platform, t: 'platform') => void
  onCreate: () => void
}

const PlatformsTab: FC<PlatformsTabProps> = ({ platforms, onEdit, onDelete, onCreate }) => (
  <>
    <PageHeader title="المنصات">
      <button
        onClick={onCreate}
        className="flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
      >
        <Plus className="ml-2 h-5 w-5" />
        إضافة منصة
      </button>
    </PageHeader>
    <Table
      headers={['الاسم', 'الوصف', 'الرابط', 'تاريخ الإنشاء', 'الإجراءات']}
      rows={platforms.map((p) => [
        p.name,
        p.description,
        <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">زيارة</a>,
        new Date(p.createdAt).toLocaleDateString('en-US'),
        <ActionButtons key={`actions-${p.id}`} onEdit={() => onEdit(p, 'platform')} onDelete={() => onDelete(p, 'platform')} />,
      ])}
    />
  </>
)

export default PlatformsTab
