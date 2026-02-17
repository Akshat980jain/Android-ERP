import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Book,
  Calendar,
  FileText,
  GraduationCap,
  Home,
  Library,
  Settings,
  Users,
  CreditCard,
  Briefcase,
  Bell,
  Award,
  FileCheck,
  BarChart3,
  UserCheck,
  ChevronRight,
  Moon,
  Sun,
  LogOut,
  MessageCircle,
  Shield,
  Wifi,
  WifiOff,
  ChevronLeft,
  Bus,
  Building2,
  Palette,
  Layers
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/api';
import { useBackground } from '../../contexts/BackgroundContext';
import { clsx } from 'clsx';
import {
  sidebarItemVariants,
  staggerContainer,
  staggerItem,
  buttonVariants
} from '../../utils/animations';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
  theme?: 'light' | 'dark';
  onThemeChange?: (theme: 'light' | 'dark') => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number | string;
  badgeType?: 'default' | 'success' | 'warning' | 'error' | 'info';
  isNew?: boolean;
  children?: MenuItem[];
  accessCount?: number;
  category?: string;
  description?: string;
  isHidden?: boolean;
  permissions?: string[];
  color?: string;
  gradient?: boolean;
  priority?: 'high' | 'medium' | 'low';
  isExperimental?: boolean;
}

export function Sidebar({
  activeTab,
  onTabChange,
  collapsed = false,
  onCollapseChange,
  theme = 'light',
  onThemeChange
}: SidebarProps) {
  const { user, logout, theme: ctxTheme, toggleTheme } = useAuth();
  const { variant, intensity, colorScheme } = useBackground();
  const effectiveTheme = (theme as 'light' | 'dark') || ctxTheme;

  // Dynamic background color based on current theme and background context
  const getSidebarBackground = () => {
    const colorSchemes = {
      blue: 'from-blue-500/20 via-blue-400/15 to-blue-600/20',
      purple: 'from-purple-500/20 via-purple-400/15 to-purple-600/20',
      green: 'from-green-500/20 via-green-400/15 to-green-600/20',
      sunset: 'from-orange-500/20 via-yellow-400/15 to-red-500/20',
      ocean: 'from-cyan-500/20 via-blue-400/15 to-teal-500/20',
      forest: 'from-green-500/20 via-emerald-400/15 to-green-600/20',
      dynamic: 'from-blue-500/20 via-purple-400/15 to-green-500/20',
      vibrant: 'from-pink-500/20 via-purple-400/15 to-cyan-500/20',
      neon: 'from-green-400/20 via-cyan-400/15 to-pink-500/20',
      pastel: 'from-pink-300/20 via-blue-300/15 to-green-300/20',
      warm: 'from-orange-500/20 via-red-400/15 to-yellow-500/20',
      cool: 'from-cyan-500/20 via-blue-400/15 to-teal-500/20'
    };

    const gradientColors = colorSchemes[colorScheme] || colorSchemes.dynamic;

    if (effectiveTheme === 'dark') {
      return `bg-gradient-to-br ${gradientColors} bg-gray-900/95 bg-glass-dark`;
    } else {
      return `bg-gradient-to-br ${gradientColors} bg-white/95 bg-glass backdrop-blur-md`;
    }
  };

  const sidebarBgColor = getSidebarBackground();

  // Dynamic sidebar effects based on background context
  const sidebarEffects = {
    subtle: 'opacity-90 shadow-glow',
    medium: 'opacity-95 shadow-glow-purple',
    intense: 'opacity-100 shadow-glow-green'
  };

  const sidebarVariant = variant === 'floating-orbs' ? 'shadow-glow' :
    variant === 'gradient-mesh' ? 'shadow-glow-purple' :
      'shadow-glow-green';

  // Enhanced state management
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['main']);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [accessStats, setAccessStats] = useState<Record<string, { count: number }>>({});
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [animateItems, setAnimateItems] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState<string | null>(null);
  const [sidebarStats, setSidebarStats] = useState<Record<string, number>>({});

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedExpanded = localStorage.getItem('sidebar-expanded');
    const savedAccessStats = localStorage.getItem('sidebar-access-stats');

    if (savedExpanded) setExpandedCategories(JSON.parse(savedExpanded));
    if (savedAccessStats) setAccessStats(JSON.parse(savedAccessStats));
  }, []);

  // Fetch sidebar stats from backend
  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      try {
        const res = await apiClient.getSidebarStats();
        if (!cancelled && res.success && res.stats) {
          setSidebarStats(res.stats);
        }
      } catch (e) {
        console.error('Failed to fetch sidebar stats:', e);
      }
    };
    fetchStats();
    // Refresh every 60 seconds
    const interval = setInterval(fetchStats, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Enhanced menu items with modern design
  const getMenuItems = React.useCallback((): MenuItem[] => {
    const commonItems: MenuItem[] = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: Home,
        category: 'main',
        description: 'Overview and analytics',
        color: 'blue',
        gradient: true,
        priority: 'high'
      },
      {
        id: 'notifications',
        label: 'Notifications',
        icon: Bell,
        category: 'main',
        description: 'Stay updated with alerts',
        color: 'orange',
        badge: sidebarStats.unreadNotifications || undefined,
        badgeType: 'warning'
      },
      {
        id: 'background-showcase',
        label: 'Background Showcase',
        icon: Palette,
        category: 'main',
        description: 'Explore beautiful backgrounds',
        color: 'purple',
        gradient: true,
        priority: 'medium'
      },
    ];

    const getRoleSpecificItems = (): MenuItem[] => {
      switch (user?.role) {
        case 'student':
          return [
            {
              id: 'academic',
              label: 'Academic',
              icon: GraduationCap,
              category: 'academics',
              description: 'Courses, grades & progress',
              color: 'purple',
              gradient: true,
              priority: 'high',
            },
            {
              id: 'schedule',
              label: 'Schedule',
              icon: Calendar,
              category: 'academics',
              description: 'Class schedules',
              color: 'indigo'
            },
            {
              id: 'exams',
              label: 'Exams',
              icon: FileCheck,
              category: 'academics',
              description: 'View and take scheduled exams',
              color: 'red',
              priority: 'high'
            },
            {
              id: 'assignments',
              label: 'Assignments',
              icon: FileText,
              category: 'academics',
              description: 'Submit and track assignments',
              color: 'orange',
              priority: 'high',
              badge: sidebarStats.pendingAssignments || undefined,
              badgeType: 'info'
            },
            {
              id: 'finance',
              label: 'Finance',
              icon: CreditCard,
              category: 'services',
              description: 'Fee payments & receipts',
              color: 'green',
              priority: 'medium'
            },
            {
              id: 'library',
              label: 'Library',
              icon: Library,
              category: 'services',
              description: 'Books & digital resources',
              color: 'teal'
            },
            {
              id: 'placement',
              label: 'Placement',
              icon: Briefcase,
              category: 'career',
              isNew: true,
              description: 'Career opportunities',
              color: 'emerald',
              gradient: true,
              isExperimental: true
            },
            {
              id: 'services',
              label: 'Services',
              icon: FileCheck,
              category: 'services',
              description: 'Student support services',
              color: 'cyan'
            },
            {
              id: 'transport',
              label: 'Transport',
              icon: Bus,
              category: 'services',
              description: 'Routes & subscriptions',
              color: 'blue'
            },
            {
              id: 'leaves',
              label: 'Leaves',
              icon: FileText,
              category: 'services',
              description: 'Apply for leave',
              color: 'rose'
            },
            {
              id: 'my-section',
              label: 'My Section',
              icon: Layers,
              category: 'academics',
              description: 'Your assigned section & classmates',
              color: 'indigo'
            },
          ];

        case 'faculty':
          return [
            {
              id: 'courses',
              label: 'My Courses',
              icon: Book,
              category: 'teaching',
              description: 'Course management',
              color: 'blue',
              gradient: true,
              badge: sidebarStats.coursesCount || undefined,
              badgeType: 'info'
            },
            {
              id: 'exams',
              label: 'Exams',
              icon: FileCheck,
              category: 'teaching',
              description: 'Create and conduct exams',
              color: 'red'
            },
            {
              id: 'feedback',
              label: 'Feedback',
              icon: MessageCircle,
              category: 'management',
              description: 'Course feedback summary',
              color: 'purple'
            },
            {
              id: 'calendar',
              label: 'Calendar',
              icon: Calendar,
              category: 'management',
              description: 'Academic calendar',
              color: 'indigo'
            },
            {
              id: 'assignments',
              label: 'Assignments',
              icon: FileText,
              category: 'teaching',
              description: 'Create and grade assignments',
              color: 'orange',
              priority: 'high',
              badge: sidebarStats.activeAssignments || undefined,
              badgeType: 'success'
            },
            {
              id: 'attendance',
              label: 'Attendance',
              icon: UserCheck,
              category: 'teaching',
              description: 'Track student attendance',
              color: 'green'
            },
            {
              id: 'marks',
              label: 'Marks & Grades',
              icon: Award,
              category: 'teaching',
              description: 'Grade submissions',
              color: 'yellow',
              badge: sidebarStats.pendingMarksCount ? `${sidebarStats.pendingMarksCount} Pending` : undefined,
              badgeType: 'warning'
            },
            {
              id: 'students',
              label: 'Students',
              icon: Users,
              category: 'management',
              description: 'Student management',
              color: 'purple',
              badge: sidebarStats.studentsCount || undefined,
              badgeType: 'default'
            },
            {
              id: 'schedule',
              label: 'Schedule',
              icon: Calendar,
              category: 'management',
              description: 'Class schedules',
              color: 'indigo'
            },
            {
              id: 'leaves',
              label: 'Leaves',
              icon: FileText,
              category: 'management',
              description: 'Manage leave requests',
              color: 'rose'
            },
            {
              id: 'sections',
              label: 'Sections',
              icon: Layers,
              category: 'management',
              description: 'View sections & students',
              color: 'indigo'
            },
          ];

        case 'admin':
          return [
            {
              id: 'analytics',
              label: 'Analytics',
              icon: BarChart3,
              category: 'management',
              description: 'System insights',
              color: 'blue',
              gradient: true,
              priority: 'high',
              isExperimental: true
            },
            {
              id: 'users',
              label: 'Users',
              icon: Users,
              category: 'management',
              description: 'User management',
              color: 'purple',
              badge: sidebarStats.totalUsers || undefined,
              badgeType: 'info'
            },
            {
              id: 'request-approval',
              label: 'Approvals',
              icon: Shield,
              category: 'management',
              description: 'Review verification requests',
              color: 'green',
              badge: sidebarStats.pendingVerifications || undefined,
              badgeType: 'warning'
            },
            {
              id: 'courses',
              label: 'Courses',
              icon: Book,
              category: 'academics',
              description: 'Course administration',
              color: 'indigo',
              badge: sidebarStats.totalCourses || undefined,
              badgeType: 'info'
            },
            {
              id: 'finance',
              label: 'Finance',
              icon: CreditCard,
              category: 'financial',
              description: 'Financial oversight',
              color: 'green',
              gradient: true
            },
            {
              id: 'reports',
              label: 'Reports',
              icon: FileText,
              category: 'reports',
              description: 'System reports',
              color: 'gray'
            },
            {
              id: 'settings',
              label: 'Settings',
              icon: Settings,
              category: 'system',
              description: 'System configuration',
              color: 'slate',
              priority: 'medium'
            },
            {
              id: 'security',
              label: 'Security',
              icon: Shield,
              category: 'system',
              description: 'Security settings',
              color: 'red'
            },
            {
              id: 'hostel',
              label: 'Hostel',
              icon: Building2,
              category: 'management',
              description: 'Rooms & allocations',
              color: 'purple'
            },
            {
              id: 'transport',
              label: 'Transport',
              icon: Bus,
              category: 'management',
              description: 'Routes & GPS',
              color: 'blue'
            },
            {
              id: 'sections',
              label: 'Sections',
              icon: Layers,
              category: 'management',
              description: 'Semester & section management',
              color: 'indigo',
              gradient: true,
              priority: 'high'
            },
          ];

        default:
          return [];
      }
    };

    const profileItem: MenuItem = {
      id: 'profile',
      label: 'Profile',
      icon: Settings,
      category: 'system',
      description: 'Account & preferences',
      color: 'gray'
    };

    return [...commonItems, ...getRoleSpecificItems(), profileItem];
  }, [user, sidebarStats]);

  const menuItems = useMemo(() => {
    const items = getMenuItems();
    return items.map(item => ({
      ...item,
      accessCount: accessStats[item.id]?.count || 0
    }));
  }, [accessStats, getMenuItems]);

  // Enhanced filtering - now just returns all menu items
  // Gate items by role-based matrix (coarse-grained): hide modules not relevant to the user's role
  const filteredMenuItems = useMemo(() => {
    const role = user?.role;
    const allowed = new Set<string>([
      'dashboard', 'notifications', 'background-showcase', 'profile'
    ]);
    if (role === 'student') {
      ['academic', 'schedule', 'exams', 'assignments', 'finance', 'library', 'placement', 'services', 'transport'].forEach(id => allowed.add(id));
    } else if (role === 'faculty') {
      ['courses', 'exams', 'feedback', 'calendar', 'assignments', 'attendance', 'marks', 'students', 'schedule', 'sections'].forEach(id => allowed.add(id));
    } else if (role === 'admin') {
      ['analytics', 'users', 'request-approval', 'courses', 'finance', 'reports', 'settings', 'security', 'hostel', 'transport', 'sections'].forEach(id => allowed.add(id));
    }
    return menuItems.filter(mi => allowed.has(mi.id));
  }, [menuItems, user]);

  // Group items by category with enhanced sorting
  const groupedMenuItems = useMemo(() => {
    const grouped: Record<string, MenuItem[]> = {};

    filteredMenuItems.forEach(item => {
      const category = item.category || 'other';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(item);
    });

    // Enhanced sorting logic
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => {
        // Priority sorting
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority || 'low'];
        const bPriority = priorityOrder[b.priority || 'low'];

        if (aPriority !== bPriority) return bPriority - aPriority;
        if ((a.accessCount || 0) !== (b.accessCount || 0)) {
          return (b.accessCount || 0) - (a.accessCount || 0);
        }
        return a.label.localeCompare(b.label);
      });
    });

    return grouped;
  }, [filteredMenuItems]);

  // Handle tab change with enhanced analytics
  const handleTabChange = (tabId: string) => {
    const newStats = {
      ...accessStats,
      [tabId]: {
        count: (accessStats[tabId]?.count || 0) + 1
      }
    };
    setAccessStats(newStats);
    localStorage.setItem('sidebar-access-stats', JSON.stringify(newStats));

    // Animate item selection
    setAnimateItems(true);
    setTimeout(() => setAnimateItems(false), 300);

    onTabChange(tabId);
  };

  // Get color classes for items
  const getColorClasses = (item: MenuItem, isActive: boolean) => {
    const colorMap = {
      blue: isActive ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:shadow-md',
      purple: isActive ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25' : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:shadow-md',
      green: isActive ? 'bg-green-500 text-white shadow-lg shadow-green-500/25' : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 hover:shadow-md',
      yellow: isActive ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/25' : 'text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 hover:shadow-md',
      red: isActive ? 'bg-red-500 text-white shadow-lg shadow-red-500/25' : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:shadow-md',
      indigo: isActive ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:shadow-md',
      teal: isActive ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25' : 'text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-500/10 hover:shadow-md',
      orange: isActive ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:shadow-md',
      cyan: isActive ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25' : 'text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 hover:shadow-md',
      emerald: isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:shadow-md',
      slate: isActive ? 'bg-slate-500 text-white shadow-lg shadow-slate-500/25' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-500/10 hover:shadow-md',
      gray: isActive ? 'bg-gray-500 text-white shadow-lg shadow-gray-500/25' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-500/10 hover:shadow-md'
    };

    if (item.gradient && isActive) {
      const gradientMap = {
        blue: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25',
        purple: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25',
        green: 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25',
        emerald: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25'
      };
      return gradientMap[item.color as keyof typeof gradientMap] || gradientMap.blue;
    }

    return colorMap[item.color as keyof typeof colorMap] || (isActive ? 'bg-gray-500 text-white shadow-lg shadow-gray-500/25' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-500/10 hover:shadow-md');
  };

  // Get badge classes
  const getBadgeClasses = (badgeType: string = 'default') => {
    const badgeMap = {
      default: 'bg-gray-100 dark:bg-gray-700/60 text-gray-800 dark:text-gray-200',
      success: 'bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-200',
      warning: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-200',
      error: 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-200',
      info: 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-200'
    };
    return badgeMap[badgeType as keyof typeof badgeMap] || badgeMap.default;
  };

  // Render enhanced menu item
  const renderMenuItem = (item: MenuItem, level = 0) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedCategories.includes(item.id);
    const isHovered = hoveredItem === item.id;

    return (
      <motion.div
        key={item.id}
        className="relative"
        variants={sidebarItemVariants}
        whileHover="hover"
        layout
      >
        <div
          className="relative group"
          onMouseEnter={() => setHoveredItem(item.id)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <motion.button
            onClick={() => hasChildren ? toggleCategory(item.id) : handleTabChange(item.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              setShowContextMenu(item.id);
            }}
            className={clsx(
              'w-full flex items-center text-left transition-all duration-200',
              'group relative hover:shadow-lg transform',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
              getColorClasses(item, isActive),
              {
                'shadow-lg scale-[1.02]': isActive,
                'ml-4': level > 0,
                'animate-pulse': animateItems && isActive,
                // Collapsed styles
                'px-3 py-3 rounded-xl justify-center': collapsed,
                'px-4 py-3 rounded-xl space-x-3': !collapsed,
              }
            )}
            title={collapsed ? item.label : undefined}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            animate={animateItems && isActive ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.3 }}
            layout
          >
            {/* Active indicator */}
            {isActive && !collapsed && (
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
            )}

            {collapsed ? (
              // Collapsed view - just icon
              <div className="relative flex items-center justify-center">
                <div className={clsx(
                  'p-2 rounded-lg transition-all duration-200',
                  {
                    'bg-white bg-opacity-20 shadow-lg': isActive,
                    'bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200/80 dark:hover:bg-gray-700/80': !isActive,
                    'scale-110 shadow-xl': isHovered,
                    'animate-pulse': animateItems && isActive
                  }
                )}>
                  <Icon className={clsx('w-5 h-5', {
                    'text-white': isActive,
                    [`text-${item.color}-600 dark:text-${item.color}-400`]: !isActive && item.color
                  })} />
                </div>

                {/* Badge for collapsed state */}
                {item.badge && (
                  <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-semibold">
                      {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                    </span>
                  </div>
                )}

                {/* Status indicators for collapsed state */}
                {item.isNew && !item.badge && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                )}
              </div>
            ) : (
              // Expanded view - full layout
              <div className="flex items-center space-x-3 flex-1">
                {/* Icon with enhanced styling */}
                <div className="relative">
                  <div className={clsx(
                    'p-2 rounded-lg transition-all duration-200',
                    {
                      'bg-white bg-opacity-20 shadow-lg': isActive,
                      'bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200/80 dark:hover:bg-gray-700/80': !isActive,
                      'scale-110 shadow-xl': isHovered,
                      'animate-pulse': animateItems && isActive
                    }
                  )}>
                    <Icon className={clsx('w-5 h-5', {
                      'text-white': isActive,
                      [`text-${item.color}-600 dark:text-${item.color}-400`]: !isActive && item.color
                    })} />
                  </div>

                  {/* Status indicators */}
                  {item.isNew && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  )}

                  {item.isExperimental && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center text-white text-xs">
                      Beta
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold truncate">{item.label}</span>
                    {item.isExperimental && (
                      <span className="text-xs bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded-full">
                        Beta
                      </span>
                    )}
                  </div>
                  {item.description && !isActive && (
                    <p className="text-xs opacity-70 truncate mt-0.5">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {/* Badge */}
                  {item.badge && (
                    <span className={clsx(
                      'px-2 py-1 text-xs font-semibold rounded-full',
                      getBadgeClasses(item.badgeType)
                    )}>
                      {item.badge}
                    </span>
                  )}

                  {/* Expand indicator */}
                  {hasChildren && (
                    <div className={clsx('transition-transform duration-200', {
                      'rotate-90': isExpanded
                    })}>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.button>

          {/* Tooltip for collapsed state */}
          {collapsed && isHovered && (
            <motion.div
              className="fixed left-20 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm z-50 pointer-events-none whitespace-nowrap"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {item.label}
              {item.badge && (
                <span className="ml-2 px-2 py-0.5 bg-blue-500 rounded-full text-xs">
                  {item.badge}
                </span>
              )}
            </motion.div>
          )}
        </div>

        {/* Children */}
        <AnimatePresence>
          {hasChildren && isExpanded && !collapsed && (
            <motion.div
              className="ml-6 mt-2 space-y-1 border-l-2 border-gray-200 dark:border-gray-800 pl-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {item.children!.map(child => renderMenuItem(child, level + 1))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Context menu */}
        <AnimatePresence>
          {showContextMenu === item.id && (
            <motion.div
              className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border z-50"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <div className="py-1">
                <button className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center space-x-2">
                  <span>Add to bookmarks</span>
                </button>
                <button className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center space-x-2">
                  <span>Hide from sidebar</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = () => setShowContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowContextMenu(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleCategory = (category: string) => {
    const newExpanded = expandedCategories.includes(category)
      ? expandedCategories.filter(cat => cat !== category)
      : [...expandedCategories, category];

    setExpandedCategories(newExpanded);
    localStorage.setItem('sidebar-expanded', JSON.stringify(newExpanded));
  };

  const getCategoryDisplayName = (category: string): string => {
    const categoryNames: Record<string, string> = {
      main: 'Main Navigation',
      academics: 'Academic Hub',
      teaching: 'Teaching Tools',
      services: 'Student Services',
      career: 'Career Center',
      management: 'Management',
      financial: 'Financial',
      reports: 'Reports & Analytics',
      system: 'System & Settings'
    };
    return categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <>
      {/* Responsive sidebar container */}
      <motion.div
        className={clsx(
          'h-full border-r border-gray-200 dark:border-gray-800 flex flex-col shadow-xl relative',
          'backdrop-blur-sm overflow-x-hidden',
          'md:static md:translate-x-0 fixed top-0 left-0 z-40',
          sidebarBgColor,
          sidebarEffects[intensity],
          sidebarVariant
        )}
        style={{ width: collapsed ? 80 : 320 }}
        initial={false}
        animate={{ width: collapsed ? 80 : 320 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        layout
      >
        {/* Enhanced Header - Fixed height */}
        <div className={`flex-shrink-0 p-6 border-b border-gray-200/50 dark:border-gray-700/50 relative overflow-hidden ${getSidebarBackground()}`}>
          {/* Dynamic gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/80 via-purple-600/80 to-blue-600/80 dark:from-blue-700/90 dark:via-purple-700/90 dark:to-blue-700/90" />

          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-lg animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-white/10 rounded-full blur-md animate-pulse" style={{ animationDelay: '2s' }} />
          </div>

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              {!collapsed && (
                <div>
                  <h1 className="text-xl font-bold">EduConnect</h1>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-blue-100 capitalize">{user?.role} Portal</p>
                    <div className="flex items-center space-x-1">
                      {isOnline ? (
                        <Wifi className="w-3 h-3 text-green-300" />
                      ) : (
                        <WifiOff className="w-3 h-3 text-red-300" />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {!collapsed && (
                <button
                  onClick={() => (onThemeChange ? onThemeChange(effectiveTheme === 'light' ? 'dark' : 'light') : toggleTheme())}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  title="Toggle theme"
                >
                  {effectiveTheme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </button>
              )}

              {/* Toggle button - always visible and prominent when collapsed */}
              <button
                onClick={() => onCollapseChange?.(!collapsed)}
                className={clsx(
                  'p-2 rounded-lg transition-all duration-200',
                  {
                    'hover:bg-white hover:bg-opacity-20': !collapsed,
                    // Make it more prominent when collapsed
                    'bg-white bg-opacity-20 hover:bg-opacity-30 shadow-lg': collapsed,
                  }
                )}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Floating Expand Button - Only shown when collapsed */}
        {collapsed && (
          <div className="absolute top-1/2 -right-4 z-50">
            <button
              onClick={() => onCollapseChange?.(false)}
              className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
              title="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        )}

        {/* Enhanced Navigation - Flexible height with proper scrolling */}
        <motion.nav
          className="flex-1 p-4 space-y-3 overflow-y-auto overflow-x-hidden custom-scrollbar min-h-0 text-gray-800 dark:text-gray-100 relative"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          layout
        >
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-current via-transparent to-current" />
          </div>

          {/* Grouped Menu Items */}
          <div className="relative z-10">
            {Object.entries(groupedMenuItems).map(([category, items], categoryIndex) => {
              const isExpanded = expandedCategories.includes(category);

              return (
                <motion.div
                  key={category}
                  className="space-y-2"
                  variants={staggerItem}
                  custom={categoryIndex}
                  layout
                >
                  {!collapsed && items.length > 0 && (
                    <motion.button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="bg-gradient-to-r from-gray-600 to-gray-800 dark:from-gray-300 dark:to-gray-100 bg-clip-text text-transparent">
                          {getCategoryDisplayName(category)}
                        </span>
                      </div>
                      <motion.div
                        className="transition-transform duration-200 text-gray-500 dark:text-gray-400"
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </motion.div>
                    </motion.button>
                  )}

                  <AnimatePresence>
                    {(collapsed || isExpanded) && (
                      <motion.div
                        className={clsx('space-y-2', {
                          'space-y-3': collapsed // More spacing when collapsed
                        })}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        layout
                      >
                        {items.map((item, itemIndex) => (
                          <motion.div
                            key={item.id}
                            variants={staggerItem}
                            custom={itemIndex}
                            initial="initial"
                            animate="animate"
                            layout
                          >
                            {renderMenuItem(item)}
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </motion.nav>

        {/* Enhanced Footer - Fixed height */}
        <div className={`flex-shrink-0 border-t border-gray-200/50 dark:border-gray-700/50 relative overflow-hidden overflow-x-hidden ${getSidebarBackground()}`}>
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-50/50 via-transparent to-transparent dark:from-gray-800/50" />

          {/* User Profile */}
          <div className={clsx('p-4 relative z-10', { 'px-2': collapsed })}>
            <div className={clsx('flex items-center space-x-3', {
              'justify-center': collapsed
            })}>
              {collapsed ? (
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate capitalize">
                      {user?.role} • {user?.department || 'General'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          {/* {!collapsed && (
            <div className="px-4 pb-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowQuickActions(!showQuickActions)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Quick Actions
                </button>
                <button
                  onClick={logout}
                  className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
                <button
                  className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Help & Support"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          )} */}

          {collapsed && (
            <div className="px-2 pb-2">
              <button
                onClick={logout}
                className="w-full p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4 mx-auto" />
              </button>
            </div>
          )}

          {/* Quick Actions Dropdown */}
          {/* {showQuickActions && !collapsed && (
            <div className="mx-4 mb-4 p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
              <div className="grid grid-cols-2 gap-2">
                <button className="p-2 text-xs text-gray-600 hover:bg-gray-50 rounded flex flex-col items-center space-y-1">
                  <Bell className="w-4 h-4" />
                  <span>Alerts</span>
                </button>
                <button className="p-2 text-xs text-gray-600 hover:bg-gray-50 rounded flex flex-col items-center space-y-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>Messages</span>
                </button>
                <button className="p-2 text-xs text-gray-600 hover:bg-gray-50 rounded flex flex-col items-center space-y-1">
                  <Calendar className="w-4 h-4" />
                  <span>Schedule</span>
                </button>
                <button className="p-2 text-xs text-gray-600 hover:bg-gray-50 rounded flex flex-col items-center space-y-1">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
              </div>
            </div>
          )} */}
        </div>

        {/* Resize handle for desktop */}
        <div className="absolute top-0 right-0 w-1 h-full hover:bg-blue-200 cursor-col-resize transition-colors hidden md:block" />
      </motion.div>

      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => onCollapseChange?.(true)}
        />
      )}

      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e0 transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e0;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #a0aec0;
        }
      `}</style>
    </>
  );
}