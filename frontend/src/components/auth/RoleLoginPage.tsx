// src/components/auth/RoleLoginPage.tsx
import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import {
    Mail, Lock, GraduationCap, Eye, EyeOff, AlertCircle, ArrowLeft, Shield,
    Users, Briefcase, BookOpen, ChevronRight, CheckCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Role Configuration ─── */
export interface RoleConfig {
    role: string;
    title: string;
    subtitle: string;
    icon: React.ElementType;
    color: string;
    gradientFrom: string;
    gradientTo: string;
    bgGradient: string;
    features: string[];
}

export const ROLE_CONFIGS: Record<string, RoleConfig> = {
    student: {
        role: 'student',
        title: 'Student Portal',
        subtitle: 'Access your academic dashboard',
        icon: GraduationCap,
        color: '#3B82F6',
        gradientFrom: 'from-blue-600',
        gradientTo: 'to-indigo-700',
        bgGradient: 'from-blue-950 via-slate-950 to-indigo-950',
        features: [
            'View grades & academic progress',
            'Submit assignments on time',
            'Track attendance records',
            'Access library & schedules',
        ],
    },
    faculty: {
        role: 'faculty',
        title: 'Faculty Portal',
        subtitle: 'Manage your classes & students',
        icon: Users,
        color: '#8B5CF6',
        gradientFrom: 'from-purple-600',
        gradientTo: 'to-violet-700',
        bgGradient: 'from-purple-950 via-slate-950 to-violet-950',
        features: [
            'Mark & manage attendance',
            'Grade assignments & exams',
            'View teaching schedule',
            'Track student performance',
        ],
    },
    admin: {
        role: 'admin',
        title: 'Admin Portal',
        subtitle: 'Full system control & management',
        icon: Shield,
        color: '#06B6D4',
        gradientFrom: 'from-cyan-600',
        gradientTo: 'to-teal-700',
        bgGradient: 'from-cyan-950 via-slate-950 to-teal-950',
        features: [
            'Full system control',
            'User & course management',
            'Financial operations',
            'Advanced analytics & reports',
        ],
    },
    placement: {
        role: 'placement',
        title: 'Placement Officer',
        subtitle: 'Drive campus recruitment',
        icon: Briefcase,
        color: '#22C55E',
        gradientFrom: 'from-green-600',
        gradientTo: 'to-emerald-700',
        bgGradient: 'from-green-950 via-slate-950 to-emerald-950',
        features: [
            'Post job opportunities',
            'Track student placements',
            'Company management',
            'Generate placement reports',
        ],
    },
    library: {
        role: 'library',
        title: 'Librarian Portal',
        subtitle: 'Manage library resources',
        icon: BookOpen,
        color: '#F59E0B',
        gradientFrom: 'from-amber-600',
        gradientTo: 'to-orange-700',
        bgGradient: 'from-amber-950 via-slate-950 to-orange-950',
        features: [
            'Manage book catalog',
            'Issue & return books',
            'Track overdue items',
            'Digital library access',
        ],
    },
};

/* ─── Toast ─── */
const Toast = ({
    message,
    type,
    onClose,
}: {
    message: string;
    type: 'success' | 'error' | 'info';
    onClose: () => void;
}) => {
    const styles = {
        success: 'bg-green-500/10 border-green-500/30 text-green-400',
        error: 'bg-red-500/10 border-red-500/30 text-red-400',
        info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className={`fixed top-4 left-1/2 z-50 max-w-md w-full mx-auto p-4 rounded-xl border backdrop-blur-xl shadow-2xl ${styles[type]}`}
        >
            <div className="flex items-center space-x-3">
                <span className="flex-1 font-medium text-sm">{message}</span>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors ml-2">×</button>
            </div>
        </motion.div>
    );
};

/* ─── Validation ─── */
const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address').min(1, 'Email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password is too long'),
    rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

/* ─── Floating particles background ─── */
const FloatingOrbs = ({ color }: { color: string }) => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
                key={i}
                className="absolute rounded-full opacity-[0.07]"
                style={{
                    width: 200 + i * 80,
                    height: 200 + i * 80,
                    background: color,
                    left: `${10 + i * 15}%`,
                    top: `${5 + (i % 3) * 30}%`,
                }}
                animate={{
                    y: [0, -20, 0],
                    x: [0, 10, 0],
                    scale: [1, 1.05, 1],
                }}
                transition={{
                    duration: 8 + i * 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.5,
                }}
            />
        ))}
    </div>
);

/* ════════════════════════════════════════════════
   ROLE LOGIN PAGE COMPONENT
   ════════════════════════════════════════════════ */
export function RoleLoginPage({ role }: { role?: string }) {
    const params = useParams<{ role: string }>();
    const roleKey = role || params.role || 'student';
    const config = ROLE_CONFIGS[roleKey] || ROLE_CONFIGS.student;

    const navigate = useNavigate();
    const { login, verifyTwoFactor, isLoading } = useAuth();

    const [showPassword, setShowPassword] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotMessage, setForgotMessage] = useState<{ text: string; isError: boolean } | null>(null);
    const [resetStep, setResetStep] = useState<'email' | 'otp' | 'password'>('email');
    const [resetOtp, setResetOtp] = useState('');
    const [resetNewPassword, setResetNewPassword] = useState('');
    const [resetConfirmPassword, setResetConfirmPassword] = useState('');
    const [resetShowPassword, setResetShowPassword] = useState(false);
    const [otpTimer, setOtpTimer] = useState(0);
    const otpTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
        reset,
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '', rememberMe: false },
    });

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    }, []);

    const onSubmit = async (data: LoginFormData) => {
        try {
            if (!data.email || !data.password) {
                showToast('Please fill in all required fields.', 'error');
                return;
            }

            const result = await login(data.email, data.password);

            // OTP required
            if ((result as any)?.otpRequired || result?.twoFactorRequired) {
                navigate(`/verify-email-otp?email=${encodeURIComponent(data.email)}`);
                return;
            }

            if (result && result.success) {
                showToast('Login successful! Welcome back.', 'success');
                reset();
                return;
            }

            const errorMessage = result?.message || 'Login failed. Please check your credentials and try again.';
            showToast(errorMessage, 'error');
            setValue('password', '');
        } catch (error) {
            let errorMessage = 'An unexpected error occurred. Please try again.';
            if (error instanceof Error) {
                if (error.message.includes('Server error')) errorMessage = 'Server is currently unavailable. Please try again in a few moments.';
                else if (error.message.includes('Network')) errorMessage = 'Network connection error. Please check your internet connection.';
                else if (error.message.includes('timeout')) errorMessage = 'Request timed out. Please try again.';
                else if (error.message.includes('401') || error.message.includes('Unauthorized')) errorMessage = 'Invalid email or password.';
                else errorMessage = error.message;
            }
            showToast(errorMessage, 'error');
            setValue('password', '');
        }
    };

    const API = apiClient.rootURL;

    const startOtpTimer = () => {
        if (otpTimerRef.current) clearInterval(otpTimerRef.current);
        const expiry = Number(import.meta.env.VITE_OTP_EXPIRY_MINUTES || 10) * 60;
        setOtpTimer(expiry);
        otpTimerRef.current = setInterval(() => {
            setOtpTimer(prev => { if (prev <= 1) { clearInterval(otpTimerRef.current!); return 0; } return prev - 1; });
        }, 1000);
    };

    const closeForgotModal = () => {
        setShowForgotPassword(false);
        setForgotMessage(null);
        setResetStep('email');
        setResetOtp('');
        setResetNewPassword('');
        setResetConfirmPassword('');
        if (otpTimerRef.current) clearInterval(otpTimerRef.current);
    };

    const handleSendOtp = async () => {
        if (!forgotEmail.trim()) { setForgotMessage({ text: 'Please enter your email address.', isError: true }); return; }
        setForgotLoading(true); setForgotMessage(null);
        try {
            const res = await fetch(`${API}/api/auth/forgot-password`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setResetStep('otp');
                startOtpTimer();
                setForgotMessage(null);
            } else {
                setForgotMessage({ text: data.message || 'Failed to send OTP.', isError: true });
            }
        } catch { setForgotMessage({ text: 'Network error. Please try again.', isError: true }); }
        finally { setForgotLoading(false); }
    };

    const handleVerifyOtp = async () => {
        if (resetOtp.length < 6) { setForgotMessage({ text: 'Please enter the complete 6-digit OTP.', isError: true }); return; }
        setForgotLoading(true); setForgotMessage(null);
        try {
            const res = await fetch(`${API}/api/auth/verify-reset-otp`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail.trim().toLowerCase(), otp: resetOtp }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setResetStep('password');
                setForgotMessage(null);
            } else {
                setForgotMessage({ text: data.message || 'Invalid OTP.', isError: true });
            }
        } catch { setForgotMessage({ text: 'Network error. Please try again.', isError: true }); }
        finally { setForgotLoading(false); }
    };

    const handleResetPassword = async () => {
        if (resetNewPassword.length < 6) { setForgotMessage({ text: 'Password must be at least 6 characters.', isError: true }); return; }
        if (resetNewPassword !== resetConfirmPassword) { setForgotMessage({ text: 'Passwords do not match.', isError: true }); return; }
        setForgotLoading(true); setForgotMessage(null);
        try {
            const res = await fetch(`${API}/api/auth/reset-password`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail.trim().toLowerCase(), otp: resetOtp, newPassword: resetNewPassword }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setForgotMessage({ text: '✅ Password reset! You can now log in.', isError: false });
                setTimeout(() => closeForgotModal(), 2500);
            } else {
                setForgotMessage({ text: data.message || 'Failed to reset password.', isError: true });
            }
        } catch { setForgotMessage({ text: 'Network error. Please try again.', isError: true }); }
        finally { setForgotLoading(false); }
    };

    const Icon = config.icon;

    return (
        <>
            {/* Forgot Password Modal */}
            <AnimatePresence>
                {showForgotPassword && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
                        onClick={closeForgotModal}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#0d1526] border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header + step indicator */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Mail className="w-6 h-6" style={{ color: config.color }} />
                                    <h3 className="text-xl font-bold text-white">Reset Password</h3>
                                </div>
                                <div className="flex gap-1.5">
                                    {(['email', 'otp', 'password'] as const).map((s) => (
                                        <div key={s} className="w-2 h-2 rounded-full transition-all"
                                            style={{ background: s === resetStep ? config.color : 'rgba(255,255,255,0.2)' }} />
                                    ))}
                                </div>
                            </div>

                            {/* Step 1: Email */}
                            {resetStep === 'email' && (<>
                                <p className="text-sm text-gray-400">Enter your email and we'll send a 6-digit OTP to reset your password.</p>
                                <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                                    placeholder="Enter your email" onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:border-transparent text-white placeholder-gray-500"
                                    style={{ '--tw-ring-color': config.color } as any} />
                                {forgotMessage && <p className={`text-sm ${forgotMessage.isError ? 'text-red-400' : 'text-green-400'}`}>{forgotMessage.text}</p>}
                                <div className="flex space-x-3">
                                    <button onClick={closeForgotModal} className="flex-1 py-2.5 border border-white/10 rounded-xl text-gray-300 font-medium hover:bg-white/5 transition">Cancel</button>
                                    <button onClick={handleSendOtp} disabled={forgotLoading}
                                        className={`flex-1 py-2.5 bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} text-white rounded-xl font-medium transition disabled:opacity-50`}>
                                        {forgotLoading ? 'Sending...' : 'Send OTP'}
                                    </button>
                                </div>
                            </>)}

                            {/* Step 2: OTP */}
                            {resetStep === 'otp' && (<>
                                <div>
                                    <p className="text-sm text-gray-400">Enter the 6-digit OTP sent to <span className="text-white font-medium">{forgotEmail}</span></p>
                                    {otpTimer > 0 && <p className="text-xs text-gray-500 mt-1">Expires in {Math.floor(otpTimer / 60)}:{String(otpTimer % 60).padStart(2, '0')}</p>}
                                    {otpTimer === 0 && <p className="text-xs text-red-400 mt-1">OTP expired. Please resend.</p>}
                                </div>
                                <input type="text" inputMode="numeric" maxLength={6} value={resetOtp}
                                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                                    placeholder="• • • • • •"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:border-transparent text-white text-center text-2xl tracking-[0.5em] placeholder-gray-600"
                                    style={{ '--tw-ring-color': config.color } as any} />
                                {forgotMessage && <p className={`text-sm ${forgotMessage.isError ? 'text-red-400' : 'text-green-400'}`}>{forgotMessage.text}</p>}
                                <div className="text-center">
                                    <button onClick={() => { setResetStep('email'); setResetOtp(''); setForgotMessage(null); }} className="text-xs text-gray-500 hover:text-gray-300 underline">Resend OTP</button>
                                </div>
                                <div className="flex space-x-3">
                                    <button onClick={closeForgotModal} className="flex-1 py-2.5 border border-white/10 rounded-xl text-gray-300 font-medium hover:bg-white/5 transition">Cancel</button>
                                    <button onClick={handleVerifyOtp} disabled={forgotLoading || resetOtp.length < 6}
                                        className={`flex-1 py-2.5 bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} text-white rounded-xl font-medium transition disabled:opacity-50`}>
                                        {forgotLoading ? 'Verifying...' : 'Verify OTP'}
                                    </button>
                                </div>
                            </>)}

                            {/* Step 3: New Password */}
                            {resetStep === 'password' && (<>
                                <p className="text-sm text-gray-400">OTP verified ✅ — enter your new password below.</p>
                                <div className="relative">
                                    <input type={resetShowPassword ? 'text' : 'password'} value={resetNewPassword}
                                        onChange={(e) => setResetNewPassword(e.target.value)} placeholder="New password (min 6 chars)"
                                        className="w-full px-4 py-3 pr-10 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:border-transparent text-white placeholder-gray-500"
                                        style={{ '--tw-ring-color': config.color } as any} />
                                    <button type="button" onClick={() => setResetShowPassword(p => !p)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 text-xs">
                                        {resetShowPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                                <input type={resetShowPassword ? 'text' : 'password'} value={resetConfirmPassword}
                                    onChange={(e) => setResetConfirmPassword(e.target.value)} placeholder="Confirm new password"
                                    onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:border-transparent text-white placeholder-gray-500"
                                    style={{ '--tw-ring-color': config.color } as any} />
                                {forgotMessage && <p className={`text-sm ${forgotMessage.isError ? 'text-red-400' : 'text-green-400'}`}>{forgotMessage.text}</p>}
                                <div className="flex space-x-3">
                                    <button onClick={closeForgotModal} className="flex-1 py-2.5 border border-white/10 rounded-xl text-gray-300 font-medium hover:bg-white/5 transition">Cancel</button>
                                    <button onClick={handleResetPassword} disabled={forgotLoading}
                                        className={`flex-1 py-2.5 bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} text-white rounded-xl font-medium transition disabled:opacity-50`}>
                                        {forgotLoading ? 'Resetting...' : 'Reset Password'}
                                    </button>
                                </div>
                            </>)}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Page */}
            <div className={`min-h-screen bg-gradient-to-br ${config.bgGradient} flex relative overflow-hidden`}>
                <FloatingOrbs color={config.color} />

                {/* Left Panel — Role Branding (hidden on mobile) */}
                <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-center px-12 xl:px-20 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                    >
                        {/* Back to home */}
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-10 group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Home
                        </Link>

                        {/* Icon + Title */}
                        <div className="flex items-center gap-4 mb-6">
                            <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                                style={{ background: `${config.color}20`, boxShadow: `0 0 40px ${config.color}15` }}
                            >
                                <Icon className="w-8 h-8" style={{ color: config.color }} />
                            </div>
                            <div>
                                <h1 className="text-3xl xl:text-4xl font-bold text-white">{config.title}</h1>
                                <p className="text-gray-400 mt-1">{config.subtitle}</p>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="mt-10 space-y-4">
                            {config.features.map((feat, i) => (
                                <motion.div
                                    key={feat}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                                    className="flex items-center gap-3"
                                >
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{ background: `${config.color}15` }}
                                    >
                                        <CheckCircle className="w-4 h-4" style={{ color: config.color }} />
                                    </div>
                                    <span className="text-gray-300 text-base">{feat}</span>
                                </motion.div>
                            ))}
                        </div>

                        {/* EduConnect branding */}
                        <div className="mt-16 flex items-center gap-3 opacity-50">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <GraduationCap className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm text-gray-500 font-medium">EduConnect ERP</span>
                        </div>
                    </motion.div>
                </div>

                {/* Right Panel — Login Form */}
                <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center px-4 sm:px-8 py-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="w-full max-w-md"
                    >
                        {/* Mobile: Back + icon */}
                        <div className="lg:hidden mb-8">
                            <Link
                                to="/"
                                className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Home
                            </Link>
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                                    style={{ background: `${config.color}20` }}
                                >
                                    <Icon className="w-6 h-6" style={{ color: config.color }} />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">{config.title}</h1>
                                    <p className="text-sm text-gray-400">{config.subtitle}</p>
                                </div>
                            </div>
                        </div>

                        {/* Card */}
                        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl">
                            {/* Header bar */}
                            <div
                                className={`bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} p-5 flex items-center justify-center gap-3`}
                            >
                                <Icon className="w-6 h-6 text-white" />
                                <h2 className="text-lg font-bold text-white tracking-wide">Sign In</h2>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-5">
                                {/* Email */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-300">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input
                                            {...register('email')}
                                            type="email"
                                            className={`w-full pl-12 pr-4 py-3.5 bg-white/[0.05] border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all ${errors.email ? 'border-red-500/50 bg-red-500/5' : 'border-white/[0.1] hover:border-white/[0.2]'
                                                }`}
                                            style={{ '--tw-ring-color': config.color } as any}
                                            placeholder="Enter your email address"
                                        />
                                    </div>
                                    {errors.email && (
                                        <div className="flex items-center space-x-1 text-red-400 text-sm">
                                            <AlertCircle className="w-4 h-4" />
                                            <span>{errors.email.message}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Password */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-300">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input
                                            {...register('password')}
                                            type={showPassword ? 'text' : 'password'}
                                            className={`w-full pl-12 pr-12 py-3.5 bg-white/[0.05] border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:border-transparent transition-all ${errors.password ? 'border-red-500/50 bg-red-500/5' : 'border-white/[0.1] hover:border-white/[0.2]'
                                                }`}
                                            style={{ '--tw-ring-color': config.color } as any}
                                            placeholder="Enter your password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(prev => !prev)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <div className="flex items-center space-x-1 text-red-400 text-sm">
                                            <AlertCircle className="w-4 h-4" />
                                            <span>{errors.password.message}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Remember + Forgot */}
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            {...register('rememberMe')}
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-gray-600 bg-white/5 focus:ring-offset-0"
                                            style={{ accentColor: config.color }}
                                        />
                                        <span className="text-sm text-gray-400">Remember me</span>
                                    </label>
                                    <button
                                        type="button"
                                        className="text-sm font-medium transition-colors hover:underline"
                                        style={{ color: config.color }}
                                        onClick={() => setShowForgotPassword(true)}
                                    >
                                        Forgot password?
                                    </button>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    className={`w-full bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} text-white py-3.5 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]`}
                                    style={{ '--tw-ring-color': config.color, '--tw-shadow-color': `${config.color}30` } as any}
                                    disabled={isSubmitting || isLoading}
                                >
                                    {(isSubmitting || isLoading) ? (
                                        <div className="flex items-center justify-center space-x-2">
                                            <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            <span>Signing In...</span>
                                        </div>
                                    ) : (
                                        'Sign In'
                                    )}
                                </button>

                                {/* Links */}
                                <div className="text-center space-y-3 pt-2">
                                    <Link
                                        to="/request-verification"
                                        className="block text-sm hover:underline transition-colors"
                                        style={{ color: config.color }}
                                    >
                                        Need an account? Request verification here
                                    </Link>
                                    <Link
                                        to="/login"
                                        className="block text-xs text-gray-500 hover:text-gray-300 transition-colors"
                                    >
                                        Use generic login instead
                                    </Link>
                                </div>
                            </form>
                        </div>

                        {/* Other portals */}
                        <div className="mt-8 text-center">
                            <p className="text-xs text-gray-500 mb-3">Other portals</p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {Object.values(ROLE_CONFIGS)
                                    .filter((r) => r.role !== roleKey)
                                    .map((r) => (
                                        <Link
                                            key={r.role}
                                            to={`/login/${r.role}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-gray-400 hover:text-white hover:border-white/[0.15] transition-all"
                                        >
                                            <r.icon className="w-3.5 h-3.5" style={{ color: r.color }} />
                                            {r.title.replace(' Portal', '').replace(' Officer', '')}
                                        </Link>
                                    ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
                )}
            </AnimatePresence>
        </>
    );
}

export default RoleLoginPage;
