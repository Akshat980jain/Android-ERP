import React from 'react';
import { motion } from 'framer-motion';
import { pulseVariants, rotateVariants, waveVariants, floatVariants } from '../../utils/animations';

interface AnimatedLoadingProps {
  type?: 'spinner' | 'dots' | 'bars' | 'pulse' | 'float' | 'wave';
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  text?: string;
  className?: string;
}

export const AnimatedLoading: React.FC<AnimatedLoadingProps> = ({
  type = 'spinner',
  size = 'md',
  color = 'blue',
  text,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600',
    gray: 'text-gray-600',
  };

  const renderSpinner = () => (
    <motion.div
      className={`${sizeClasses[size]} ${colorClasses[color as keyof typeof colorClasses]} border-2 border-current border-t-transparent rounded-full`}
      variants={rotateVariants}
      initial="initial"
      animate="animate"
    />
  );

  const renderDots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'} ${colorClasses[color as keyof typeof colorClasses]} bg-current rounded-full`}
          variants={pulseVariants}
          initial="initial"
          animate="animate"
          transition={{
            delay: i * 0.2,
            duration: 0.6,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
      ))}
    </div>
  );

  const renderBars = () => (
    <div className="flex space-x-1">
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className={`${size === 'sm' ? 'w-1 h-4' : size === 'md' ? 'w-1.5 h-6' : 'w-2 h-8'} ${colorClasses[color as keyof typeof colorClasses]} bg-current rounded-full`}
          variants={waveVariants}
          initial="initial"
          animate="animate"
          transition={{
            delay: i * 0.1,
            duration: 0.6,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
      ))}
    </div>
  );

  const renderPulse = () => (
    <motion.div
      className={`${sizeClasses[size]} ${colorClasses[color as keyof typeof colorClasses]} bg-current rounded-full`}
      variants={pulseVariants}
      initial="initial"
      animate="animate"
    />
  );

  const renderFloat = () => (
    <motion.div
      className={`${sizeClasses[size]} ${colorClasses[color as keyof typeof colorClasses]} bg-current rounded-full`}
      variants={floatVariants}
      initial="initial"
      animate="animate"
    />
  );

  const renderWave = () => (
    <div className="flex space-x-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className={`${size === 'sm' ? 'w-1 h-3' : size === 'md' ? 'w-1 h-4' : 'w-1.5 h-6'} ${colorClasses[color as keyof typeof colorClasses]} bg-current rounded-full`}
          variants={waveVariants}
          initial="initial"
          animate="animate"
          transition={{
            delay: i * 0.1,
            duration: 0.6,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
      ))}
    </div>
  );

  const renderLoader = () => {
    switch (type) {
      case 'spinner':
        return renderSpinner();
      case 'dots':
        return renderDots();
      case 'bars':
        return renderBars();
      case 'pulse':
        return renderPulse();
      case 'float':
        return renderFloat();
      case 'wave':
        return renderWave();
      default:
        return renderSpinner();
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      {renderLoader()}
      {text && (
        <motion.p
          className="text-sm text-gray-600 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

// Page loading component
export const PageLoading: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <AnimatedLoading type="spinner" size="lg" text={text} />
  </div>
);

// Section loading component
export const SectionLoading: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <div className="py-12 flex items-center justify-center">
    <AnimatedLoading type="dots" size="md" text={text} />
  </div>
);

// Inline loading component
export const InlineLoading: React.FC<{ text?: string }> = ({ text }) => (
  <div className="inline-flex items-center space-x-2">
    <AnimatedLoading type="spinner" size="sm" />
    {text && <span className="text-sm text-gray-600">{text}</span>}
  </div>
);
