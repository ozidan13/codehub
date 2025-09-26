"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface AnimatedSpanProps {
  text: string;
  className?: string;
  delay?: number;
}

export const AnimatedSpan = ({ text, className, delay = 0 }: AnimatedSpanProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    // Initial delay before starting to type
    if (!hasStarted) {
      const initialTimeout = setTimeout(() => {
        setHasStarted(true);
      }, delay);
      return () => clearTimeout(initialTimeout);
    }

    // Character typing effect
    if (hasStarted && currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, 50);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, delay, hasStarted]);

  return (
    <span 
      className={cn(
        "text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse",
        "hover:text-green-300 hover:drop-shadow-[0_0_12px_rgba(34,197,94,1)] transition-all duration-200",
        className
      )}
      style={{
        textShadow: '0 0 10px rgba(34, 197, 94, 0.8), 0 0 20px rgba(34, 197, 94, 0.4), 0 0 30px rgba(34, 197, 94, 0.2)',
      }}
    >
      {displayedText}
      {hasStarted && currentIndex < text.length && (
        <span className="animate-pulse text-green-300">|</span>
      )}
    </span>
  );
};

interface TypingAnimationProps {
  text: string;
  duration?: number;
  className?: string;
}

export const TypingAnimation = ({
  text,
  duration = 200,
  className,
}: TypingAnimationProps) => {
  const [displayedText, setDisplayedText] = useState<string>("");
  const [i, setI] = useState<number>(0);

  useEffect(() => {
    const typingEffect = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.substring(0, i + 1));
        setI(i + 1);
      } else {
        clearInterval(typingEffect);
      }
    }, duration);

    return () => {
      clearInterval(typingEffect);
    };
  }, [duration, i, text]);

  return (
    <h1
      className={cn(
        "font-display text-center text-4xl font-bold leading-[5rem] tracking-[-0.02em]",
        "text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]",
        "hover:text-green-300 hover:drop-shadow-[0_0_25px_rgba(34,197,94,1)]",
        "transition-all duration-300 animate-pulse",
        className,
      )}
      style={{
        textShadow: '0 0 15px rgba(34, 197, 94, 0.8), 0 0 30px rgba(34, 197, 94, 0.4), 0 0 45px rgba(34, 197, 94, 0.2)',
        background: 'linear-gradient(135deg, #22c55e, #16a34a, #15803d)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      {displayedText ? displayedText : text}
      {i < text.length && (
        <span className="animate-pulse text-green-300 ml-1">|</span>
      )}
    </h1>
  );
};

interface TerminalProps {
  children: React.ReactNode;
  className?: string;
}

export const Terminal = ({ children, className }: TerminalProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={cn(
        "relative mx-auto w-full min-w-[280px] max-w-4xl rounded-xl border border-green-500/30 bg-black/80 backdrop-blur-md p-3 sm:p-4 md:p-6 shadow-2xl",
        "before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-green-500/10 before:to-emerald-500/5 before:backdrop-blur-sm",
        "after:absolute after:inset-0 after:rounded-xl after:shadow-[inset_0_1px_0_0_rgba(34,197,94,0.2)]",
        "hover:border-green-400/50 hover:shadow-green-500/20 hover:shadow-2xl transition-all duration-300",
        "matrix-glow",
        "xs:min-w-[320px] sm:min-w-[400px] md:min-w-[500px] lg:min-w-[600px] xl:min-w-[700px]",
        className
      )}
      style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,20,0,0.8) 50%, rgba(0,0,0,0.9) 100%)',
        boxShadow: '0 0 30px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(34, 197, 94, 0.2)',
      }}
    >
      <div className="relative z-10">
        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50 animate-pulse" ></div>
            <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <div className="text-xs sm:text-sm text-green-400/70 font-mono">
            <span className="hidden sm:inline">MATRIX_TERMINAL_v2.0</span>
            <span className="sm:hidden">MATRIX_v2.0</span>
          </div>
        </div>
        <div className="font-mono text-xs sm:text-sm md:text-base text-green-400 leading-relaxed tracking-wide">
          <div className="relative">
            <div className="absolute -inset-1 bg-green-500/5 rounded blur-sm "></div>
            <div className="relative ">
              {children}
            </div>
          </div>
        </div>
      </div>
      
      {/* Matrix-style scanning line */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-400/50 to-transparent animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-400/30 to-transparent animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      {/* Corner accents */}
      <div className="absolute top-1 left-1 sm:top-2 sm:left-2 w-3 h-3 sm:w-4 sm:h-4 border-l-2 border-t-2 border-green-500/50"></div>
      <div className="absolute top-1 right-1 sm:top-2 sm:right-2 w-3 h-3 sm:w-4 sm:h-4 border-r-2 border-t-2 border-green-500/50"></div>
      <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 w-3 h-3 sm:w-4 sm:h-4 border-l-2 border-b-2 border-green-500/50"></div>
      <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-3 h-3 sm:w-4 sm:h-4 border-r-2 border-b-2 border-green-500/50"></div>
    </motion.div>
  );
};

/* Add Matrix-style CSS animations and keyframes */
const matrixStyles = `
  @keyframes matrix-flicker {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  @keyframes matrix-scan {
    0% { transform: translateY(-100%); opacity: 0; }
    50% { opacity: 1; }
    100% { transform: translateY(100%); opacity: 0; }
  }
  
  @keyframes matrix-pulse {
    0%, 100% { 
      box-shadow: 0 0 5px rgba(34, 197, 94, 0.5), 
                  0 0 10px rgba(34, 197, 94, 0.3), 
                  0 0 15px rgba(34, 197, 94, 0.1);
    }
    50% { 
      box-shadow: 0 0 10px rgba(34, 197, 94, 0.8), 
                  0 0 20px rgba(34, 197, 94, 0.6), 
                  0 0 30px rgba(34, 197, 94, 0.4);
    }
  }
  
  .matrix-glow {
    animation: matrix-pulse 2s ease-in-out infinite;
  }
  
  .matrix-flicker {
    animation: matrix-flicker 3s ease-in-out infinite;
  }
  
  .matrix-scan-line {
    animation: matrix-scan 4s linear infinite;
  }
`;

// Inject styles into document head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = matrixStyles;
  document.head.appendChild(styleElement);
}