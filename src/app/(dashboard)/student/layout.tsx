'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { 
  Users, 
  BookOpen, 
  Clock, 
  LogOut, 
  User as UserIcon,
  BarChart3,
  FileText,
  Wallet,
  Calendar,
  Settings,
  Menu,
  X
} from 'lucide-react'
import { FC } from 'react'

interface TabButtonProps {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}

const TabButton: FC<TabButtonProps> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden ${
      active 
        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-xl border-2 border-blue-300' 
        : 'text-gray-300 hover:text-blue-400 hover:bg-gradient-to-r hover:from-gray-700 hover:to-gray-600 border-2 border-transparent hover:border-blue-400'
    }`}
  >
    {active && (
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-20 animate-pulse"></div>
    )}
    <div className="relative flex items-center">
      {icon}
      <span className="mr-3">{label}</span>
    </div>
  </button>
)

interface PageHeaderProps {
  title: string
  children?: React.ReactNode
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

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setSidebarOpen(false)
    
    // Navigate to different routes based on tab
    const routes: { [key: string]: string } = {
      'dashboard': '/student',
      'transactions': '/student/recenttransactions',
      'platforms': '/student/platforms',
      'tasks': '/student/tasks',
      'mentorship': '/student/mentorship',
      'profile': '/student/profile'
    }
    
    if (routes[tab]) {
      window.location.href = routes[tab]
    }
  }

  return (
    <div dir="rtl" className="flex h-screen bg-gray-100 font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed lg:relative lg:translate-x-0 w-64 bg-gray-800 text-white flex flex-col shrink-0 z-50 transition-transform duration-300 ease-in-out lg:transition-none`}>
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">لوحة الطالب</h1>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <nav className="flex-1 p-2 space-y-2">
          <TabButton 
            icon={<BarChart3 />} 
            label="لوحة التحكم" 
            active={activeTab === 'dashboard'} 
            onClick={() => handleTabChange('dashboard')} 
          />
          <TabButton 
            icon={<Wallet />} 
            label="المعاملات المالية" 
            active={activeTab === 'transactions'} 
            onClick={() => handleTabChange('transactions')} 
          />
          {
            /*
            <TabButton 
            icon={<BookOpen />} 
            label="المنصات" 
            active={activeTab === 'platforms'} 
            onClick={() => handleTabChange('platforms')} 
          />
          <TabButton 
            icon={<FileText />} 
            label="المهام" 
            active={activeTab === 'tasks'} 
            onClick={() => handleTabChange('tasks')} 
          />
          <TabButton 
            icon={<Calendar />} 
            label="جلسات الإرشاد" 
            active={activeTab === 'mentorship'} 
            onClick={() => handleTabChange('mentorship')} 
          />
            */
          }
          <TabButton 
            icon={<UserIcon />} 
            label="الملف الشخصي" 
            active={activeTab === 'profile'} 
            onClick={() => handleTabChange('profile')} 
          />
        </nav>
        
        {/* User Info Section */}
        {session?.user && (
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center ml-3">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {session.user.name}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {session.user.email}
                </p>
              </div>
            </div>
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors duration-200"
            >
              <LogOut className="ml-2 h-5 w-5" />
              تسجيل الخروج
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 hover:text-gray-900"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">لوحة الطالب</h1>
            <div className="w-6 h-6" /> {/* Spacer */}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-md p-6 min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}