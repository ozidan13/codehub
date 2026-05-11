'use client'

import { FC } from 'react'
import { Plus } from 'lucide-react'
import { User } from './types'
import PageHeader from './PageHeader'
import Table from './Table'
import ActionButtons from './ActionButtons'

interface UsersTabProps {
  users: User[]
  onEdit: (u: User, type: 'user') => void
  onDelete: (u: User, type: 'user') => void
  onCreate: () => void
}

const UsersTab: FC<UsersTabProps> = ({ users, onEdit, onDelete, onCreate }) => (
  <>
    <PageHeader title="المستخدمون">
      <button
        onClick={onCreate}
        className="flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
      >
        <Plus className="ml-2 h-5 w-5" />
        إضافة مستخدم
      </button>
    </PageHeader>
    <Table
      headers={['الاسم', 'البريد الإلكتروني', 'الدور', 'تاريخ التسجيل', 'الإجراءات']}
      rows={users.map((u) => [
        u.name,
        u.email,
        <span key={u.id} className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === 'ADMIN' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{u.role}</span>,
        new Date(u.createdAt).toLocaleDateString('en-US'),
        <ActionButtons key={`actions-${u.id}`} onEdit={() => onEdit(u, 'user')} onDelete={() => onDelete(u, 'user')} />,
      ])}
    />
  </>
)

export default UsersTab
