'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  char: string;
  color: string;
}

export default function MatrixParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  const matrixChars = ['0', '1', '{', '}', '(', ')', '[', ']', '<', '>', '/', '\\', '|', '-', '+', '=', ';', ':', '.', ',', '?', '!', '@', '#', '$', '%', '^', '&', '*'];
  const colors = ['#00ff00', '#00cc00', '#009900', '#00ff66', '#00ff33'];

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

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < 50; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: Math.random() * 20 + 10,
          opacity: Math.random() * 0.5 + 0.1,
          char: matrixChars[Math.floor(Math.random() * matrixChars.length)],
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    };

    initParticles();

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle, index) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges
        if (particle.x <= 0 || particle.x >= canvas.width) particle.vx *= -1;
        if (particle.y <= 0 || particle.y >= canvas.height) particle.vy *= -1;

        // Keep particles in bounds
        particle.x = Math.max(0, Math.min(canvas.width, particle.x));
        particle.y = Math.max(0, Math.min(canvas.height, particle.y));

        // Randomly change character
        if (Math.random() < 0.01) {
          particle.char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        }

        // Draw particle
        ctx.font = `${particle.size}px 'Courier New', monospace`;
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity;
        ctx.fillText(particle.char, particle.x, particle.y);
        ctx.globalAlpha = 1;

        // Add glow effect
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 10;
        ctx.fillText(particle.char, particle.x, particle.y);
        ctx.shadowBlur = 0;
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
      className="absolute inset-0 pointer-events-none opacity-30"
      style={{ zIndex: 1 }}
    />
  );
}