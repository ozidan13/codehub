'use client'

import { FC } from 'react'
import { Plus } from 'lucide-react'
import { Task } from './types'
import PageHeader from './PageHeader'
import Table from './Table'
import ActionButtons from './ActionButtons'

interface TasksTabProps {
  tasks: Task[]
  onEdit: (t: Task, type: 'task') => void
  onDelete: (t: Task, type: 'task') => void
  onCreate: () => void
}

const TasksTab: FC<TasksTabProps> = ({ tasks, onEdit, onDelete, onCreate }) => (
  <>
    <PageHeader title="المهام">
      <button
        onClick={onCreate}
        className="flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
      >
        <Plus className="ml-2 h-5 w-5" />
        إضافة مهمة
      </button>
    </PageHeader>
    <Table
      headers={['العنوان', 'المنصة', 'الترتيب', 'تاريخ الإنشاء', 'الإجراءات']}
      rows={tasks.map((t) => [
        t.title,
        t.platform?.name || 'N/A',
        t.order,
        new Date(t.createdAt).toLocaleDateString('en-US'),
        <ActionButtons key={`actions-${t.id}`} onEdit={() => onEdit(t, 'task')} onDelete={() => onDelete(t, 'task')} />,
      ])}
    />
  </>
)

export default TasksTab
