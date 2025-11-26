import React from 'react';
import { motion } from 'framer-motion';
import { useBackground } from '../../contexts/BackgroundContext';

interface DynamicShadowsProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'subtle' | 'medium' | 'intense';
}

export function DynamicShadows({ children, className = '', intensity = 'medium' }: DynamicShadowsProps) {
  const { variant, colorScheme } = useBackground();

  // Dynamic shadow colors based on background context
  const shadowColors = {
    blue: {
      subtle: 'shadow-blue-500/10',
      medium: 'shadow-blue-500/20',
      intense: 'shadow-blue-500/30'
    },
    purple: {
      subtle: 'shadow-purple-500/10',
      medium: 'shadow-purple-500/20',
      intense: 'shadow-purple-500/30'
    },
    green: {
      subtle: 'shadow-green-500/10',
      medium: 'shadow-green-500/20',
      intense: 'shadow-green-500/30'
    },
    sunset: {
      subtle: 'shadow-orange-500/10',
      medium: 'shadow-orange-500/20',
      intense: 'shadow-orange-500/30'
    },
    ocean: {
      subtle: 'shadow-cyan-500/10',
      medium: 'shadow-cyan-500/20',
      intense: 'shadow-cyan-500/30'
    },
    forest: {
      subtle: 'shadow-emerald-500/10',
      medium: 'shadow-emerald-500/20',
      intense: 'shadow-emerald-500/30'
    },
    dynamic: {
      subtle: 'shadow-blue-500/10',
      medium: 'shadow-blue-500/20',
      intense: 'shadow-blue-500/30'
    }
  };

  // Dynamic glow effects based on variant
  const glowEffects = {
    'floating-orbs': 'hover:shadow-lg hover:shadow-blue-500/25',
    'gradient-mesh': 'hover:shadow-lg hover:shadow-purple-500/25',
    'particle-field': 'hover:shadow-lg hover:shadow-green-500/25',
    'wave-animation': 'hover:shadow-lg hover:shadow-cyan-500/25',
    'geometric-shapes': 'hover:shadow-lg hover:shadow-orange-500/25'
  };

  const currentShadow = shadowColors[colorScheme as keyof typeof shadowColors]?.[intensity] || shadowColors.dynamic[intensity];
  const currentGlow = glowEffects[variant] || glowEffects['floating-orbs'];

  return (
    <motion.div
      className={`${currentShadow} ${currentGlow} transition-all duration-300 ${className}`}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
    >
      {children}
    </motion.div>
  );
}
