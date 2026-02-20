import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { BackgroundProvider } from './contexts/BackgroundContext';
import { LoginForm } from './components/auth/LoginForm';
import EmailOtpPage from './components/auth/EmailOtpPage';
import MobileLanding from './components/auth/MobileLanding';
import MobileRegister from './components/auth/MobileRegister';
import MobileLogin from './components/auth/MobileLogin';
import MobileForgotPassword from './components/auth/MobileForgotPassword';
import MobileResetPassword from './components/auth/MobileResetPassword';
import ResetPasswordPage from './components/auth/ResetPasswordPage';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { FacultyDashboard } from './components/dashboard/FacultyDashboard';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { AcademicModule } from './components/modules/AcademicModule';
import { AnalyticsModule } from './components/modules/AnalyticsModule';
import { CourseModule } from './components/modules/CourseModule'; // Add this import
import UserManagement from './components/modules/UserManagement';
import RequestVerificationPage from './components/auth/RequestVerificationPage';
import { AttendanceModule } from './components/modules/AttendanceModule';
import { MarksModule } from './components/modules/MarksModule';
import { StudentModule } from './components/modules/StudentModule';
import { ScheduleModule } from './components/modules/ScheduleModule';
import { NotificationModule } from './components/modules/NotificationModule';
import { FinanceModule } from './components/modules/FinanceModule';
import { LibraryModule } from './components/modules/LibraryModule';
import { PlacementModule } from './components/modules/PlacementModule';
import { ProfileModule } from './components/modules/ProfileModule';
import { StudentServices } from './components/modules/StudentServices';
import { AssignmentModule } from './components/modules/AssignmentModule';
import { ExamModule } from './components/modules/ExamModule';
import { FeedbackModule } from './components/modules/FeedbackModule';
import { CalendarModule } from './components/modules/CalendarModule';
import { ReportsModule } from './components/modules/ReportsModule';
import { SettingsModule } from './components/modules/SettingsModule';
import { TransportModule } from './components/modules/TransportModule';
import { HostelModule } from './components/modules/HostelModule';
import { SectionModule } from './components/modules/SectionModule';
import StudentSectionView from './components/modules/StudentSectionView';
import FacultySectionView from './components/modules/FacultySectionView';
import { LeaveModule } from './components/modules/LeaveModule';
import { ParentPortal } from './components/modules/ParentPortal';
import { RequestApproval } from './components/admin/RequestApproval';
import { pageVariants, pageTransition } from './utils/animations';
import { DynamicBackground } from './components/ui/DynamicBackground';
import { BackgroundControls } from './components/ui/BackgroundControls';
import { ColorTransition } from './components/ui/ColorTransition';
import { BackgroundShowcase } from './components/ui/BackgroundShowcase';
import { LandingPage } from './components/LandingPage';
import { RoleLoginPage } from './components/auth/RoleLoginPage';

function AppContent() {
  const { user, isLoading } = useAuth();
  const { theme } = useAuth();
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const res = await import('./utils/api').then(m => m.default.getNotifications({ read: 'false' })) as any;
          setUnreadNotificationCount(res?.notifications?.length ?? 0);
        } catch {
          setUnreadNotificationCount(0);
        }
      };
      fetchNotifications();
    }
  }, [user]);

  const handleNotificationClick = () => {
    setActiveTab('notifications');
  };

  const handleSidebarCollapse = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/request-verification" element={<RequestVerificationPage />} />
      <Route path="/verify-email-otp" element={<EmailOtpPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/login" element={user ? <Navigate to="/app" replace /> : <LoginForm />} />
      <Route path="/login/student" element={user ? <Navigate to="/app" replace /> : <RoleLoginPage role="student" />} />
      <Route path="/login/faculty" element={user ? <Navigate to="/app" replace /> : <RoleLoginPage role="faculty" />} />
      <Route path="/login/admin" element={user ? <Navigate to="/app" replace /> : <RoleLoginPage role="admin" />} />
      <Route path="/login/placement" element={user ? <Navigate to="/app" replace /> : <RoleLoginPage role="placement" />} />
      <Route path="/login/library" element={user ? <Navigate to="/app" replace /> : <RoleLoginPage role="library" />} />
      <Route path="/landing" element={user ? <Navigate to="/app" replace /> : <LandingPage />} />
      {/* Root route: show mobile landing on phones, cinematic landing on desktop; redirect to app when authenticated */}
      <Route path="/" element={user ? <Navigate to="/app" replace /> : (isMobile ? <MobileLanding /> : <LandingPage />)} />
      <Route path="/mobile/login" element={<MobileLogin />} />
      <Route path="/mobile/register" element={<MobileRegister />} />
      <Route path="/mobile/forgot-password" element={<MobileForgotPassword />} />
      <Route path="/mobile/reset-password" element={<MobileResetPassword />} />
      <Route path="/app" element={
        !user ? <Navigate to="/" replace /> : (
          <div className="min-h-screen flex relative overflow-hidden">
            {/* Enhanced Dynamic Background with better positioning */}
            <DynamicBackground variant="floating-orbs" intensity="medium" colorScheme="dynamic" theme={theme} />

            {/* Additional background layers for depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-green-50/30 dark:from-gray-900/50 dark:via-blue-900/30 dark:to-purple-900/20" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-purple-100/20 dark:from-blue-900/20 dark:to-purple-900/20" />

            {/* Sidebar */}
            <div className={mobileMenuOpen ? 'block md:block' : 'hidden md:block'}>
              <div className="fixed left-0 top-0 h-full z-40 md:z-30">
                <Sidebar
                  activeTab={activeTab}
                  onTabChange={(tab) => { setActiveTab(tab); setMobileMenuOpen(false); }}
                  collapsed={sidebarCollapsed}
                  onCollapseChange={handleSidebarCollapse}
                />
              </div>
            </div>

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-80'} ml-0 relative`}>
              {/* Content background with enhanced glassmorphism effect */}
              <div className="absolute inset-0 bg-card backdrop-blur-sm border-l border-gray-200/50 dark:border-gray-700/50" />

              <Header
                onNotificationClick={handleNotificationClick}
                unreadCount={unreadNotificationCount}
                onMenuClick={() => setMobileMenuOpen(true)}
              />

              {/* Main content */}
              <main className="flex-1 p-6 overflow-y-auto relative z-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    variants={pageVariants}
                    initial="initial"
                    animate="in"
                    exit="out"
                    transition={pageTransition}
                  >
                    {(() => {
                      switch (activeTab) {
                        case 'dashboard':
                          switch (user.role) {
                            case 'student':
                              return <StudentDashboard onTabChange={setActiveTab} />;
                            case 'faculty':
                              return <FacultyDashboard />;
                            case 'admin':
                              return <AdminDashboard />;
                            case 'placement':
                              return <AdminDashboard />;
                            case 'library':
                              return <AdminDashboard />;
                            default:
                              return <StudentDashboard onTabChange={setActiveTab} />;
                          }
                        case 'academic':
                          return <AcademicModule />;
                        case 'courses': // Faculty: My Courses, Admin: Course Management
                          return <CourseModule />;
                        case 'attendance': // Faculty only
                          return <AttendanceModule />;
                        case 'marks': // Faculty only
                          return <MarksModule />;
                        case 'students': // Faculty only
                          return <StudentModule />;
                        case 'schedule': // Faculty only
                          return <ScheduleModule />;
                        case 'assignments': // Faculty and Students
                          return <AssignmentModule />;
                        case 'exams':
                          return <ExamModule />;
                        case 'feedback':
                          return <FeedbackModule />;
                        case 'calendar':
                          return <CalendarModule />;
                        case 'notifications':
                          return <NotificationModule />;
                        case 'finance':
                          return <FinanceModule />;
                        case 'library':
                          return <LibraryModule />;
                        case 'placement':
                          return <PlacementModule />;
                        case 'profile':
                          return <ProfileModule />;
                        case 'services':
                          return <StudentServices />;
                        case 'transport':
                          return <TransportModule />;
                        case 'hostel':
                          return <HostelModule />;
                        case 'parent':
                          return <ParentPortal />;
                        case 'leaves':
                          return <LeaveModule />;
                        case 'analytics':
                          return <AnalyticsModule />;
                        case 'users': // Admin: User Management
                          return <UserManagement />;
                        case 'request-approval': // Admin: Request Approval
                          return <RequestApproval />;
                        case 'reports': // Admin only
                          return <ReportsModule />;
                        case 'settings': // Admin only
                          return <SettingsModule />;
                        case 'background-showcase': // Background showcase for all users
                          return <BackgroundShowcase />;
                        case 'my-section': // Student: View assigned section
                          return <StudentSectionView />;
                        case 'sections': // Admin/Faculty: Section views
                          return user?.role === 'faculty' ? <FacultySectionView /> : <SectionModule />;
                        default:
                          return (
                            <div className="text-center py-12">
                              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
                              <p className="text-gray-600 dark:text-gray-400">This module is under development...</p>
                            </div>
                          );
                      }
                    })()}
                  </motion.div>
                </AnimatePresence>
              </main>
            </div>
            {/* Background Controls */}
            <BackgroundControls />

            {/* Color Transition Effects */}
            <ColorTransition />
          </div>
        )
      } />
      {/* Fallback: anything else goes to app if logged in, otherwise to login */}
      <Route path="/*" element={user ? <Navigate to="/app" replace /> : <Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BackgroundProvider>
        <Router>
          <AppContent />
        </Router>
      </BackgroundProvider>
    </AuthProvider>
  );
}

export default App;