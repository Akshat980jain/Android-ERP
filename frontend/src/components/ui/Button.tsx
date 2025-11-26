import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { buttonVariants } from '../../utils/animations';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  icon: Icon, 
  className, 
  children, 
  disabled, 
  ...props 
}: ButtonProps) {
  return (
    <motion.button
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        {
          // Primary variant
          'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/25 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:shadow-blue-600/30 focus:ring-blue-500': variant === 'primary',
          // Secondary variant
          'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg shadow-gray-600/25 hover:from-gray-700 hover:to-gray-800 hover:shadow-xl hover:shadow-gray-600/30 focus:ring-gray-500': variant === 'secondary',
          // Outline variant
          'border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:ring-gray-500': variant === 'outline',
          // Ghost variant
          'text-gray-700 bg-transparent hover:bg-gray-100 focus:ring-gray-500': variant === 'ghost',
          // Danger variant
          'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/25 hover:from-red-700 hover:to-red-800 hover:shadow-xl hover:shadow-red-600/30 focus:ring-red-500': variant === 'danger',
          // Success variant
          'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-600/25 hover:from-green-700 hover:to-green-800 hover:shadow-xl hover:shadow-green-600/30 focus:ring-green-500': variant === 'success',
        },
        {
          // Sizes
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-sm': size === 'md',
          'px-6 py-3 text-base': size === 'lg',
        },
        className,
        'hover-glow'
      )}
      disabled={disabled || loading}
      variants={buttonVariants}
      whileHover="hover"
      whileTap="tap"
      {...props}
    >
      {loading && (
        <motion.div 
          className="mr-2 w-4 h-4 border-2 border-current border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      )}
      {Icon && <Icon className={clsx('mr-2', size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5')} />}
      {children}
    </motion.button>
  );
}

// Quick action button for dashboard
export function QuickActionButton({ 
  icon: Icon, 
  title, 
  subtitle, 
  onClick, 
  variant = 'primary',
  className 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  title: string; 
  subtitle: string; 
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning';
  className?: string;
}) {
  const variantStyles = {
    primary: 'bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-200',
    secondary: 'bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-gray-200',
    success: 'bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-green-200',
    warning: 'bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 border-orange-200',
  };

  const iconColors = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-orange-600',
  };

  return (
    <motion.button
      onClick={onClick}
      className={clsx(
        'p-4 text-left rounded-xl border transition-all duration-300 group',
        variantStyles[variant],
        className
      )}
      variants={buttonVariants}
      whileHover="hover"
      whileTap="tap"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Icon className={clsx('w-6 h-6 mb-3', iconColors[variant])} />
      </motion.div>
      <motion.p 
        className="font-semibold text-gray-900 mb-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {title}
      </motion.p>
      <motion.p 
        className="text-sm text-gray-600"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {subtitle}
      </motion.p>
    </motion.button>
  );
}