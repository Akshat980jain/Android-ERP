import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export const RippleButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className = '', onClick, ...props }) => {
  const containerRef = useRef<HTMLButtonElement | null>(null);

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    const button = containerRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.className = 'ripple';

    button.appendChild(ripple);
    setTimeout(() => {
      ripple.remove();
    }, 700);

    onClick?.(e);
  };

  return (
    <button ref={containerRef} onClick={handleClick} className={`ripple-container ${className}`} {...props}>
      {children}
    </button>
  );
};

export const TiltCard: React.FC<{ className?: string; maxTiltDeg?: number; } & React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', maxTiltDeg = 8, ...props }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const percentX = (x - centerX) / centerX;
      const percentY = (y - centerY) / centerY;
      const rotateY = percentX * maxTiltDeg;
      const rotateX = -percentY * maxTiltDeg;
      el.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const handleLeave = () => {
      if (!el) return;
      el.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg)';
    };

    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);
    return () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', handleLeave);
    };
  }, [maxTiltDeg]);

  return (
    <div ref={ref} className={`transition-transform duration-150 will-change-transform ${className}`} {...props}>
      {children}
    </div>
  );
};

export const FloatingParticles: React.FC<{ count?: number; className?: string }> = ({ count = 20, className = '' }) => {
  const particles = Array.from({ length: count });
  return (
    <div className={`pointer-events-none fixed inset-0 overflow-hidden ${className}`} aria-hidden>
      {particles.map((_, i) => (
        <motion.span
          key={i}
          className="absolute w-1.5 h-1.5 bg-blue-500/30 rounded-full"
          initial={{ x: Math.random() * window.innerWidth, y: window.innerHeight + 20, opacity: 0 }}
          animate={{ y: -20, opacity: [0, 1, 0] }}
          transition={{ duration: 10 + Math.random() * 10, repeat: Infinity, delay: Math.random() * 5 }}
          style={{ left: Math.random() * 100 + '%', filter: 'blur(1px)' }}
        />
      ))}
    </div>
  );
};

export const ConfettiBurst: React.FC<{ trigger: any }> = ({ trigger }) => {
  // Lightweight confetti using DOM spans
  useEffect(() => {
    if (!trigger) return;
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.inset = '0';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';
    document.body.appendChild(container);

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const pieces = 120;
    for (let i = 0; i < pieces; i++) {
      const piece = document.createElement('span');
      piece.style.position = 'absolute';
      piece.style.width = '6px';
      piece.style.height = '10px';
      piece.style.background = colors[i % colors.length];
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.top = '0px';
      piece.style.opacity = '0.9';
      piece.style.transform = `translateY(0) rotate(${Math.random() * 360}deg)`;
      piece.style.borderRadius = '2px';
      container.appendChild(piece);

      const duration = 2000 + Math.random() * 2000;
      const translateY = window.innerHeight + Math.random() * 200;
      const translateX = (Math.random() - 0.5) * 200;

      piece.animate([
        { transform: piece.style.transform, opacity: 1 },
        { transform: `translate(${translateX}px, ${translateY}px) rotate(${Math.random() * 720}deg)`, opacity: 0.2 }
      ], { duration, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'forwards' });

      setTimeout(() => piece.remove(), duration + 100);
    }

    const timeout = setTimeout(() => container.remove(), 4500);
    return () => { clearTimeout(timeout); container.remove(); };
  }, [trigger]);

  return null;
};
