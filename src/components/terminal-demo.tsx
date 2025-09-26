"use client";

import { AnimatedSpan, Terminal } from "@/components/magicui/terminal";

export default function TerminalDemo() {
  return (
    <div className="relative text-right matrix-container w-full overflow-x-auto px-2 sm:px-4" dir="rtl">
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5 rounded-xl"></div>
      <div className="relative z-10 min-w-[280px]">
        <Terminal className="mx-auto w-full min-w-[280px] max-w-4xl backdrop-blur-sm border-green-500/40 shadow-green-500/30 xs:min-w-[320px] sm:min-w-[400px] md:min-w-[500px] lg:min-w-[600px] xl:min-w-[700px]">
          <div className="mb-2 sm:mb-3 flex items-center justify-between border-b border-green-500/20 pb-2">
            <div className="text-xs sm:text-sm text-green-400/70 font-mono">
              <span className="hidden sm:inline">MATRIX_SHELL</span>
              <span className="sm:hidden">M_SHELL</span>
            </div>
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-300 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            <div className="mb-1 sm:mb-2 hover:bg-green-500/5 p-1 rounded transition-all duration-200">
              <AnimatedSpan text="> " className="text-cyan-400 font-bold drop-shadow-[0_0_5px_rgba(34,211,238,0.8)] text-xs sm:text-sm" delay={0} />
              <AnimatedSpan text="دوست Push قولت خلي الكود يغور" delay={0} />
            </div>
            <div className="mb-1 sm:mb-2 hover:bg-green-500/5 p-1 rounded transition-all duration-200">
              <AnimatedSpan text="✓ " className="text-green-400 font-bold drop-shadow-[0_0_5px_rgba(34,197,94,0.8)] text-xs sm:text-sm" delay={2000} />
              <AnimatedSpan text="وانت دايما عن كوداتي دايس Enter و F4" delay={2000} />
            </div>
            <div className="mb-1 sm:mb-2 hover:bg-green-500/5 p-1 rounded transition-all duration-200">
              <AnimatedSpan text="✓ " className="text-yellow-400 font-bold drop-shadow-[0_0_5px_rgba(234,179,8,0.8)] text-xs sm:text-sm" delay={4000} />
              <AnimatedSpan text="حاول مرة تماكسيمايز شاشة الـ JavaScript اللي داب" delay={4000} />
            </div>
            <div className="mb-1 sm:mb-2 hover:bg-green-500/5 p-1 rounded transition-all duration-200">
              <AnimatedSpan text="✓ " className="text-green-400 font-bold drop-shadow-[0_0_5px_rgba(34,197,94,0.8)] text-xs sm:text-sm" delay={6000} />
              <AnimatedSpan text="ولما تبقى جوا الـ OOP دوس Alt ودوس Tab" delay={6000} />
            </div>
            <div className="mb-1 sm:mb-2 hover:bg-green-500/5 p-1 rounded transition-all duration-200">
              <AnimatedSpan text="> " className="text-cyan-400 font-bold drop-shadow-[0_0_5px_rgba(34,211,238,0.8)] text-xs sm:text-sm" delay={8000} />
              <AnimatedSpan text="نفسي أداري في الـ SOLID واملي كل الدنيا حب" delay={8000} />
            </div>
            <div className="mb-1 sm:mb-2 hover:bg-green-500/5 p-1 rounded transition-all duration-200">
              <AnimatedSpan text="✓ " className="text-green-400 font-bold drop-shadow-[0_0_5px_rgba(34,197,94,0.8)] text-xs sm:text-sm" delay={10000} />
              <AnimatedSpan text="لو انا في ستارت مينيو نفسي أكون على الديسكتوب" delay={10000} />
            </div>
            <div className="mb-1 sm:mb-2 hover:bg-green-500/5 p-1 rounded transition-all duration-200">
              <AnimatedSpan text="✓ " className="text-yellow-400 font-bold drop-shadow-[0_0_5px_rgba(234,179,8,0.8)] text-xs sm:text-sm" delay={12000} />
              <AnimatedSpan text="وارجع أسمع تاني منك كلمة Design Patterns اترددت" delay={12000} />
            </div>
            <div className="mb-1 sm:mb-2 hover:bg-green-500/5 p-1 rounded transition-all duration-200">
              <AnimatedSpan text="> " className="text-cyan-400 font-bold drop-shadow-[0_0_5px_rgba(34,211,238,0.8)] text-xs sm:text-sm" delay={14000} />
              <AnimatedSpan text="بص جوا قلبي هتلاقي مكتوب code.edit()" delay={14000} />
            </div>
            <div className="mb-1 sm:mb-2 hover:bg-green-500/5 p-1 rounded transition-all duration-200">
              <AnimatedSpan text="✓ " className="text-green-400 font-bold drop-shadow-[0_0_5px_rgba(34,197,94,0.8)] text-xs sm:text-sm" delay={16000} />
              <AnimatedSpan text="ليه يضيع الشوق ما بينا والـ recursion والإحساسات" delay={16000} />
            </div>
            <div className="mb-1 sm:mb-2 hover:bg-green-500/5 p-1 rounded transition-all duration-200">
              <AnimatedSpan text="✓ " className="text-red-400 font-bold drop-shadow-[0_0_5px_rgba(239,68,68,0.8)] text-xs sm:text-sm" delay={18000} />
              <AnimatedSpan text="اللي قسوتك عليا دول أساسا bugs وفايروسات" delay={18000} />
            </div>
            <div className="mb-1 sm:mb-2 hover:bg-green-500/5 p-1 rounded transition-all duration-200">
              <AnimatedSpan text="> " className="text-cyan-400 font-bold drop-shadow-[0_0_5px_rgba(34,211,238,0.8)] text-xs sm:text-sm" delay={20000} />
              <AnimatedSpan text="ياما من قرب الـ binary search فوقت واتسطلت" delay={20000} />
            </div>
            <div className="mb-1 sm:mb-2 hover:bg-green-500/5 p-1 rounded transition-all duration-200">
              <AnimatedSpan text="✓ " className="text-green-400 font-bold drop-shadow-[0_0_5px_rgba(34,197,94,0.8)] text-xs sm:text-sm" delay={22000} />
              <AnimatedSpan text="كل ما فتح tab ما بينا تيجي انت تدوس alt" delay={22000} />
            </div>
            <div className="mb-1 sm:mb-2 hover:bg-green-500/5 p-1 rounded transition-all duration-200">
              <AnimatedSpan text="✓ " className="text-yellow-400 font-bold drop-shadow-[0_0_5px_rgba(234,179,8,0.8)] text-xs sm:text-sm" delay={24000} />
              <AnimatedSpan text="ولما اقول الكود هيرن رجع قلبي قال مفتكرش" delay={24000} />
            </div>
            <div className="mb-1 sm:mb-2 hover:bg-green-500/5 p-1 rounded transition-all duration-200">
              <AnimatedSpan text="> " className="text-cyan-400 font-bold drop-shadow-[0_0_5px_rgba(34,211,238,0.8)] text-xs sm:text-sm" delay={26000} />
              <AnimatedSpan text="فين حنانك دوست F3 وعملت search" delay={26000} />
            </div>
            <div className="hover:bg-green-500/5 p-1 rounded transition-all duration-200">
              <AnimatedSpan text="✓ " className="text-green-400 font-bold drop-shadow-[0_0_5px_rgba(34,197,94,0.8)] text-xs sm:text-sm" delay={28000} />
              <AnimatedSpan text="انت كودك جوا عقلي اما loop يا إما بين صوابعي نط " delay={28000} />
            </div>
            <div className="mb-1 sm:mb-2 hover:bg-green-500/5 p-1 rounded transition-all duration-200">
              <AnimatedSpan text="> " className="text-cyan-400 font-bold drop-shadow-[0_0_5px_rgba(34,211,238,0.8)] text-xs sm:text-sm" delay={28000} />
              <AnimatedSpan text=" لو تفكيرك المنطقي وقف مش هينفع نكمل حتي لو عملت لــ Curser اي حاجة حتي لو عملت  shortcut" delay={28000} />
            </div>
          </div>
          
          {/* Matrix-style progress bar */}
          <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-green-500/20">
            <div className="flex items-center space-x-1 sm:space-x-2 text-xs text-green-400/70">
              <span className="animate-pulse">●</span>
              <span className="hidden sm:inline">Egyptian_Senior_SOFTWARE_ENGINEER...exe</span>
              <span className="sm:hidden">EG_DEV...exe</span>
              <div className="flex-1 bg-green-500/10 rounded-full h-1">
                <div className="bg-green-500 h-1 rounded-full animate-pulse" style={{ width: '85%' }}></div>
              </div>
            </div>
          </div>
        </Terminal>
      </div>
      
      {/* Floating Matrix particles around terminal */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-5 sm:top-10 left-2 sm:left-10 text-green-500/20 text-xs animate-bounce" style={{ animationDelay: '0s' }}>{'{ }'}</div>
        <div className="absolute top-10 sm:top-20 right-4 sm:right-20 text-green-400/20 text-xs animate-bounce" style={{ animationDelay: '1s' }}>{'[ ]'}</div>
        <div className="absolute bottom-10 sm:bottom-20 left-4 sm:left-20 text-green-300/20 text-xs animate-bounce" style={{ animationDelay: '2s' }}>{'< >'}</div>
        <div className="absolute bottom-5 sm:bottom-10 right-2 sm:right-10 text-green-500/20 text-xs animate-bounce" style={{ animationDelay: '3s' }}>{'( )'}</div>
        <div className="absolute top-1/2 left-1 sm:left-5 text-green-400/20 text-xs animate-pulse" style={{ animationDelay: '0.5s' }}>{'&&'}</div>
        <div className="absolute top-1/3 right-1 sm:right-5 text-green-300/20 text-xs animate-pulse" style={{ animationDelay: '1.5s' }}>{'||'}</div>
      </div>
    </div>
  );
}