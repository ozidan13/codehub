'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { User, Mail, Phone, Calendar, MapPin, BookOpen, Trophy, Clock } from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string
  joinDate: string
  location?: string
  bio?: string
  totalCourses: number
  completedCourses: number
  totalHours: number
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!session?.user) return
      
      try {
        const response = await fetch('/api/student')
        if (response.ok) {
          const data = await response.json()
          
          // Transform API data to profile format
          const profileData: UserProfile = {
            id: data.user.id,
            name: data.user.name || 'الطالب',
            email: data.user.email,
            phone: session.user.phoneNumber || undefined,
            joinDate: new Date(session.user.createdAt || Date.now()).toISOString().split('T')[0],
            location: undefined, // Not available in current API
            bio: undefined, // Not available in current API
            totalCourses: data.stats.totalTasks || 0,
            completedCourses: data.stats.approvedSubmissions || 0,
            totalHours: Math.round((data.stats.approvedSubmissions || 0) * 2.5) // Estimate 2.5 hours per completed task
          }
          
          setProfile(profileData)
        } else {
           console.error('Failed to fetch profile data')
           setError('فشل في تحميل بيانات الملف الشخصي')
         }
       } catch (error) {
         console.error('Error fetching profile data:', error)
         setError('حدث خطأ أثناء تحميل البيانات')
       } finally {
         setIsLoading(false)
       }
    }
    
    fetchProfileData()
  }, [session])

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96" dir="rtl">
        <div className="text-center">
          <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16 mb-4 mx-auto"></div>
          <h2 className="text-xl font-semibold text-gray-700">جاري تحميل الملف الشخصي...</h2>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96" dir="rtl">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">{error}</h2>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-16" dir="rtl">
        <h2 className="text-xl font-semibold text-gray-700">لم يتم العثور على الملف الشخصي</h2>
      </div>
    )
  }

  return (
    <div className="space-y-8" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center space-x-4 space-x-reverse">
        <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
          <User className="h-7 w-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">الملف الشخصي</h1>
          <p className="text-sm text-gray-500">عرض وإدارة معلوماتك الشخصية</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Cover Section */}
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
          <div className="absolute -bottom-16 right-8">
            <div className="h-32 w-32 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
              <User className="h-16 w-16 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-20 pb-8 px-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">{profile.name}</h2>
              {profile.bio && <p className="text-gray-600 mb-4">{profile.bio}</p>}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center space-x-3 space-x-reverse text-gray-600">
                  <Mail className="h-5 w-5 text-blue-500" />
                  <span>{profile.email}</span>
                </div>
                
                {profile.phone && (
                  <div className="flex items-center space-x-3 space-x-reverse text-gray-600">
                    <Phone className="h-5 w-5 text-green-500" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-3 space-x-reverse text-gray-600">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  <span>انضم في {new Date(profile.joinDate).toLocaleDateString('ar-SA', { calendar: 'gregory' })}</span>
                </div>
                
                {profile.location && (
                  <div className="flex items-center space-x-3 space-x-reverse text-gray-600">
                    <MapPin className="h-5 w-5 text-red-500" />
                    <span>{profile.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .loader {
          border-top-color: #3498db;
          animation: spinner 1.5s linear infinite;
        }
        
        @keyframes spinner {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}