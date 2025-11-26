import React from 'react';
import { motion } from 'framer-motion';

interface DynamicBackgroundProps {
  variant?: 'floating-orbs' | 'gradient-mesh' | 'particle-field' | 'wave-animation' | 'geometric-shapes';
  intensity?: 'subtle' | 'medium' | 'intense';
  colorScheme?: 'blue' | 'purple' | 'green' | 'sunset' | 'ocean' | 'forest' | 'dynamic' | 'vibrant' | 'neon' | 'pastel' | 'warm' | 'cool';
  className?: string;
  theme?: 'light' | 'dark';
}

export function DynamicBackground({ 
  variant = 'floating-orbs', 
  intensity = 'medium',
  colorScheme = 'dynamic',
  className = '',
  theme = 'light'
}: DynamicBackgroundProps) {
  // Color schemes with theme-aware variations
  const getColorSchemes = () => {
    const lightSchemes = {
      blue: ['#3B82F6', '#1D4ED8', '#60A5FA', '#93C5FD', '#DBEAFE'],
      purple: ['#8B5CF6', '#7C3AED', '#A78BFA', '#C4B5FD', '#EDE9FE'],
      green: ['#10B981', '#059669', '#34D399', '#6EE7B7', '#D1FAE5'],
      sunset: ['#F59E0B', '#D97706', '#FBBF24', '#FCD34D', '#FEF3C7'],
      ocean: ['#0EA5E9', '#0284C7', '#38BDF8', '#7DD3FC', '#E0F2FE'],
      forest: ['#16A34A', '#15803D', '#22C55E', '#4ADE80', '#DCFCE7'],
      dynamic: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#06B6D4'],
      vibrant: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'],
      neon: ['#00FF88', '#00D4FF', '#FF00FF', '#FFFF00', '#FF0080', '#00FFFF', '#FF8000'],
      pastel: ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFB3F7', '#B3F7FF', '#F7B3FF'],
      warm: ['#FF6B35', '#F7931E', '#FFD23F', '#FFE066', '#FF6B6B', '#FF8E8E', '#FFB3B3'],
      cool: ['#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#A8E6CF']
    };

    const darkSchemes = {
      blue: ['#1E40AF', '#1E3A8A', '#3B82F6', '#60A5FA', '#1E293B'],
      purple: ['#5B21B6', '#4C1D95', '#8B5CF6', '#A78BFA', '#1F1F3A'],
      green: ['#047857', '#065F46', '#10B981', '#34D399', '#1B2F1B'],
      sunset: ['#B45309', '#92400E', '#F59E0B', '#FBBF24', '#3F2F1B'],
      ocean: ['#0369A1', '#075985', '#0EA5E9', '#38BDF8', '#1B2F3F'],
      forest: ['#15803D', '#166534', '#16A34A', '#22C55E', '#1B2F1B'],
      dynamic: ['#1E40AF', '#5B21B6', '#047857', '#B45309', '#DC2626', '#BE185D', '#5B21B6', '#0891B2'],
      vibrant: ['#DC2626', '#059669', '#0284C7', '#16A34A', '#F59E0B', '#8B5CF6', '#0EA5E9'],
      neon: ['#00CC6A', '#00A3CC', '#CC00CC', '#CCCC00', '#CC0066', '#00CCCC', '#CC6600'],
      pastel: ['#CC8F95', '#95CC8F', '#95B3CC', '#CCCC95', '#CC8FCC', '#8FCCCC', '#CC8FCC'],
      warm: ['#CC552B', '#CC7516', '#CCA82F', '#CCB366', '#CC552B', '#CC7272', '#CC9999'],
      cool: ['#3EA5A1', '#3792A1', '#7AA592', '#CCBEA7', '#B18FA1', '#7AA592', '#8BCFA8']
    };

    return theme === 'dark' ? darkSchemes : lightSchemes;
  };

  const colorSchemes = getColorSchemes();
  const colors = colorSchemes[colorScheme] || colorSchemes.dynamic;

  // Theme-aware opacity adjustments
  const getOpacity = (baseOpacity: number) => {
    return theme === 'dark' ? baseOpacity * 0.6 : baseOpacity;
  };

  // Floating Orbs Effect
  const FloatingOrbs = () => {
    const orbCount = intensity === 'intense' ? 20 : intensity === 'medium' ? 15 : 8;
    
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: orbCount }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-sm"
            style={{
              background: `radial-gradient(circle, ${colors[i % colors.length]}${Math.floor(getOpacity(0.6) * 100)}0, ${colors[i % colors.length]}${Math.floor(getOpacity(0.2) * 100)}0, transparent)`,
              width: `${Math.random() * 300 + 150}px`,
              height: `${Math.random() * 300 + 150}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 300 - 150, 0],
              y: [0, Math.random() * 300 - 150, 0],
              scale: [1, 1.3, 1],
              opacity: [getOpacity(0.2), getOpacity(0.5), getOpacity(0.2)],
            }}
            transition={{
              duration: Math.random() * 15 + 15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 8,
            }}
          />
        ))}
        
        {/* Additional smaller orbs for depth */}
        {Array.from({ length: Math.floor(orbCount / 2) }).map((_, i) => (
          <motion.div
            key={`small-${i}`}
            className="absolute rounded-full blur-sm"
            style={{
              background: `radial-gradient(circle, ${colors[i % colors.length]}${Math.floor(getOpacity(0.4) * 100)}0, transparent)`,
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 200 - 100, 0],
              y: [0, Math.random() * 200 - 100, 0],
              scale: [1, 1.5, 1],
              opacity: [getOpacity(0.1), getOpacity(0.3), getOpacity(0.1)],
            }}
            transition={{
              duration: Math.random() * 12 + 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 6,
            }}
          />
        ))}
      </div>
    );
  };

  // Gradient Mesh Effect
  const GradientMesh = () => {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute inset-0"
          style={{
            background: `conic-gradient(from 0deg at 50% 50%, ${colors.join(', ')})`,
            filter: 'blur(120px)',
            opacity: getOpacity(0.4),
          }}
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 30% 20%, ${colors[0]}${Math.floor(getOpacity(0.6) * 100)}0, transparent 60%),
                         radial-gradient(circle at 70% 80%, ${colors[1]}${Math.floor(getOpacity(0.6) * 100)}0, transparent 60%),
                         radial-gradient(circle at 20% 80%, ${colors[2]}${Math.floor(getOpacity(0.6) * 100)}0, transparent 60%),
                         radial-gradient(circle at 80% 30%, ${colors[3] || colors[0]}${Math.floor(getOpacity(0.6) * 100)}0, transparent 60%)`,
            opacity: getOpacity(0.3),
          }}
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Additional floating elements */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 10% 10%, ${colors[4] || colors[0]}${Math.floor(getOpacity(0.4) * 100)}0, transparent 40%),
                         radial-gradient(circle at 90% 90%, ${colors[5] || colors[1]}${Math.floor(getOpacity(0.4) * 100)}0, transparent 40%)`,
            opacity: getOpacity(0.2),
          }}
          animate={{
            scale: [1, 0.8, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    );
  };

  // Particle Field Effect
  const ParticleField = () => {
    const particleCount = intensity === 'intense' ? 150 : intensity === 'medium' ? 100 : 50;
    
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: particleCount }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              backgroundColor: colors[i % colors.length],
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              boxShadow: `0 0 ${Math.random() * 8 + 4}px ${colors[i % colors.length]}`,
            }}
            animate={{
              y: [0, -150, 0],
              opacity: [0, getOpacity(1), 0],
              scale: [0, 1, 0],
              x: [0, Math.random() * 100 - 50, 0],
            }}
            transition={{
              duration: Math.random() * 4 + 3,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 3,
            }}
          />
        ))}
        
        {/* Larger particles for depth */}
        {Array.from({ length: Math.floor(particleCount / 3) }).map((_, i) => (
          <motion.div
            key={`large-${i}`}
            className="absolute rounded-full"
            style={{
              backgroundColor: colors[i % colors.length],
              width: `${Math.random() * 8 + 4}px`,
              height: `${Math.random() * 8 + 4}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              boxShadow: `0 0 ${Math.random() * 12 + 8}px ${colors[i % colors.length]}`,
            }}
            animate={{
              y: [0, -200, 0],
              opacity: [0, getOpacity(0.8), 0],
              scale: [0, 1.2, 0],
              x: [0, Math.random() * 80 - 40, 0],
            }}
            transition={{
              duration: Math.random() * 6 + 4,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 4,
            }}
          />
        ))}
      </div>
    );
  };

  // Wave Animation Effect
  const WaveAnimation = () => {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg className="absolute bottom-0 w-full h-32" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <motion.path
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            fill={colors[0] + Math.floor(getOpacity(0.2) * 100).toString(16).padStart(2, '0')}
            animate={{
              d: [
                "M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z",
                "M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.46,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z",
                "M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z",
              ],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </svg>
        <svg className="absolute bottom-0 w-full h-24" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <motion.path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            fill={colors[1] + Math.floor(getOpacity(0.15) * 100).toString(16).padStart(2, '0')}
            animate={{
              d: [
                "M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z",
                "M0,0V7.23C0,65.52,0,167.83,0,211.77,0,233.76,0,245.88,0,248.5c0,1.9,0,3.79,0,5.69,0,8.14,0,16.29,0,24.43,0,8.14,0,16.29,0,24.43,0,1.9,0,3.79,0,5.69,0,2.62,0,14.74,0,36.73,0,43.94,0,146.25,0,204.54V0Z",
                "M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z",
              ],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
        </svg>
      </div>
    );
  };

  // Geometric Shapes Effect
  const GeometricShapes = () => {
    const shapeCount = intensity === 'intense' ? 12 : intensity === 'medium' ? 8 : 5;
    
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: shapeCount }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 200 + 100}px`,
              height: `${Math.random() * 200 + 100}px`,
              background: `linear-gradient(45deg, ${colors[i % colors.length]}${Math.floor(getOpacity(0.6) * 100)}0, ${colors[(i + 1) % colors.length]}${Math.floor(getOpacity(0.6) * 100)}0)`,
              borderRadius: i % 2 === 0 ? '50%' : i % 3 === 0 ? '0%' : '25%',
              filter: 'blur(1px)',
              opacity: getOpacity(0.15),
            }}
            animate={{
              rotate: [0, 360],
              scale: [1, 1.3, 1],
              opacity: [getOpacity(0.15), getOpacity(0.25), getOpacity(0.15)],
              x: [0, Math.random() * 50 - 25, 0],
              y: [0, Math.random() * 50 - 25, 0],
            }}
            transition={{
              duration: Math.random() * 15 + 15,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 8,
            }}
          />
        ))}
        
        {/* Additional smaller shapes */}
        {Array.from({ length: Math.floor(shapeCount / 2) }).map((_, i) => (
          <motion.div
            key={`small-${i}`}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              background: `linear-gradient(135deg, ${colors[i % colors.length]}${Math.floor(getOpacity(0.4) * 100)}0, ${colors[(i + 2) % colors.length]}${Math.floor(getOpacity(0.4) * 100)}0)`,
              borderRadius: i % 4 === 0 ? '50%' : i % 4 === 1 ? '0%' : i % 4 === 2 ? '25%' : '10%',
              filter: 'blur(0.5px)',
              opacity: getOpacity(0.2),
            }}
            animate={{
              rotate: [0, -360],
              scale: [1, 0.8, 1],
              opacity: [getOpacity(0.2), getOpacity(0.3), getOpacity(0.2)],
            }}
            transition={{
              duration: Math.random() * 12 + 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 6,
            }}
          />
        ))}
      </div>
    );
  };

  // Render the selected effect
  const renderEffect = () => {
    switch (variant) {
      case 'floating-orbs':
        return <FloatingOrbs />;
      case 'gradient-mesh':
        return <GradientMesh />;
      case 'particle-field':
        return <ParticleField />;
      case 'wave-animation':
        return <WaveAnimation />;
      case 'geometric-shapes':
        return <GeometricShapes />;
      default:
        return <FloatingOrbs />;
    }
  };

  return (
    <div className={`absolute inset-0 -z-10 ${className}`}>
      {renderEffect()}
    </div>
  );
}
