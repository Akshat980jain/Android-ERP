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

export function Card({ children, className, padding: _padding = 'md', variant = 'default', hover = false }: CardProps) {
  return (
    <motion.div
      className={clsx(
        'rounded-2xl border transition-all duration-300',
        {
          // Default
          'bg-white border-gray-200/60 shadow-sm dark:bg-gray-900/80 dark:border-gray-700/40 dark:shadow-gray-950/30': variant === 'default',
          // Elevated — glassmorphic
          'bg-white/70 backdrop-blur-xl border-gray-200/60 shadow-lg shadow-gray-200/50 dark:bg-gray-900/60 dark:backdrop-blur-xl dark:border-gray-700/40 dark:shadow-gray-950/40': variant === 'elevated',
          // Outlined
          'bg-white/50 border-gray-300/60 shadow-none backdrop-blur-sm dark:bg-gray-900/30 dark:border-gray-600/40': variant === 'outlined',
          // Gradient — glassmorphic
          'bg-gradient-to-br from-white/80 to-gray-50/60 backdrop-blur-xl border-gray-200/40 shadow-lg shadow-gray-200/30 dark:from-gray-900/70 dark:to-gray-800/50 dark:backdrop-blur-xl dark:border-gray-700/40 dark:shadow-gray-950/30': variant === 'gradient',
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
    <div className={clsx('px-6 py-4 border-b border-gray-100/60 dark:border-gray-700/40', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={clsx('text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight', className)}>
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

// Color glow map for StatCard hover effects
const glowMap: Record<string, string> = {
  blue: 'rgba(59,130,246,0.35)',
  green: 'rgba(16,185,129,0.35)',
  purple: 'rgba(139,92,246,0.35)',
  orange: 'rgba(249,115,22,0.35)',
  red: 'rgba(239,68,68,0.35)',
  cyan: 'rgba(6,182,212,0.35)',
  indigo: 'rgba(99,102,241,0.35)',
};

// Premium stat card component
export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color = 'blue',
  className
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: string;
  className?: string;
}) {
  const colorMap: Record<string, { iconBg: string; iconText: string; gradient: string }> = {
    blue: { iconBg: 'bg-blue-50 dark:bg-blue-500/15', iconText: 'text-blue-600 dark:text-blue-400', gradient: 'from-blue-500/10 to-transparent dark:from-blue-500/5' },
    green: { iconBg: 'bg-emerald-50 dark:bg-emerald-500/15', iconText: 'text-emerald-600 dark:text-emerald-400', gradient: 'from-emerald-500/10 to-transparent dark:from-emerald-500/5' },
    purple: { iconBg: 'bg-purple-50 dark:bg-purple-500/15', iconText: 'text-purple-600 dark:text-purple-400', gradient: 'from-purple-500/10 to-transparent dark:from-purple-500/5' },
    orange: { iconBg: 'bg-orange-50 dark:bg-orange-500/15', iconText: 'text-orange-600 dark:text-orange-400', gradient: 'from-orange-500/10 to-transparent dark:from-orange-500/5' },
    red: { iconBg: 'bg-red-50 dark:bg-red-500/15', iconText: 'text-red-600 dark:text-red-400', gradient: 'from-red-500/10 to-transparent dark:from-red-500/5' },
    cyan: { iconBg: 'bg-cyan-50 dark:bg-cyan-500/15', iconText: 'text-cyan-600 dark:text-cyan-400', gradient: 'from-cyan-500/10 to-transparent dark:from-cyan-500/5' },
    indigo: { iconBg: 'bg-indigo-50 dark:bg-indigo-500/15', iconText: 'text-indigo-600 dark:text-indigo-400', gradient: 'from-indigo-500/10 to-transparent dark:from-indigo-500/5' },
  };
  const colors = colorMap[color] || colorMap.blue;
  const glow = glowMap[color] || glowMap.blue;

  return (
    <Card className={clsx('overflow-hidden group', className)} hover variant="elevated">
      <div className="relative p-6">
        {/* Subtle gradient accent in top-right corner */}
        <div className={clsx('absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl opacity-60 rounded-bl-full pointer-events-none', colors.gradient)} />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex-1">
            <motion.p
              className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {title}
            </motion.p>
            <motion.p
              className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2"
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
                  trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' :
                    trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
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
            whileHover={{ scale: 1.15, rotate: 5 }}
          >
            <motion.div
              className={clsx('w-14 h-14 rounded-2xl flex items-center justify-center relative', colors.iconBg)}
              whileHover={{ boxShadow: `0 0 24px ${glow}` }}
              transition={{ duration: 0.3 }}
            >
              {/* Inner glass shine */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 to-transparent dark:from-white/10" />
              <Icon className={clsx('w-7 h-7 relative z-10', colors.iconText)} />
            </motion.div>
          </motion.div>
        </div>

        {/* Hover shimmer */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        />
      </div>
    </Card>
  );
}