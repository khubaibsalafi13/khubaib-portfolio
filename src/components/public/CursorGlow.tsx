import React, { useEffect, useState } from 'react';
import { settingsService } from '../../services/settingsService';

export const CursorGlow: React.FC = () => {
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: -500, y: -500 });
  const [visible, setVisible] = useState(false);
  const [isFinePointer, setIsFinePointer] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [glowSize, setGlowSize] = useState<'small' | 'medium' | 'large'>(() => {
    try {
      return settingsService.getSettings().cursorGlowSize || 'small';
    } catch {
      return 'small';
    }
  });

  // Listen to live setting changes
  useEffect(() => {
    const handleStorage = () => {
      try {
        const size = settingsService.getSettings().cursorGlowSize || 'small';
        setGlowSize(size);
      } catch {
        // ignore
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    // Check reduced motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(motionQuery.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    if (motionQuery.addEventListener) {
      motionQuery.addEventListener('change', handleMotionChange);
    } else {
      motionQuery.addListener(handleMotionChange);
    }

    // Check if user has a mouse / fine pointer device (disable on touch screens / mobile)
    const mediaQuery = window.matchMedia('(pointer: fine)');
    setIsFinePointer(mediaQuery.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsFinePointer(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }

    if (!mediaQuery.matches || motionQuery.matches) {
      return;
    }

    let animationFrameId: number;
    let targetX = -500;
    let targetY = -500;
    let currentX = -500;
    let currentY = -500;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!visible) setVisible(true);
    };

    const handleMouseLeave = () => {
      setVisible(false);
    };

    const handleMouseEnter = () => {
      setVisible(true);
    };

    // Smooth lerp movement loop with responsive tracking
    const animate = () => {
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;
      setPos({ x: Math.round(currentX), y: Math.round(currentY) });
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      cancelAnimationFrame(animationFrameId);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
      if (motionQuery.removeEventListener) {
        motionQuery.removeEventListener('change', handleMotionChange);
      } else {
        motionQuery.removeListener(handleMotionChange);
      }
    };
  }, [visible]);

  if (!isFinePointer || reducedMotion) {
    return null;
  }

  // Refined size calculations
  const sizeStyles = {
    small: {
      dimension: 'w-[160px] h-[160px]',
      blur: 'blur-[48px]',
    },
    medium: {
      dimension: 'w-[230px] h-[230px]',
      blur: 'blur-[64px]',
    },
    large: {
      dimension: 'w-[320px] h-[320px]',
      blur: 'blur-[84px]',
    },
  }[glowSize];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        className={`absolute ${sizeStyles.dimension} rounded-full ${sizeStyles.blur} transition-transform duration-75 ease-out -translate-x-1/2 -translate-y-1/2`}
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          backgroundColor: 'var(--accent)',
          opacity: 'var(--cursor-glow-opacity)',
        }}
      />
    </div>
  );
};
