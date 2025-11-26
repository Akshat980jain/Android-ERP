import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  BookOpen, 
  CreditCard, 
  Trophy, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Clock as ClockIcon,
  GraduationCap,
  Bell,
  Download,
  Eye
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '../ui/Card';
import { QuickActionButton } from '../ui/Button';
import { DataTable } from '../ui/DataTable';
import { ChartCard } from '../ui/ChartCard';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/api';
import { Marks, BookIssue } from '../../types';
import { Course } from '../../types';
import { 
  pageVariants, 
  pageTransition, 
  staggerContainer, 
  staggerItem, 
  cardVariants,
  fadeInUpVariants,
  chartVariants,
  buttonVariants
} from '../../utils/animations';
import { AnimatedLoading } from '../ui/AnimatedLoading';
import { RippleButton, TiltCard, FloatingParticles, ConfettiBurst } from '../ui/SpecialEffects';
import { Reveal } from '../ui/Reveal';
import { Toast } from '../ui/Toast';
import { useBackground } from '../../contexts/BackgroundContext';
import { DynamicBackground } from '../ui/DynamicBackground';
import { InteractiveParticles } from '../ui/InteractiveParticles';
import { DynamicShadows } from '../ui/DynamicShadows';

interface Assignment {
  _id: string;
  title: string;
  description: string;
  course: {
    _id: string;
    name: string;
    code: string;
  };
  startDate: string;
  dueDate: string;
  maxMarks: number;
  status: string;
  submissions?: Array<{
    student: {
      _id: string;
      name: string;
      studentId: string;
    };
    marks?: number;
    feedback?: string;
    status: string;
    submittedAt: string;
  }>;
}

interface StudentDashboardProps {
  onTabChange?: (tab: string) => void;
}

export function StudentDashboard({ onTabChange }: StudentDashboardProps) {
  const { user, token } = useAuth();
  const { variant, intensity, colorScheme } = useBackground();
  const [attendanceStats, setAttendanceStats] = useState<{ present: number; absent: number; percentage: number }>({ present: 0, absent: 0, percentage: 0 });
  const [marksData, setMarksData] = useState<{ subject: string; marks: number }[]>([]);
  const [cgpa, setCgpa] = useState<string>('N/A');
  const [libraryBooks, setLibraryBooks] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState<{ title: string; date: string; type: string }[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [navigating, setNavigating] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'student') return;
    async function fetchData() {
      setLoading(true);
      try {
        // Attendance (weighted: present = 100%, late = 50%, absent = 0%)
        const attendanceRes = await apiClient.getAttendance();
        let presentWeighted = 0, totalWeighted = 0;
        if (attendanceRes && typeof attendanceRes === 'object' && 'attendance' in attendanceRes && Array.isArray(attendanceRes.attendance)) {
          attendanceRes.attendance.forEach((rec: any) => {
            const weight = typeof rec.lectureCount === 'number' && rec.lectureCount > 0 ? rec.lectureCount : 1;
            totalWeighted += weight;
            if (rec.status === 'present') presentWeighted += weight;
            else if (rec.status === 'late') presentWeighted += 0.5 * weight;
          });
        }
        const percentage = totalWeighted > 0 ? Math.round((presentWeighted / totalWeighted) * 100) : 0;
        const absentWeighted = Math.max(0, totalWeighted - presentWeighted);
        setAttendanceStats({ present: Number(presentWeighted.toFixed(1)), absent: Number(absentWeighted.toFixed(1)), percentage });

        // Marks
        const marksRes = await apiClient.getMarks();
        if (marksRes && typeof marksRes === 'object' && 'marks' in marksRes && Array.isArray(marksRes.marks)) {
          const grouped: { [subject: string]: number[] } = {};
          marksRes.marks.forEach((m: Marks) => {
            if (!grouped[m.title]) grouped[m.title] = [];
            grouped[m.title].push(m.marksObtained);
          });
          const marksArr = Object.entries(grouped).map(([subject, arr]) => ({ subject, marks: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) }));
          setMarksData(marksArr);
          if (marksArr.length > 0) {
            const avg = marksArr.reduce((a, b) => a + b.marks, 0) / marksArr.length;
            setCgpa((avg / 10).toFixed(2));
          } else {
            setCgpa('N/A');
          }
        }

        // Library books
        const issuesRes = await apiClient.getBookIssues();
        if (issuesRes && typeof issuesRes === 'object' && 'issues' in issuesRes && Array.isArray(issuesRes.issues)) {
          setLibraryBooks(issuesRes.issues.filter((b: BookIssue) => b.status === 'issued').length);
        }

        // Upcoming events
        setUpcomingEvents([]);

        // Fetch enrolled courses
        try {
          const coursesRes = await apiClient.getMyCourses();
          if (coursesRes && typeof coursesRes === 'object' && 'courses' in coursesRes && Array.isArray(coursesRes.courses)) {
            setCourses(coursesRes.courses);
          } else {
            setCourses([]);
          }
        } catch {
          setCourses([]);
        }

        // Fetch assignments
        try {
          const assignmentsRes = await fetch('/api/assignments', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const assignmentsData = await assignmentsRes.json();
          if (assignmentsData.assignments) {
            setAssignments(assignmentsData.assignments);
          } else {
            setAssignments([]);
          }
        } catch {
          setAssignments([]);
        }
              } catch {
          // handle error
        }
      setLoading(false);
    }
    fetchData();
  }, [user, token]);

  const quickStats = [
    { 
      title: 'Overall Attendance', 
      value: loading ? '...' : (attendanceStats.percentage > 0 ? attendanceStats.percentage + '%' : 'N/A'), 
      icon: Clock, 
      trend: (attendanceStats.percentage > 75 ? 'up' : 'neutral') as const,
      trendValue: attendanceStats.percentage > 75 ? 'Good' : 'Needs improvement'
    },
    { 
      title: 'CGPA', 
      value: loading ? '...' : cgpa, 
      icon: Trophy, 
      trend: (cgpa !== 'N/A' && parseFloat(cgpa) > 7.5 ? 'up' : 'neutral') as const,
      trendValue: cgpa !== 'N/A' && parseFloat(cgpa) > 7.5 ? 'Excellent' : 'Keep going'
    },
    { 
      title: 'Active Assignments', 
      value: loading ? '...' : assignments.filter(a => {
        const now = new Date();
        const startDate = new Date(a.startDate);
        const dueDate = new Date(a.dueDate);
        return now >= startDate && now <= dueDate;
      }).length.toString(), 
      icon: FileText, 
      trend: 'neutral' as const,
      trendValue: 'Current'
    },
    { 
      title: 'Library Books', 
      value: loading ? '...' : libraryBooks.toString(), 
      icon: BookOpen, 
      trend: 'neutral' as const,
      trendValue: 'Issued'
    },
  ];

  const attendanceData = [
    { name: 'Present', value: attendanceStats.present, color: '#10B981' },
    { name: 'Absent', value: attendanceStats.absent, color: '#EF4444' },
  ];

  const getAssignmentStatus = (assignment: Assignment) => {
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    const startDate = new Date(assignment.startDate);
    
    const hasSubmitted = assignment.submissions?.some(sub => 
      sub.student._id === user?._id && sub.status === 'submitted'
    );
    
    if (hasSubmitted) {
      return { status: 'submitted', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50', label: 'Submitted' };
    }
    
    if (now < startDate) {
      return { status: 'not-started', icon: ClockIcon, color: 'text-gray-600', bgColor: 'bg-gray-50', label: 'Not Started' };
    }
    
    if (now > dueDate) {
      return { status: 'overdue', icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-50', label: 'Overdue' };
    }
    
    return { status: 'active', icon: ClockIcon, color: 'text-yellow-600', bgColor: 'bg-yellow-50', label: 'Active' };
  };

  const courseColumns = [
    { key: 'name', header: 'Course Name', width: '40' },
    { key: 'code', header: 'Course Code', width: '20' },
    { key: 'credits', header: 'Credits', width: '15' },
    { key: 'faculty', header: 'Faculty', width: '25' },
  ];

  const assignmentColumns = [
    { 
      key: 'title', 
      header: 'Assignment', 
      render: (value: string, item: Assignment) => (
        <div className="flex items-center space-x-3">
          <FileText className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-900">{value}</span>
        </div>
      )
    },
    { key: 'course.name', header: 'Course' },
    { 
      key: 'dueDate', 
      header: 'Due Date',
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    { 
      key: 'maxMarks', 
      header: 'Max Marks',
      render: (value: number) => (
        <span className="font-medium text-gray-900">{value}</span>
      )
    },
    { 
      key: 'status', 
      header: 'Status',
      render: (value: string, item: Assignment) => {
        const statusInfo = getAssignmentStatus(item);
        const StatusIcon = statusInfo.icon;
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color} ${statusInfo.bgColor}`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusInfo.label}
          </span>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (value: any, item: Assignment) => (
        <div className="flex items-center space-x-2">
          <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
            <Download className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const handleQuickAction = (action: string) => {
    console.log(`Quick action: ${action}`);
    // Navigate to the corresponding module
    if (onTabChange) {
      let moduleName = '';
      setNavigating(action);
      
      // Add a subtle page transition effect
      const dashboard = document.querySelector('[data-dashboard]');
      if (dashboard) {
        dashboard.classList.add('opacity-50', 'scale-95');
        setTimeout(() => {
          dashboard.classList.remove('opacity-50', 'scale-95');
        }, 300);
      }
      
      switch (action) {
        case 'assignments':
          onTabChange('assignments');
          moduleName = 'Assignments';
          break;
        case 'fees':
          onTabChange('finance');
          moduleName = 'Finance';
          break;
        case 'library':
          onTabChange('library');
          moduleName = 'Library';
          break;
        case 'placements':
          onTabChange('placement');
          moduleName = 'Placements';
          break;
        default:
          console.log(`Unknown action: ${action}`);
          setNavigating(null);
          return;
      }
      
      // Show success toast
      setToast({ message: `Navigating to ${moduleName} module...`, type: 'success' });
      
      // Auto-hide toast after 2 seconds and clear navigating state
      setTimeout(() => {
        setToast(null);
        setNavigating(null);
      }, 2000);
    }
  };

  if (loading) {
    return <AnimatedLoading type="wave" size="lg" text="Loading your dashboard..." />;
  }

  return (
    <motion.div 
      className="space-y-8 p-6 bg-gray-50/30 min-h-screen relative"
      variants={pageVariants}
      initial="initial"
      animate="in"
      exit="out"
      transition={pageTransition}
      data-dashboard
    >
      {/* Section-specific background effects */}
      <DynamicBackground variant="gradient-mesh" intensity="subtle" colorScheme="blue" className="absolute top-0 left-0 w-full h-64" />
      <DynamicBackground variant="particle-field" intensity="medium" colorScheme="purple" className="absolute top-64 left-0 w-full h-96" />
      <DynamicBackground variant="geometric-shapes" intensity="subtle" colorScheme="green" className="absolute bottom-0 left-0 w-full h-64" />
      
      <FloatingParticles count={25} />
      <ConfettiBurst trigger={confettiTrigger} />
      
      {/* Interactive floating particles */}
      <InteractiveParticles />
      {/* Welcome Header */}
      <Reveal>
      <motion.div 
        className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden"
        variants={fadeInUpVariants}
        initial="initial"
        animate="animate"
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-purple-400/30" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.3),transparent_50%),radial-gradient(circle_at_80%_20%,rgba(255,119,198,0.3),transparent_50%)]" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name || 'Student'}! 👋</h1>
            <p className="text-blue-100">Here's what's happening with your academic journey today.</p>
          </div>
          <motion.div 
            className="hidden md:block"
            variants={cardVariants}
            whileHover="hover"
          >
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <GraduationCap className="w-8 h-8" />
            </div>
          </motion.div>
        </div>
      </motion.div>
      </Reveal>

      {/* Quick Stats */}
      <Reveal>
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Background effect for stats */}
        <DynamicBackground variant="floating-orbs" intensity="subtle" colorScheme="green" className="absolute inset-0 rounded-2xl" />
        {quickStats.map((stat, index) => (
          <motion.div
            key={index}
            variants={staggerItem}
            custom={index}
          >
            <TiltCard>
              <StatCard
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                trend={stat.trend}
                trendValue={stat.trendValue}
              />
            </TiltCard>
          </motion.div>
        ))}
      </motion.div>
      </Reveal>

      {/* Charts Section */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Background effect for charts */}
        <DynamicBackground variant="particle-field" intensity="subtle" colorScheme="ocean" className="absolute inset-0 rounded-2xl" />
        <motion.div
          variants={staggerItem}
          custom={0}
        >
          <ChartCard 
            title="Attendance Overview" 
            subtitle="Your attendance performance this semester"
            variant="elevated"
          >
            <motion.div 
              className="relative h-64 p-6"
              variants={chartVariants}
              initial="initial"
              animate="animate"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {attendanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 mb-1">
                    {loading ? '...' : `${attendanceStats.percentage}%`}
                  </div>
                  <div className="text-sm text-gray-600">Attendance Rate</div>
                </div>
              </div>
            </motion.div>
          </ChartCard>
        </motion.div>

        <motion.div
          variants={staggerItem}
          custom={1}
        >
          <ChartCard 
            title="Academic Performance" 
            subtitle="Your marks across subjects"
            variant="elevated"
          >
            <motion.div 
              className="h-64 p-6"
              variants={chartVariants}
              initial="initial"
              animate="animate"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marksData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="subject" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="marks" 
                    fill="url(#colorGradient)"
                    radius={[4, 4, 0, 0]}
                  />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </ChartCard>
        </motion.div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-4 gap-4 relative"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        role="region"
        aria-label="Quick Access Features"
      >
        {/* Background effect for feature cards */}
        <DynamicBackground variant="floating-orbs" intensity="medium" colorScheme="sunset" className="absolute inset-0 rounded-2xl" />
        <motion.div
          className="col-span-2 md:col-span-4 text-center mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Quick Access</h2>
          <p className="text-gray-600 text-sm">Access your most important features with one click</p>
        </motion.div>
        {[
          { icon: FileText, title: "Assignments", subtitle: "View & Submit", variant: "primary", action: "assignments", color: "blue" },
          { icon: CreditCard, title: "Pay Fees", subtitle: "Online Payment", variant: "success", action: "fees", color: "green" },
          { icon: BookOpen, title: "Library", subtitle: "Search & Issue", variant: "secondary", action: "library", color: "gray" },
          { icon: Trophy, title: "Placements", subtitle: "Job Opportunities", variant: "warning", action: "placements", color: "orange" }
        ].map((action, index) => (
                      <DynamicShadows intensity="medium" key={action.title}>
              <motion.div
                variants={staggerItem}
                custom={index}
                whileTap={{ scale: 0.95 }}
                className="group relative"
                whileHover={{
                  scale: 1.05,
                  y: -5,
                  transition: { type: "spring", stiffness: 300, damping: 20 }
                }}
              >
              <RippleButton 
                onClick={() => { 
                  handleQuickAction(action.action); 
                  setConfettiTrigger(prev => prev + 1);
                  // Add success feedback
                  const card = document.querySelector(`[data-action="${action.action}"]`);
                  if (card) {
                    card.classList.add('ring-4', 'ring-green-500/50');
                    setTimeout(() => {
                      card.classList.remove('ring-4', 'ring-green-500/50');
                    }, 1000);
                  }
                }} 
                className="w-full"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleQuickAction(action.action);
                    setConfettiTrigger(prev => prev + 1);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Navigate to ${action.title} module`}
                data-action={action.action}
              >
                <QuickActionButton
                  icon={action.icon}
                  title={action.title}
                  subtitle={navigating === action.action ? 'Loading...' : action.subtitle}
                  variant={action.variant as any}
                  onClick={() => {}}
                  className="group-hover:shadow-xl group-hover:shadow-blue-500/20 transition-all duration-300 relative z-10 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                />
              </RippleButton>
              {/* Subtle glow effect on hover */}
              <motion.div
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
                initial={false}
                animate={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
              />
              {/* Active indicator */}
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={false}
                animate={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
              />
              {/* Loading indicator */}
              {navigating === action.action && (
                <motion.div
                  className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center z-20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>
              )}
              </motion.div>
            </DynamicShadows>
        ))}
      </motion.div>

      {/* Recent Assignments */}
      <motion.div 
        className="space-y-4 relative"
        variants={fadeInUpVariants}
        initial="initial"
        animate="animate"
      >
        {/* Background effect for assignments */}
        <DynamicBackground variant="wave-animation" intensity="subtle" colorScheme="ocean" className="absolute inset-0 rounded-xl" />
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Recent Assignments</h2>
          </div>
          <motion.button 
            className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline flex items-center space-x-1 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onTabChange && onTabChange('assignments')}
          >
            <span>View All</span>
            <motion.span 
              className="group-hover:translate-x-1 transition-transform duration-200"
            >
              →
            </motion.span>
          </motion.button>
        </div>
        <DataTable
          data={assignments.slice(0, 5)}
          columns={assignmentColumns}
          searchable={false}
          pagination={false}
          className="shadow-sm hover:shadow-md transition-shadow duration-300"
          onRowClick={(assignment) => onTabChange && onTabChange('assignments')}
        />
      </motion.div>

      {/* Enrolled Courses */}
      <motion.div 
        className="space-y-4 relative"
        variants={fadeInUpVariants}
        initial="initial"
        animate="animate"
      >
        {/* Background effect for courses */}
        <DynamicBackground variant="geometric-shapes" intensity="subtle" colorScheme="forest" className="absolute inset-0 rounded-xl" />
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Enrolled Courses</h2>
          </div>
          <motion.button 
            className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline flex items-center space-x-1 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onTabChange && onTabChange('academic')}
          >
            <span>View All</span>
            <motion.span 
              className="group-hover:translate-x-1 transition-transform duration-200"
            >
              →
            </motion.span>
          </motion.button>
        </div>
        <DataTable
          data={courses}
          columns={courseColumns}
          searchable={true}
          pagination={true}
          itemsPerPage={5}
          className="shadow-sm hover:shadow-md transition-shadow duration-300"
          onRowClick={(course) => onTabChange && onTabChange('academic')}
        />
      </motion.div>

      {/* Upcoming Events */}
      <motion.div
        variants={fadeInUpVariants}
        initial="initial"
        animate="animate"
        className="relative"
      >
        {/* Background effect for events */}
        <DynamicBackground variant="gradient-mesh" intensity="subtle" colorScheme="purple" className="absolute inset-0 rounded-2xl" />
        <Card variant="gradient" className="bg-gradient-to-r from-purple-50 to-blue-50">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <motion.div 
                className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Calendar className="w-5 h-5 text-purple-600" />
              </motion.div>
              <div>
                <CardTitle className="text-purple-900">Upcoming Events</CardTitle>
                <p className="text-sm text-purple-700">Stay updated with important dates</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <motion.div 
                className="text-center py-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Calendar className="w-12 h-12 text-purple-300 mx-auto mb-3" />
                <p className="text-purple-600 font-medium">No upcoming events</p>
                <p className="text-purple-500 text-sm">Check back later for updates</p>
              </motion.div>
            ) : (
              <motion.div 
                className="space-y-3"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                {upcomingEvents.map((event, index) => (
                  <motion.div 
                    key={index} 
                    className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-purple-200/60"
                    variants={staggerItem}
                    custom={index}
                    whileHover={{ scale: 1.02, x: 5 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        event.type === 'exam' ? 'bg-red-500' : 
                        event.type === 'assignment' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      <div>
                        <p className="font-medium text-purple-900">{event.title}</p>
                        <p className="text-sm text-purple-700">{event.date}</p>
                      </div>
                    </div>
                    <Bell className="w-4 h-4 text-purple-400" />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      {/* Navigation Progress Indicator */}
      {navigating && (
        <motion.div
          className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 z-50"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  );
}