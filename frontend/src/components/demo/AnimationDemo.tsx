import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Upload, 
  Settings, 
  User,
  Home,
  BookOpen,
  CreditCard,
  Trophy,
  FileText,
  Clock,
  Calendar,
  BarChart3,
  Users,
  Shield,
  Wifi,
  WifiOff,
  ChevronRight,
  ChevronLeft,
  Moon,
  Sun,
  LogOut,
  HelpCircle,
  MessageCircle,
  Bus,
  Building2
} from 'lucide-react';
import { 
  pageVariants, 
  pageTransition, 
  staggerContainer, 
  staggerItem, 
  cardVariants,
  fadeInVariants,
  fadeInUpVariants,
  slideInLeftVariants,
  slideInRightVariants,
  scaleInVariants,
  bounceVariants,
  shakeVariants,
  checkmarkVariants,
  floatVariants,
  rotateVariants,
  waveVariants,
  pulseVariants,
  buttonVariants,
  notificationVariants,
  dropdownVariants,
  progressVariants,
  chartVariants
} from '../../utils/animations';
import { AnimatedLoading } from '../ui/AnimatedLoading';
import { FloatingParticles, RippleButton, TiltCard, ConfettiBurst } from '../ui/SpecialEffects';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

export function AnimationDemo() {
  const [showNotification, setShowNotification] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingType, setLoadingType] = useState<'spinner' | 'dots' | 'bars' | 'pulse' | 'float' | 'wave'>('spinner');

  const triggerNotification = () => {
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const triggerProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const loadingTypes = [
    { type: 'spinner' as const, label: 'Spinner' },
    { type: 'dots' as const, label: 'Dots' },
    { type: 'bars' as const, label: 'Bars' },
    { type: 'pulse' as const, label: 'Pulse' },
    { type: 'float' as const, label: 'Float' },
    { type: 'wave' as const, label: 'Wave' },
  ];

  return (
    <motion.div 
      className="min-h-screen bg-gray-50 p-6 space-y-8"
      variants={pageVariants}
      initial="initial"
      animate="in"
      exit="out"
      transition={pageTransition}
    >
      <FloatingParticles count={30} />
      <ConfettiBurst trigger={showNotification} />
      {/* Header */}
      <motion.div 
        className="text-center"
        variants={fadeInUpVariants}
        initial="initial"
        animate="animate"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Animation Showcase</h1>
        <p className="text-lg text-gray-600">Explore all the beautiful animations in our ERP app</p>
      </motion.div>

      {/* Page Transitions */}
      <motion.div
        variants={fadeInUpVariants}
        initial="initial"
        animate="animate"
      >
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Page Transitions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              This entire page uses page transition animations. Notice the smooth fade-in effect when the page loads.
            </p>
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <p className="text-center">Hover and tap me to see micro-interactions!</p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stagger Animations */}
      <motion.div
        variants={fadeInUpVariants}
        initial="initial"
        animate="animate"
      >
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Stagger Animations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Items animate in sequence with a stagger effect, creating a smooth cascade animation.
            </p>
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {[
                { icon: Home, label: 'Dashboard', color: 'blue' },
                { icon: BookOpen, label: 'Courses', color: 'green' },
                { icon: CreditCard, label: 'Finance', color: 'purple' },
                { icon: Trophy, label: 'Achievements', color: 'orange' },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  variants={staggerItem}
                  custom={index}
                  className={`p-4 bg-${item.color}-100 rounded-lg text-center`}
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <item.icon className={`w-8 h-8 mx-auto mb-2 text-${item.color}-600`} />
                  <p className="font-medium text-gray-900">{item.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Loading Animations */}
      <motion.div
        variants={fadeInUpVariants}
        initial="initial"
        animate="animate"
      >
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Loading Animations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Different loading animation types for various use cases.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {loadingTypes.map((type) => (
                <motion.button
                  key={type.type}
                  className={`p-4 border rounded-lg ${loadingType === type.type ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                  onClick={() => setLoadingType(type.type)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <AnimatedLoading type={type.type} size="md" />
                  <p className="text-sm font-medium mt-2">{type.label}</p>
                </motion.button>
              ))}
            </div>
            <div className="flex justify-center">
              <AnimatedLoading type={loadingType} size="lg" text="Loading..." />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Interactive Animations */}
      <motion.div
        variants={fadeInUpVariants}
        initial="initial"
        animate="animate"
      >
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Interactive Animations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Buttons */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Button Animations</h3>
                <div className="space-y-3">
                  <Button variant="primary" onClick={triggerNotification}>
                    Trigger Notification
                  </Button>
                  <Button variant="success" onClick={triggerProgress}>
                    Start Progress
                  </Button>
                  <Button variant="danger">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Error Button
                  </Button>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Progress Animation</h3>
                <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                  <motion.div
                    className="bg-blue-500 h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">{progress}% Complete</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Special Effects */}
      <motion.div
        variants={fadeInUpVariants}
        initial="initial"
        animate="animate"
      >
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Special Effects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Bounce */}
              <motion.div
                className="p-4 bg-green-100 rounded-lg text-center"
                variants={bounceVariants}
                whileHover="animate"
              >
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="font-medium">Bounce</p>
              </motion.div>

              {/* Shake */}
              <motion.div
                className="p-4 bg-red-100 rounded-lg text-center"
                variants={shakeVariants}
                whileHover="animate"
              >
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
                <p className="font-medium">Shake</p>
              </motion.div>

              {/* Float */}
              <motion.div
                className="p-4 bg-blue-100 rounded-lg text-center"
                variants={floatVariants}
                animate="animate"
              >
                <Wifi className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="font-medium">Float</p>
              </motion.div>

              {/* Rotate */}
              <motion.div
                className="p-4 bg-purple-100 rounded-lg text-center"
                variants={rotateVariants}
                animate="animate"
              >
                <Settings className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <p className="font-medium">Rotate</p>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notification Demo */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            className="fixed top-4 right-4 z-50"
            variants={notificationVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="bg-green-500 text-white p-4 rounded-lg shadow-lg flex items-center space-x-3">
              <CheckCircle className="w-5 h-5" />
              <span>Success! Animation triggered successfully.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chart Animation Demo */}
      <motion.div
        variants={fadeInUpVariants}
        initial="initial"
        animate="animate"
      >
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Chart Animations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Charts animate in smoothly with scale and opacity transitions.
            </p>
            <motion.div
              className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white"
              variants={chartVariants}
              initial="initial"
              animate="animate"
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                <p className="font-semibold">Interactive Chart</p>
                <p className="text-sm opacity-90">Hover to see the effect</p>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Dropdown Demo */}
      <motion.div
        variants={fadeInUpVariants}
        initial="initial"
        animate="animate"
      >
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Dropdown Animations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Button 
                variant="outline" 
                onClick={() => setShowDropdown(!showDropdown)}
                className="mb-4"
              >
                Toggle Dropdown
              </Button>
              
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    className="absolute top-full left-0 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
                    variants={dropdownVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <div className="py-2">
                      <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                      </button>
                      <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2">
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                      <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2">
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Wave Animation Demo */}
      <motion.div
        variants={fadeInUpVariants}
        initial="initial"
        animate="animate"
      >
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Wave Animation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center space-x-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-8 bg-blue-500 rounded-full"
                  variants={waveVariants}
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
          </CardContent>
        </Card>
      </motion.div>

      {/* Pulse Animation Demo */}
      <motion.div
        variants={fadeInUpVariants}
        initial="initial"
        animate="animate"
      >
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Pulse Animation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <motion.div
                className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white"
                variants={pulseVariants}
                animate="animate"
              >
                <Bell className="w-8 h-8" />
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
