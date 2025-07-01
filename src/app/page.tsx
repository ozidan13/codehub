'use client';

import Link from 'next/link'
import { BookOpen, Users, Trophy, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  const platforms = [
    {
      name: 'Algorithms & Data Structures',
      description: 'Master fundamental algorithms and data structures',
      icon: '🧮',
      url: 'https://ozidan13.github.io/algorithms/'
    },
    {
      name: 'Object-Oriented Programming',
      description: 'Learn OOP concepts and principles',
      icon: '🏗️',
      url: 'https://oop-pi.vercel.app/'
    },
    {
      name: 'SOLID & Design Patterns',
      description: 'Apply SOLID principles and design patterns',
      icon: '🎯',
      url: 'https://ozidan13.github.io/SOLID-Principles-Design-Patterns/'
    },
    {
      name: 'JavaScript Interview Prep',
      description: 'Prepare for technical interviews',
      icon: '💼',
      url: 'https://javascriptinterview-kappa.vercel.app/'
    },
    {
      name: 'JavaScript Practice Tasks',
      description: 'Hands-on JavaScript programming',
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
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">CodeHub</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/signin"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Master Programming
            <span className="text-blue-600"> Step by Step</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Track your learning progress across five comprehensive programming platforms. 
            Submit task summaries, receive feedback, and advance your skills systematically.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors flex items-center justify-center"
            >
              Start Learning
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/dashboard"
              className="border border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium transition-colors"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Why Choose CodeHub?</h3>
            <p className="text-lg text-gray-600">Everything you need to track and improve your programming skills</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Structured Learning</h4>
              <p className="text-gray-600">Follow a carefully designed curriculum across five key programming areas</p>
            </div>
            <div className="text-center p-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Progress Tracking</h4>
              <p className="text-gray-600">Monitor your advancement with detailed progress reports and scoring</p>
            </div>
            <div className="text-center p-6">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Expert Feedback</h4>
              <p className="text-gray-600">Receive personalized feedback from instructors on your submissions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Platforms */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Learning Platforms</h3>
            <p className="text-lg text-gray-600">Five comprehensive platforms to master programming fundamentals</p>
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
                  Explore Platform
                  <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <BookOpen className="h-8 w-8 text-blue-400" />
            <h1 className="text-2xl font-bold">CodeHub</h1>
          </div>
          <p className="text-gray-400 mb-4">Empowering developers through structured learning and progress tracking</p>
          <p className="text-gray-500 text-sm">© 2024 CodeHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
