'use client'

import Link from 'next/link'
import { BookOpen, Clock } from 'lucide-react'

export default function SignupPage() {
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
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <h1 className="mt-6 text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              قريباً جداً
            </h1>
            <p className="mt-4 text-lg text-gray-700 font-medium">
              انتظر الأيام المقبلة للتسجيل في المينتورشيب
            </p>
            <p className="mt-2 text-gray-600">
              نحن نعمل على تحسين تجربة التسجيل لتكون أفضل
            </p>
          </div>
          
          {/* Coming Soon Message */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
            <div className="text-center">
              <BookOpen className="mx-auto h-12 w-12 text-amber-600 mb-4" />
              <h3 className="text-lg font-semibold text-amber-800 mb-2">
                التسجيل متاح قريباً
              </h3>
              <p className="text-amber-700">
                سيتم فتح باب التسجيل في المينتورشيب خلال الأيام القادمة. ترقبوا الإعلان!
              </p>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              لديك حساب بالفعل؟
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3 px-6 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}