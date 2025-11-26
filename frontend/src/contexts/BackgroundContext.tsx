import React, { createContext, useContext, useState, useEffect } from 'react';

export type BackgroundVariant = 'floating-orbs' | 'gradient-mesh' | 'particle-field' | 'wave-animation' | 'geometric-shapes';
export type BackgroundIntensity = 'subtle' | 'medium' | 'intense';
export type BackgroundColorScheme = 'blue' | 'purple' | 'green' | 'sunset' | 'ocean' | 'forest' | 'dynamic' | 'vibrant' | 'neon' | 'pastel' | 'warm' | 'cool';

interface BackgroundContextType {
  variant: BackgroundVariant;
  intensity: BackgroundIntensity;
  colorScheme: BackgroundColorScheme;
  setBackground: (variant: BackgroundVariant, intensity?: BackgroundIntensity, colorScheme?: BackgroundColorScheme) => void;
  randomizeBackground: () => void;
  cycleBackground: () => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
}

interface BackgroundProviderProps {
  children: React.ReactNode;
}

export function BackgroundProvider({ children }: BackgroundProviderProps) {
  const [variant, setVariant] = useState<BackgroundVariant>('floating-orbs');
  const [intensity, setIntensity] = useState<BackgroundIntensity>('medium');
  const [colorScheme, setColorScheme] = useState<BackgroundColorScheme>('dynamic');

  const variants: BackgroundVariant[] = ['floating-orbs', 'gradient-mesh', 'particle-field', 'wave-animation', 'geometric-shapes'];
  const intensities: BackgroundIntensity[] = ['subtle', 'medium', 'intense'];
  const colorSchemes: BackgroundColorScheme[] = ['blue', 'purple', 'green', 'sunset', 'ocean', 'forest', 'dynamic', 'vibrant', 'neon', 'pastel', 'warm', 'cool'];

  const setBackground = (newVariant: BackgroundVariant, newIntensity?: BackgroundIntensity, newColorScheme?: BackgroundColorScheme) => {
    setVariant(newVariant);
    if (newIntensity) setIntensity(newIntensity);
    if (newColorScheme) setColorScheme(newColorScheme);
  };

  const randomizeBackground = () => {
    const randomVariant = variants[Math.floor(Math.random() * variants.length)];
    const randomIntensity = intensities[Math.floor(Math.random() * intensities.length)];
    const randomColorScheme = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];
    
    setBackground(randomVariant, randomIntensity, randomColorScheme);
  };

  const cycleBackground = () => {
    const currentIndex = variants.indexOf(variant);
    const nextIndex = (currentIndex + 1) % variants.length;
    setVariant(variants[nextIndex]);
  };

  // Auto-cycle background every 30 seconds for dynamic feel
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance to change
        cycleBackground();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [variant]);

  // Auto-randomize color scheme every 45 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.8) { // 20% chance to change
        const randomColorScheme = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];
        setColorScheme(randomColorScheme);
      }
    }, 45000);

    return () => clearInterval(interval);
  }, [colorScheme]);

  const value: BackgroundContextType = {
    variant,
    intensity,
    colorScheme,
    setBackground,
    randomizeBackground,
    cycleBackground,
  };

  return (
    <BackgroundContext.Provider value={value}>
      {children}
    </BackgroundContext.Provider>
  );
}
