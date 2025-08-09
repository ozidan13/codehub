'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { 
  LogOut, 
  User as UserIcon,
  BarChart3,
  Wallet,
  Calendar,
  Settings,
  Menu,
  X,
  ChevronLeft
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
    className={`group w-full flex items-center px-3 sm:px-4 py-3 sm:py-3.5 text-xs sm:text-sm font-medium rounded-2xl transition-all duration-300 relative overflow-hidden mb-1 touch-manipulation ${
      active 
        ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white shadow-2xl shadow-blue-500/25 transform scale-105' 
        : 'text-gray-400 hover:text-white hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-600/50 hover:shadow-lg hover:shadow-gray-900/20 hover:scale-102'
    }`}
  >
    {/* Active indicator */}
    {active && (
      <>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-indigo-500/30 animate-pulse"></div>
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 sm:h-8 bg-white rounded-l-full shadow-lg"></div>
      </>
    )}
    
    {/* Hover glow effect */}
    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-indigo-600/0 group-hover:from-blue-500/10 group-hover:to-indigo-600/10 transition-all duration-300 rounded-2xl"></div>
    
    <div className="relative flex items-center w-full">
      <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl transition-all duration-300 ${
        active 
          ? 'bg-white/20 text-white shadow-lg' 
          : 'bg-gray-700/50 text-gray-400 group-hover:bg-gray-600/50 group-hover:text-white'
      }`}>
        {icon}
      </div>
      <span className="mr-3 sm:mr-4 font-medium tracking-wide">{label}</span>
      <ChevronLeft className={`w-3 h-3 sm:w-4 sm:h-4 mr-auto transition-all duration-300 ${
        active ? 'text-white/80 rotate-180' : 'text-gray-500 group-hover:text-gray-300 group-hover:translate-x-1'
      }`} />
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
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Determine active tab based on current pathname
  const getActiveTab = () => {
    if (pathname === '/student') return 'dashboard'
    if (pathname.includes('/student/recenttransactions')) return 'transactions'
    if (pathname.includes('/student/platforms')) return 'platforms'
    if (pathname.includes('/student/tasks')) return 'tasks'
    if (pathname.includes('/student/mentorship')) return 'mentorship'
    if (pathname.includes('/student/profile')) return 'profile'
    return 'dashboard'
  }

  const activeTab = getActiveTab()

  const handleTabChange = (tab: string) => {
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
          className="fixed inset-0 bg-black bg-opacity-50 z-40 xl:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      } fixed xl:relative xl:translate-x-0 right-0 xl:right-auto w-64 sm:w-72 lg:w-80 xl:w-72 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col shrink-0 z-50 transition-transform duration-300 ease-in-out xl:transition-none shadow-2xl`}>
        {/* Header */}
        <div className="p-4 sm:p-5 lg:p-6 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-700/30 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse">
              <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-4 h-4 sm:w-4.5 sm:h-4.5 lg:w-5 lg:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">لوحة الطالب</h1>
                <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">نظام إدارة التعلم</p>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="xl:hidden text-gray-400 hover:text-white hover:bg-gray-700/50 p-1.5 sm:p-2 rounded-xl transition-all duration-200 touch-manipulation"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-3 sm:p-4 lg:p-6 space-y-1 sm:space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
          <TabButton 
            icon={<BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />} 
            label="لوحة التحكم" 
            active={activeTab === 'dashboard'} 
            onClick={() => handleTabChange('dashboard')} 
          />
          <TabButton 
            icon={<Wallet className="w-4 h-4 sm:w-5 sm:h-5" />} 
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
            icon={<Calendar className="w-4 h-4 sm:w-5 sm:h-5" />} 
            label="جلسات الإرشاد" 
            active={activeTab === 'mentorship'} 
            onClick={() => handleTabChange('mentorship')} 
          />
          
          <TabButton 
            icon={<UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />} 
            label="الملف الشخصي" 
            active={activeTab === 'profile'} 
            onClick={() => handleTabChange('profile')} 
          />
        </nav>
        
        {/* User Info Section */}
        {session?.user && (
          <div className="p-3 sm:p-4 lg:p-6 border-t border-gray-700/50 bg-gradient-to-r from-gray-800/30 to-gray-700/20 backdrop-blur-sm">
            <div className="flex items-center mb-3 sm:mb-4 p-2.5 sm:p-3 bg-gray-800/50 rounded-2xl border border-gray-700/30">
              <div className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center ml-2.5 sm:ml-3 shadow-lg ring-2 ring-blue-500/20">
                <UserIcon className="w-5 h-5 sm:w-5.5 sm:h-5.5 lg:w-6 lg:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-white truncate mb-0.5 sm:mb-1">
                  {session.user.name}
                </p>
                <p className="text-xs text-gray-400 truncate hidden sm:block">
                  {session.user.email}
                </p>
                <div className="flex items-center mt-0.5 sm:mt-1">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full ml-1.5 sm:ml-2 animate-pulse"></div>
                  <span className="text-xs text-green-400 font-medium">متصل</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center justify-center px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 rounded-2xl hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105 group touch-manipulation"
            >
              <LogOut className="ml-1.5 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-12 transition-transform duration-300" />
              <span className="font-semibold">تسجيل الخروج</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Mobile Header */}
        <header className="xl:hidden bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-xl transition-all duration-200 touch-manipulation"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">لوحة الطالب</h1>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10" /> {/* Spacer */}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 min-h-full relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/10 to-pink-600/10 rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="relative z-10">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}