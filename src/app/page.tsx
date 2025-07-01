'use client';

import Link from 'next/link'
import { BookOpen, Users, Trophy, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  const platforms = [
    {
      name: 'الخوارزميات وهياكل البيانات',
      description: 'أتقن الخوارزميات الأساسية وهياكل البيانات',
      icon: '🧮',
      url: 'https://ozidan13.github.io/algorithms/'
    },
    {
      name: 'البرمجة الكائنية التوجه',
      description: 'تعلم مفاهيم ومبادئ البرمجة الكائنية',
      icon: '🏗️',
      url: 'https://oop-pi.vercel.app/'
    },
    {
      name: 'مبادئ SOLID وأنماط التصميم',
      description: 'طبق مبادئ SOLID وأنماط التصميم',
      icon: '🎯',
      url: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/'
    },
    {
      name: 'التحضير لمقابلات JavaScript',
      description: 'استعد للمقابلات التقنية',
      icon: '💼',
      url: 'https://javascriptinterview-kappa.vercel.app/'
    },
    {
      name: 'مهام JavaScript العملية',
      description: 'برمجة JavaScript العملية والتطبيقية',
      icon: '⚡',
      url: 'https://ozidan13.github.io/js-tasks/'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 space-x-reverse">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">كود هاب</h1>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/auth/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                ابدأ الآن
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            أتقن البرمجة
            <span className="text-blue-600"> خطوة بخطوة</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            تتبع تقدمك في التعلم عبر خمس منصات برمجة شاملة. 
            قدم ملخصات المهام، احصل على التغذية الراجعة، وطور مهاراتك بشكل منهجي.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors flex items-center justify-center"
            >
              ابدأ التعلم
              <ArrowRight className="mr-2 h-5 w-5" />
            </Link>
            <Link
              href="/dashboard"
              className="border border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium transition-colors"
            >
              عرض لوحة التحكم
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">لماذا تختار كود هاب؟</h3>
            <p className="text-lg text-gray-600">كل ما تحتاجه لتتبع وتحسين مهاراتك في البرمجة</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">التعلم المنظم</h4>
              <p className="text-gray-600">اتبع منهجاً مصمماً بعناية عبر خمسة مجالات برمجية أساسية</p>
            </div>
            <div className="text-center p-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">تتبع التقدم</h4>
              <p className="text-gray-600">راقب تقدمك من خلال تقارير مفصلة ونظام تقييم شامل</p>
            </div>
            <div className="text-center p-6">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">تغذية راجعة من الخبراء</h4>
              <p className="text-gray-600">احصل على تغذية راجعة شخصية من المدربين على مشاريعك</p>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Platforms */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">منصات التعلم</h3>
            <p className="text-lg text-gray-600">خمس منصات شاملة لإتقان أساسيات البرمجة</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platforms.map((platform, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{platform.icon}</div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">{platform.name}</h4>
                <p className="text-gray-600 mb-4">{platform.description}</p>
                <a
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
                >
                  استكشف المنصة
                  <ArrowRight className="mr-1 h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 space-x-reverse mb-4">
            <BookOpen className="h-8 w-8 text-blue-400" />
            <h1 className="text-2xl font-bold">كود هاب</h1>
          </div>
          <p className="text-gray-400 mb-4">تمكين المطورين من خلال التعلم المنظم وتتبع التقدم</p>
          <p className="text-gray-500 text-sm">© 2024 كود هاب. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
}
