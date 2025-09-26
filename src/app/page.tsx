'use client';

import Link from 'next/link'
import { BookOpen, Code, Terminal, Cpu, Zap, Binary } from 'lucide-react'
import TerminalDemo from '@/components/terminal-demo'
import DigitalRain from '@/components/digital-rain'
import MatrixParticles from '@/components/matrix-particles'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Matrix Digital Rain Background */}
      <DigitalRain />
      
      {/* Matrix Particles */}
      <MatrixParticles />

      {/* Floating Programming Shapes */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating Code Symbols */}
        <div className="floating-shape absolute top-20 left-2 sm:left-10 text-green-400 opacity-30 animate-pulse">
          <Code size={16} className="sm:w-6 sm:h-6" />
        </div>
        <div className="floating-shape absolute top-40 right-4 sm:right-20 text-green-300 opacity-40 animate-bounce">
          <Terminal size={14} className="sm:w-5 sm:h-5" />
        </div>
        <div className="floating-shape absolute bottom-40 left-4 sm:left-20 text-green-500 opacity-25 animate-pulse">
          <Cpu size={18} className="sm:w-7 sm:h-7" />
        </div>
        <div className="floating-shape absolute bottom-20 right-8 sm:right-40 text-green-400 opacity-35 animate-bounce">
          <Binary size={16} className="sm:w-6 sm:h-6" />
        </div>
        <div className="floating-shape absolute top-60 left-1/3 text-green-300 opacity-30 animate-pulse">
          <Zap size={18} className="sm:w-7 sm:h-7" />
        </div>
        
        {/* Floating Code Snippets */}
        <div className="absolute top-32 right-2 sm:right-10 text-green-400 opacity-20 font-mono text-xs sm:text-xs animate-pulse">
          {'{ code: "life" }'}
        </div>
        <div className="absolute bottom-60 left-8 sm:left-40 text-green-300 opacity-25 font-mono text-xs sm:text-xs animate-bounce">
          {'function() { learn(); }'}
        </div>
        <div className="absolute top-80 right-1/3 text-green-500 opacity-20 font-mono text-xs sm:text-xs animate-pulse">
          {'while(true) { improve(); }'}
        </div>
      </div>

      {/* Glassmorphism Header */}
      <header className="relative z-10 backdrop-blur-md bg-black/30 border-b border-green-500/20">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-center space-x-2 space-x-reverse">
            <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-green-400 drop-shadow-lg" />
            <h1 className="text-xl sm:text-2xl font-bold text-green-400 font-mono tracking-wider drop-shadow-lg">
              codeHub
            </h1>
            <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-green-400 drop-shadow-lg" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-2 sm:px-4 lg:px-8 py-10 sm:py-20">
        <div className="max-w-5xl mx-auto text-center w-full">
          
           {/* Action Buttons with Glassmorphism */}
           <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-8 sm:mb-0">
             <Link
               href="/signup"
               className="group relative backdrop-blur-xl bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 hover:border-green-400 text-green-400 hover:text-green-300 px-6 sm:px-10 py-3 sm:py-4 rounded-2xl text-lg sm:text-xl font-mono font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 pulse-green matrix-glow"
             >
               <span className="relative z-10">إنشاء حساب</span>
               <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-green-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
             </Link>
             <Link
               href="/login"
               className="group relative backdrop-blur-xl bg-black/40 hover:bg-black/60 border border-green-500/30 hover:border-green-400/50 text-green-300 hover:text-green-200 px-6 sm:px-10 py-3 sm:py-4 rounded-2xl text-lg sm:text-xl font-mono font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/10 glass-effect"
             >
               <span className="relative z-10">تسجيل الدخول</span>
               <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-green-400/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
             </Link>
           </div>

          {/* Terminal Demo with Enhanced Styling */}
          <div className="mt-8 sm:mt-14">
            
            <TerminalDemo />
          </div>

         

          
        </div>
      </main>

      

      <style jsx>{`
        .floating-shape {
          animation-duration: 4s;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
        }
        
        .floating-shape:nth-child(odd) {
          animation-name: float-up;
        }
        
        .floating-shape:nth-child(even) {
          animation-name: float-down;
        }
        
        @keyframes float-up {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(180deg); }
        }
        
        @keyframes float-down {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(30px) rotate(-180deg); }
        }
        
        /* Glassmorphism enhancement */
        .glass-effect {
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          background: rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        /* Matrix glow effect */
        .matrix-glow {
          box-shadow: 
            0 0 20px rgba(0, 255, 0, 0.3),
            0 0 40px rgba(0, 255, 0, 0.2),
            0 0 60px rgba(0, 255, 0, 0.1);
        }
        
        /* Pulse animation for buttons */
        .pulse-green {
          animation: pulse-green 2s infinite;
        }
        
        @keyframes pulse-green {
          0% { box-shadow: 0 0 0 0 rgba(0, 255, 0, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(0, 255, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 255, 0, 0); }
        }
      `}</style>
    </div>
  );
}
