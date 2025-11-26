import React, { useState } from 'react';
import { motion, AnimatePresence } from 'react';
import { useBackground, BackgroundVariant, BackgroundIntensity, BackgroundColorScheme } from '../../contexts/BackgroundContext';
import { useAuth } from '../../contexts/AuthContext';
import { DynamicBackground } from './DynamicBackground';
import { Sparkles, Palette, Zap, Play, Pause, RotateCcw } from 'lucide-react';

export function BackgroundShowcase() {
  const { variant, intensity, colorScheme, setBackground, randomizeBackground, cycleBackground } = useBackground();
  const { theme } = useAuth();
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState<NodeJS.Timeout | null>(null);

  const variants: { value: BackgroundVariant; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: 'floating-orbs', label: 'Floating Orbs', icon: Sparkles },
    { value: 'gradient-mesh', label: 'Gradient Mesh', icon: Palette },
    { value: 'particle-field', label: 'Particle Field', icon: Zap },
    { value: 'wave-animation', label: 'Wave Animation', icon: Sparkles },
    { value: 'geometric-shapes', label: 'Geometric Shapes', icon: Palette },
  ];

  const intensities: { value: BackgroundIntensity; label: string; description: string }[] = [
    { value: 'subtle', label: 'Subtle', description: 'Light, gentle effects' },
    { value: 'medium', label: 'Medium', description: 'Balanced visibility' },
    { value: 'intense', label: 'Intense', description: 'Bold, prominent effects' },
  ];

  const colorSchemes: { value: BackgroundColorScheme; label: string; colors: string[] }[] = [
    { value: 'blue', label: 'Ocean Blue', colors: ['#3B82F6', '#1D4ED8', '#60A5FA'] },
    { value: 'purple', label: 'Royal Purple', colors: ['#8B5CF6', '#7C3AED', '#A78BFA'] },
    { value: 'green', label: 'Emerald Green', colors: ['#10B981', '#059669', '#34D399'] },
    { value: 'sunset', label: 'Warm Sunset', colors: ['#F59E0B', '#D97706', '#FBBF24'] },
    { value: 'ocean', label: 'Deep Ocean', colors: ['#0EA5E9', '#0284C7', '#38BDF8'] },
    { value: 'forest', label: 'Forest Green', colors: ['#16A34A', '#15803D', '#22C55E'] },
    { value: 'dynamic', label: 'Dynamic Mix', colors: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'] },
    { value: 'vibrant', label: 'Vibrant Colors', colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'] },
    { value: 'neon', label: 'Neon Glow', colors: ['#00FF88', '#00D4FF', '#FF00FF', '#FFFF00'] },
    { value: 'pastel', label: 'Soft Pastels', colors: ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA'] },
    { value: 'warm', label: 'Warm Tones', colors: ['#FF6B35', '#F7931E', '#FFD23F', '#FFE066'] },
    { value: 'cool', label: 'Cool Tones', colors: ['#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'] }
  ];

  const toggleAutoPlay = () => {
    if (isAutoPlaying) {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        setAutoPlayInterval(null);
      }
      setIsAutoPlaying(false);
    } else {
      const interval = setInterval(() => {
        cycleBackground();
      }, 3000);
      setAutoPlayInterval(interval);
      setIsAutoPlaying(true);
    }
  };

  const handleVariantChange = (newVariant: BackgroundVariant) => {
    setBackground(newVariant);
  };

  const handleIntensityChange = (newIntensity: BackgroundIntensity) => {
    setBackground(variant, newIntensity);
  };

  const handleColorSchemeChange = (newColorScheme: BackgroundColorScheme) => {
    setBackground(variant, intensity, newColorScheme);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic Background */}
      <DynamicBackground variant={variant} intensity={intensity} colorScheme={colorScheme} theme={theme} />
      
      {/* Content Overlay */}
      <div className="relative z-10 min-h-screen bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-12">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Background Showcase
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Explore the beautiful background effects and color schemes available in your ERP app
            </p>
          </motion.div>

          {/* Controls */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex flex-wrap gap-4 justify-center mb-6">
                <motion.button
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium flex items-center space-x-2 hover:scale-105 transition-transform"
                  onClick={randomizeBackground}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Random</span>
                </motion.button>
                
                <motion.button
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-medium flex items-center space-x-2 hover:scale-105 transition-transform"
                  onClick={toggleAutoPlay}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isAutoPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  <span>{isAutoPlaying ? 'Stop' : 'Auto Play'}</span>
                </motion.button>
                
                <motion.button
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg font-medium flex items-center space-x-2 hover:scale-105 transition-transform"
                  onClick={cycleBackground}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Next</span>
                </motion.button>
              </div>

              {/* Current Settings Display */}
              <div className="text-center text-white/90 mb-6">
                <p className="text-lg">
                  Current: <span className="font-semibold">{variant.replace('-', ' ')}</span> • 
                  <span className="font-semibold"> {intensity}</span> • 
                  <span className="font-semibold"> {colorScheme}</span>
                </p>
              </div>

              {/* Effects Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Variants */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                    <Sparkles className="w-5 h-5" />
                    <span>Effects</span>
                  </h3>
                  <div className="space-y-2">
                    {variants.map((effect) => (
                      <motion.button
                        key={effect.value}
                        onClick={() => handleVariantChange(effect.value)}
                        className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                          variant === effect.value
                            ? 'border-blue-400 bg-blue-500/20 text-blue-100'
                            : 'border-white/20 hover:border-white/40 hover:bg-white/10 text-white/80'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center space-x-3">
                          <effect.icon className="w-5 h-5" />
                          <span className="font-medium">{effect.label}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Intensities */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                    <Zap className="w-5 h-5" />
                    <span>Intensity</span>
                  </h3>
                  <div className="space-y-2">
                    {intensities.map((intensityOption) => (
                      <motion.button
                        key={intensityOption.value}
                        onClick={() => handleIntensityChange(intensityOption.value)}
                        className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                          intensity === intensityOption.value
                            ? 'border-green-400 bg-green-500/20 text-green-100'
                            : 'border-white/20 hover:border-white/40 hover:bg-white/10 text-white/80'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div>
                          <div className="font-medium">{intensityOption.label}</div>
                          <div className="text-sm opacity-80">{intensityOption.description}</div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Color Schemes */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                    <Palette className="w-5 h-5" />
                    <span>Colors</span>
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {colorSchemes.map((scheme) => (
                      <motion.button
                        key={scheme.value}
                        onClick={() => handleColorSchemeChange(scheme.value)}
                        className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                          colorScheme === scheme.value
                            ? 'border-purple-400 bg-purple-500/20 text-purple-100'
                            : 'border-white/20 hover:border-white/40 hover:bg-white/10 text-white/80'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{scheme.label}</span>
                          <div className="flex space-x-1">
                            {scheme.colors.map((color, index) => (
                              <div
                                key={index}
                                className="w-4 h-4 rounded-full border border-white/50 shadow-sm"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <motion.div
            className="text-center text-white/80 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <p className="text-lg">
              Use the floating background controls button (bottom right) to customize your experience anytime!
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

