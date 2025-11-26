import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { cardVariants } from '../../utils/animations';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient';
  hover?: boolean;
}

export function Card({ children, className, padding = 'md', variant = 'default', hover = false }: CardProps) {
  return (
    <motion.div
      className={clsx(
        'rounded-xl border transition-all duration-300',
        {
          // Default variant
          'bg-white border-gray-200/60 shadow-sm': variant === 'default',
          // Elevated variant
          'bg-white border-gray-200/60 shadow-lg shadow-gray-200/50': variant === 'elevated',
          // Outlined variant
          'bg-white/50 border-gray-300/60 shadow-none backdrop-blur-sm': variant === 'outlined',
          // Gradient variant
          'bg-gradient-to-br from-white to-gray-50/50 border-gray-200/40 shadow-lg shadow-gray-200/30': variant === 'gradient',
        },
        className
      )}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover={hover ? "hover" : undefined}
      whileTap="tap"
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('px-6 py-4 border-b border-gray-100/60', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={clsx('text-lg font-semibold text-gray-900 tracking-tight', className)}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('px-6 py-4', className)}>
      {children}
    </div>
  );
}

// New premium stat card component
export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  className 
}: { 
  title: string; 
  value: string; 
  icon: React.ComponentType<{ className?: string }>; 
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}) {
  return (
    <Card className={clsx('overflow-hidden hover-glow', className)} hover>
      <div className="relative p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <motion.p 
              className="text-sm font-medium text-gray-600 mb-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {title}
            </motion.p>
            <motion.p 
              className="text-3xl font-bold text-gray-900 mb-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              {value}
            </motion.p>
            {trend && trendValue && (
              <motion.div 
                className={clsx(
                  'flex items-center text-sm font-medium',
                  trend === 'up' ? 'text-green-600' : 
                  trend === 'down' ? 'text-red-600' : 'text-gray-600'
                )}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                {trend === 'up' && <span className="mr-1">↗</span>}
                {trend === 'down' && <span className="mr-1">↘</span>}
                {trend === 'neutral' && <span className="mr-1">→</span>}
                {trendValue}
              </motion.div>
            )}
          </div>
          <motion.div 
            className="relative"
            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
              <Icon className="w-6 h-6 text-blue-600" />
            </div>
          </motion.div>
        </div>
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </Card>
  );
}