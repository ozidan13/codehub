'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, LogIn, BookOpen } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
      } else {
        // Get the updated session to check user role
        const session = await getSession()
        if (session?.user?.role === 'ADMIN') {
          router.push('/admin')
        } else {
          router.push(callbackUrl)
        }
      }
    } catch (error) {
      setError('حدث خطأ. يرجى المحاولة مرة أخرى.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-md w-full">
        {/* Neumorphic Container */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h1 className="mt-6 text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              مرحباً بك
            </h1>
            <p className="mt-2 text-gray-600">
              سجل دخولك لمتابعة رحلة التعلم
            </p>
          </div>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl p-4">
                <div className="text-sm text-red-700 text-center">{error}</div>
              </div>
            )}
            
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  البريد الإلكتروني
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 shadow-inner text-gray-900 placeholder-gray-500"
                  placeholder="أدخل بريدك الإلكتروني"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 shadow-inner text-gray-900 placeholder-gray-500"
                    placeholder="أدخل كلمة المرور"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-6 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2 space-x-reverse">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>جاري تسجيل الدخول...</span>
                </div>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
            
            <div className="text-center">
              <p className="text-gray-600">
                ليس لديك حساب؟{' '}
                <Link
                  href="/signup"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  إنشاء حساب جديد
                </Link>
              </p>
            </div>
            
            {/* Demo Accounts */}
            <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200">
              <div className="text-center text-sm text-gray-600 mb-2">
                حسابات تجريبية:
              </div>
              <div className="space-y-1 text-xs text-gray-500">
                <div className="bg-white/60 rounded-lg p-2">
                  <strong>مدير:</strong> admin@codehub.com / admin123
                </div>
                <div className="bg-white/60 rounded-lg p-2">
                  <strong>طالب:</strong> student@codehub.com / student123
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}