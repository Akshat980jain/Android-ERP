import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBackground } from '../../contexts/BackgroundContext';
import { useAuth } from '../../contexts/AuthContext';

export function ColorTransition() {
  const { variant, intensity, colorScheme } = useBackground();
  const { theme } = useAuth();
  const [currentScheme, setCurrentScheme] = useState(colorScheme);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (currentScheme !== colorScheme) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setCurrentScheme(colorScheme);
        setIsTransitioning(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [colorScheme, currentScheme]);

  // Color scheme mappings with theme-aware variations
  const getColorMappings = () => {
    const lightMappings = {
      blue: {
        primary: '#3B82F6',
        secondary: '#1D4ED8',
        accent: '#60A5FA',
        light: '#DBEAFE'
      },
      purple: {
        primary: '#8B5CF6',
        secondary: '#7C3AED',
        accent: '#A78BFA',
        light: '#EDE9FE'
      },
      green: {
        primary: '#10B981',
        secondary: '#059669',
        accent: '#34D399',
        light: '#D1FAE5'
      },
      sunset: {
        primary: '#F59E0B',
        secondary: '#D97706',
        accent: '#FBBF24',
        light: '#FEF3C7'
      },
      ocean: {
        primary: '#0EA5E9',
        secondary: '#0284C7',
        accent: '#38BDF8',
        light: '#E0F2FE'
      },
      forest: {
        primary: '#16A34A',
        secondary: '#15803D',
        accent: '#22C55E',
        light: '#DCFCE7'
      },
      dynamic: {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        accent: '#10B981',
        light: '#DBEAFE'
      },
      vibrant: {
        primary: '#FF6B6B',
        secondary: '#4ECDC4',
        accent: '#45B7D1',
        light: '#FFE5E5'
      },
      neon: {
        primary: '#00FF88',
        secondary: '#00D4FF',
        accent: '#FF00FF',
        light: '#E5FFF0'
      },
      pastel: {
        primary: '#FFB3BA',
        secondary: '#BAFFC9',
        accent: '#BAE1FF',
        light: '#FFF0F0'
      },
      warm: {
        primary: '#FF6B35',
        secondary: '#F7931E',
        accent: '#FFD23F',
        light: '#FFF0E5'
      },
      cool: {
        primary: '#4ECDC4',
        secondary: '#45B7D1',
        accent: '#96CEB4',
        light: '#E5F5F3'
      }
    };

    const darkMappings = {
      blue: {
        primary: '#1E40AF',
        secondary: '#1E3A8A',
        accent: '#3B82F6',
        light: '#1E293B'
      },
      purple: {
        primary: '#5B21B6',
        secondary: '#4C1D95',
        accent: '#8B5CF6',
        light: '#1F1F3A'
      },
      green: {
        primary: '#047857',
        secondary: '#065F46',
        accent: '#10B981',
        light: '#1B2F1B'
      },
      sunset: {
        primary: '#B45309',
        secondary: '#92400E',
        accent: '#F59E0B',
        light: '#3F2F1B'
      },
      ocean: {
        primary: '#0369A1',
        secondary: '#075985',
        accent: '#0EA5E9',
        light: '#1B2F3F'
      },
      forest: {
        primary: '#15803D',
        secondary: '#166534',
        accent: '#16A34A',
        light: '#1B2F1B'
      },
      dynamic: {
        primary: '#1E40AF',
        secondary: '#5B21B6',
        accent: '#047857',
        light: '#1E293B'
      },
      vibrant: {
        primary: '#DC2626',
        secondary: '#059669',
        accent: '#0284C7',
        light: '#1B2F1B'
      },
      neon: {
        primary: '#00CC6A',
        secondary: '#00A3CC',
        accent: '#CC00CC',
        light: '#1B2F1B'
      },
      pastel: {
        primary: '#CC8F95',
        secondary: '#95CC8F',
        accent: '#95B3CC',
        light: '#1B2F1B'
      },
      warm: {
        primary: '#CC552B',
        secondary: '#CC7516',
        accent: '#CCA82F',
        light: '#3F2F1B'
      },
      cool: {
        primary: '#3EA5A1',
        secondary: '#3792A1',
        accent: '#7AA592',
        light: '#1B2F3F'
      }
    };

    return theme === 'dark' ? darkMappings : lightMappings;
  };

  const colorMappings = getColorMappings();
  const colors = colorMappings[currentScheme as keyof typeof colorMappings] || colorMappings.dynamic;

  // Theme-aware opacity
  const getOpacity = (baseOpacity: number) => {
    return theme === 'dark' ? baseOpacity * 0.4 : baseOpacity;
  };

  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: getOpacity(0.1) }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Color overlay during transitions */}
          <div 
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 20% 80%, ${colors.primary}${Math.floor(getOpacity(0.2) * 100).toString(16).padStart(2, '0')}, transparent 50%),
                           radial-gradient(circle at 80% 20%, ${colors.secondary}${Math.floor(getOpacity(0.2) * 100).toString(16).padStart(2, '0')}, transparent 50%),
                           radial-gradient(circle at 50% 50%, ${colors.accent}${Math.floor(getOpacity(0.1) * 100).toString(16).padStart(2, '0')}, transparent 70%)`
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
