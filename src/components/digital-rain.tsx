'use client';

import React, { useEffect, useRef } from 'react';

interface RainDrop {
  x: number;
  y: number;
  speed: number;
  chars: string[];
  opacity: number;
}

export default function DigitalRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropsRef = useRef<RainDrop[]>([]);
  const animationRef = useRef<number>();

  const matrixChars = [
    'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    '{', '}', '(', ')', '[', ']', '<', '>', '/', '\\', '|', '-', '+', '=', ';', ':', '.', ',', '?', '!', '@', '#', '$', '%', '^', '&', '*'
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);

    // Initialize rain drops
    const initRain = () => {
      dropsRef.current = [];
      for (let i = 0; i < columns; i++) {
        dropsRef.current.push({
          x: i * fontSize,
          y: Math.random() * canvas.height,
          speed: Math.random() * 3 + 1,
          chars: Array.from({ length: 20 }, () => 
            matrixChars[Math.floor(Math.random() * matrixChars.length)]
          ),
          opacity: Math.random() * 0.8 + 0.2
        });
      }
    };

    initRain();

    const animate = () => {
      // Create trailing effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px 'Courier New', monospace`;

      dropsRef.current.forEach((drop, index) => {
        // Draw the rain drop characters
        drop.chars.forEach((char, charIndex) => {
          const y = drop.y - (charIndex * fontSize);
          
          if (y > 0 && y < canvas.height) {
            // Calculate opacity based on position in the trail
            const trailOpacity = drop.opacity * (1 - charIndex / drop.chars.length);
            
            // Brightest character at the front
            if (charIndex === 0) {
              ctx.fillStyle = `rgba(255, 255, 255, ${trailOpacity})`;
              ctx.shadowColor = '#00ff00';
              ctx.shadowBlur = 15;
            } else {
              ctx.fillStyle = `rgba(0, 255, 0, ${trailOpacity})`;
              ctx.shadowBlur = 5;
            }
            
            ctx.fillText(char, drop.x, y);
          }
        });

        // Reset shadow
        ctx.shadowBlur = 0;

        // Update position
        drop.y += drop.speed;

        // Reset drop when it goes off screen
        if (drop.y > canvas.height + drop.chars.length * fontSize) {
          drop.y = -drop.chars.length * fontSize;
          drop.speed = Math.random() * 3 + 1;
          drop.opacity = Math.random() * 0.8 + 0.2;
          
          // Randomly change some characters
          if (Math.random() < 0.1) {
            drop.chars = drop.chars.map(() => 
              matrixChars[Math.floor(Math.random() * matrixChars.length)]
            );
          }
        }

        // Occasionally change characters while falling
        if (Math.random() < 0.005) {
          const randomIndex = Math.floor(Math.random() * drop.chars.length);
          drop.chars[randomIndex] = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}