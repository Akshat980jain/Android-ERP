import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, LogOut, User, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBackground } from '../../contexts/BackgroundContext';
import { Button } from '../ui/Button';
import { fadeInVariants, buttonVariants, slideInRightVariants } from '../../utils/animations';

interface HeaderProps {
  onNotificationClick: () => void;
  unreadCount: number;
  onMenuClick?: () => void;
}

export function Header({ onNotificationClick, unreadCount, onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const { variant, intensity } = useBackground();
  
  // Dynamic header styling based on background context
  const headerBgColor = 'bg-glass backdrop-blur-md border-gray-200/50 dark:border-gray-700/50';

  return (
    <motion.header 
      className={`${headerBgColor} border-b px-4 sm:px-6 py-4 relative z-20`}
      variants={fadeInVariants}
      initial="initial"
      animate="animate"
    >
      {/* Enhanced header background with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/80 to-white/90 dark:from-gray-900/90 dark:via-gray-800/80 dark:to-gray-900/90 rounded-b-lg" />
      
      <div className="flex items-center justify-between relative z-10">
        <motion.div 
          className="flex items-center space-x-3 sm:space-x-4"
          variants={slideInRightVariants}
          initial="initial"
          animate="animate"
        >
          <motion.button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Open menu"
            onClick={onMenuClick}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <Menu className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          </motion.button>
          <motion.h2 
            className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            Welcome back, {user?.name}
          </motion.h2>
        </motion.div>

        <motion.div 
          className="flex items-center space-x-3 sm:space-x-4"
          variants={slideInRightVariants}
          initial="initial"
          animate="animate"
        >
          <motion.div 
            className="relative hidden sm:block"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <motion.input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg w-48 sm:w-64 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            />
          </motion.div>

          {/* Notification button only if unreadCount is available and > 0 */}
          <AnimatePresence>
            {typeof unreadCount === 'number' && unreadCount > 0 && (
              <motion.button 
                onClick={onNotificationClick}
                className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: 0.4 }}
              >
                <Bell className="w-5 h-5" />
                <motion.span 
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 500 }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Theme toggle moved to Sidebar */}

          <motion.div 
            className="flex items-center space-x-2 sm:space-x-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div 
              className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {user?.profile?.avatar ? (
                <img 
                  src={user.profile.avatar} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              )}
            </motion.div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
            </div>
          </motion.div>

          <motion.div
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <Button variant="ghost" onClick={logout} className="flex items-center space-x-2">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </motion.header>
  );
}