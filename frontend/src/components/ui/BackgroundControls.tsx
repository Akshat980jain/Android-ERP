import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Shuffle, RotateCcw, Settings, X, Sparkles, Waves, Circle, Square, Zap } from 'lucide-react';
import { useBackground, BackgroundVariant, BackgroundIntensity, BackgroundColorScheme } from '../../contexts/BackgroundContext';

interface BackgroundControlsProps {
  className?: string;
}

export function BackgroundControls({ className = '' }: BackgroundControlsProps) {
  const { variant, intensity, colorScheme, setBackground, randomizeBackground, cycleBackground } = useBackground();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'effects' | 'colors' | 'intensity'>('effects');

  const variants: { value: BackgroundVariant; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: 'floating-orbs', label: 'Floating Orbs', icon: Circle },
    { value: 'gradient-mesh', label: 'Gradient Mesh', icon: Sparkles },
    { value: 'particle-field', label: 'Particle Field', icon: Zap },
    { value: 'wave-animation', label: 'Wave Animation', icon: Waves },
    { value: 'geometric-shapes', label: 'Geometric Shapes', icon: Square },
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
    <>
      {/* Floating Action Button */}
      <motion.button
        className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg text-white z-50 flex items-center justify-center ${className}`}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1, rotate: 180 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="settings"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <Settings className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Controls Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-24 right-6 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 z-40 overflow-hidden"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <Palette className="w-5 h-5" />
                <span>Background Effects</span>
              </h3>
              <p className="text-blue-100 text-sm mt-1">Customize your visual experience</p>
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex space-x-2">
                <motion.button
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center space-x-2"
                  onClick={randomizeBackground}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Shuffle className="w-4 h-4" />
                  <span>Random</span>
                </motion.button>
                <motion.button
                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center space-x-2"
                  onClick={cycleBackground}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Next</span>
                </motion.button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              {[
                { id: 'effects', label: 'Effects', icon: Sparkles },
                { id: 'colors', label: 'Colors', icon: Palette },
                { id: 'intensity', label: 'Intensity', icon: Zap },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-4 max-h-96 overflow-y-auto">
              <AnimatePresence mode="wait">
                {activeTab === 'effects' && (
                  <motion.div
                    key="effects"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-3"
                  >
                    {variants.map((effect) => (
                      <motion.button
                        key={effect.value}
                        onClick={() => handleVariantChange(effect.value)}
                        className={`w-full p-3 rounded-lg border-2 transition-all ${
                          variant === effect.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center space-x-3">
                          <effect.icon className={`w-5 h-5 ${variant === effect.value ? 'text-blue-600' : 'text-gray-500'}`} />
                          <span className="font-medium">{effect.label}</span>
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'colors' && (
                  <motion.div
                    key="colors"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-3"
                  >
                    {colorSchemes.map((scheme) => (
                      <motion.button
                        key={scheme.value}
                        onClick={() => handleColorSchemeChange(scheme.value)}
                        className={`w-full p-3 rounded-lg border-2 transition-all ${
                          colorScheme === scheme.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
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
                                className="w-4 h-4 rounded-full border border-white shadow-sm"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'intensity' && (
                  <motion.div
                    key="intensity"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-3"
                  >
                    {intensities.map((intensityOption) => (
                      <motion.button
                        key={intensityOption.value}
                        onClick={() => handleIntensityChange(intensityOption.value)}
                        className={`w-full p-3 rounded-lg border-2 transition-all ${
                          intensity === intensityOption.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="text-left">
                          <div className="font-medium">{intensityOption.label}</div>
                          <div className="text-sm text-gray-500">{intensityOption.description}</div>
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
