'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, UserPlus, BookOpen } from 'lucide-react'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('يجب أن تكون كلمة المرور 6 أحرف على الأقل')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('تم إنشاء الحساب بنجاح! جاري التوجيه لصفحة تسجيل الدخول...')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        setError(data.error || 'حدث خطأ أثناء إنشاء الحساب')
      }
    } catch (error) {
      setError('حدث خطأ. يرجى المحاولة مرة أخرى.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-emerald-400/20 to-teal-600/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-md w-full">
        {/* Neumorphic Container */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h1 className="mt-6 text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              انضم إلينا
            </h1>
            <p className="mt-2 text-gray-600">
              أنشئ حسابك وابدأ رحلة التعلم
            </p>
          </div>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl p-4">
                <div className="text-sm text-red-700 text-center">{error}</div>
              </div>
            )}
            
            {success && (
              <div className="bg-green-50/80 backdrop-blur-sm border border-green-200 rounded-2xl p-4">
                <div className="text-sm text-green-700 text-center">{success}</div>
              </div>
            )}
            
            <div className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  الاسم الكامل
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-200 shadow-inner text-gray-900 placeholder-gray-500"
                  placeholder="أدخل اسمك الكامل"
                />
              </div>
              
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
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-200 shadow-inner text-gray-900 placeholder-gray-500"
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
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pr-12 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-200 shadow-inner text-gray-900 placeholder-gray-500"
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
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  تأكيد كلمة المرور
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pr-12 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-200 shadow-inner text-gray-900 placeholder-gray-500"
                    placeholder="أعد إدخال كلمة المرور"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
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
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3 px-6 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2 space-x-reverse">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>جاري إنشاء الحساب...</span>
                </div>
              ) : (
                'إنشاء حساب'
              )}
            </button>
            
            <div className="text-center">
              <p className="text-gray-600">
                لديك حساب بالفعل؟{' '}
                <Link
                  href="/login"
                  className="font-medium text-green-600 hover:text-green-500 transition-colors"
                >
                  تسجيل الدخول
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}