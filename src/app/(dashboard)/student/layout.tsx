'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { 
  LogOut, 
  User as UserIcon,
  BarChart3,
  Calendar,
  Settings,
  Menu,
  X
} from 'lucide-react'
import { FC } from 'react'

interface NavButtonProps {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}

const NavButton: FC<NavButtonProps> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`group relative flex items-center px-4 lg:px-6 py-3 text-sm font-medium rounded-xl transition-all duration-300 touch-manipulation ${
      active 
        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25' 
        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:shadow-md'
    }`}
  >
    {/* Active indicator */}
    {active && (
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white rounded-t-full shadow-lg"></div>
    )}
    
    <div className="flex items-center space-x-2 space-x-reverse">
      <div className={`flex items-center justify-center w-6 h-6 rounded-lg transition-all duration-300 ${
        active 
          ? 'text-white' 
          : 'text-gray-500 group-hover:text-blue-600'
      }`}>
        {icon}
      </div>
      <span className="font-medium tracking-wide hidden sm:inline">{label}</span>
    </div>
  </button>
)

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Determine active tab based on current pathname
  const getActiveTab = () => {
    if (pathname === '/student') return 'dashboard'
    if (pathname.includes('/student/mentorship')) return 'mentorship'
    if (pathname.includes('/student/profile')) return 'profile'
    return 'dashboard'
  }

  const activeTab = getActiveTab()

  const handleTabClick = (tab: string) => {
    setIsMobileMenuOpen(false)
    
    // Navigate to different routes based on tab
    const routes: { [key: string]: string } = {
      'dashboard': '/student',
      'mentorship': '/student/mentorship',
      'profile': '/student/profile'
    }
    
    if (routes[tab]) {
      window.location.href = routes[tab]
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  const navItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'mentorship', label: 'الإرشاد', icon: <UserIcon className="w-5 h-5" /> },
    { id: 'profile', label: 'الملف الشخصي', icon: <Settings className="w-5 h-5" /> },
  ]

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Modern Horizontal Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  CodeHub
                </h1>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-2 space-x-reverse">
              {navItems.map((item) => (
                <NavButton
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  active={activeTab === item.id}
                  onClick={() => handleTabClick(item.id)}
                />
              ))}
            </div>

            {/* User Profile & Actions */}
            <div className="flex items-center space-x-4 space-x-reverse">
              {/* User Info */}
              <div className="hidden sm:flex items-center space-x-3 space-x-reverse">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {session?.user?.name || 'المستخدم'}
                  </p>
                  <p className="text-xs text-gray-500">طالب</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center w-10 h-10 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 group"
                title="تسجيل الخروج"
              >
                <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden flex items-center justify-center w-10 h-10 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200/50">
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <NavButton
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  active={activeTab === item.id}
                  onClick={() => handleTabClick(item.id)}
                />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 w-full"> 
          {children}
      </main>
    </div>
  )
}