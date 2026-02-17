import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    CheckCircle, FileText, BarChart3, Calendar, BookOpen, CreditCard,
    MessageCircle, TrendingUp, GraduationCap, Users, Shield, Zap,
    Globe, Clock, Activity, ChevronRight, Briefcase,
    Menu, X
} from 'lucide-react';

/* ─────────── Particles Background ─────────── */
const Particles: React.FC = () => {
    const particles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 20 + 10,
        delay: Math.random() * 5,
    }));

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        background: p.id % 3 === 0 ? '#2563EB' : p.id % 3 === 1 ? '#8B5CF6' : '#06B6D4',
                        opacity: 0.4,
                    }}
                    animate={{
                        y: [0, -30, 0],
                        opacity: [0.2, 0.6, 0.2],
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        delay: p.delay,
                        ease: 'easeInOut',
                    }}
                />
            ))}
        </div>
    );
};

/* ─────────── Typing Animation Hook ─────────── */
function useTypingEffect(texts: string[], speed = 80, pause = 2000) {
    const [display, setDisplay] = useState('');
    const [textIndex, setTextIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const current = texts[textIndex];
        let timeout: ReturnType<typeof setTimeout>;

        if (!isDeleting && charIndex < current.length) {
            timeout = setTimeout(() => setCharIndex((c) => c + 1), speed);
        } else if (!isDeleting && charIndex === current.length) {
            timeout = setTimeout(() => setIsDeleting(true), pause);
        } else if (isDeleting && charIndex > 0) {
            timeout = setTimeout(() => setCharIndex((c) => c - 1), speed / 2);
        } else if (isDeleting && charIndex === 0) {
            setIsDeleting(false);
            setTextIndex((i) => (i + 1) % texts.length);
        }

        setDisplay(current.substring(0, charIndex));
        return () => clearTimeout(timeout);
    }, [charIndex, isDeleting, textIndex, texts, speed, pause]);

    return display;
}

/* ─────────── Animated Section Wrapper ─────────── */
const AnimatedSection: React.FC<{
    children: React.ReactNode;
    className?: string;
    delay?: number;
}> = ({ children, className = '', delay = 0 }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-80px' });

    return (
        <motion.section
            ref={ref}
            className={className}
            initial={{ opacity: 0, y: 60 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
            transition={{ duration: 0.8, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            {children}
        </motion.section>
    );
};

/* ─────────── Glow Card ─────────── */
const GlowCard: React.FC<{
    children: React.ReactNode;
    className?: string;
    glowColor?: string;
    delay?: number;
}> = ({ children, className = '', glowColor = 'rgba(37,99,235,0.15)', delay = 0 }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });

    return (
        <motion.div
            ref={ref}
            className={`relative group ${className}`}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.6, delay, ease: 'easeOut' }}
            whileHover={{ scale: 1.03, y: -4 }}
        >
            {/* Glow border effect */}
            <div
                className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"
                style={{ background: `linear-gradient(135deg, ${glowColor}, transparent, ${glowColor})` }}
            />
            <div className="relative bg-[#0d1526]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 h-full transition-all duration-300 group-hover:border-white/[0.15]">
                {children}
            </div>
        </motion.div>
    );
};

/* ─────────── Feature Data ─────────── */
const features = [
    { icon: CheckCircle, title: 'Attendance', desc: 'Real-time tracking with smart analytics', color: '#22C55E' },
    { icon: FileText, title: 'Assignments', desc: 'Submit, grade, and track in one place', color: '#3B82F6' },
    { icon: BarChart3, title: 'Marks & Grades', desc: 'Comprehensive grade management', color: '#8B5CF6' },
    { icon: Calendar, title: 'Schedule', desc: 'Interactive timetable for everyone', color: '#F59E0B' },
    { icon: BookOpen, title: 'Library', desc: 'Digital catalog & book tracking', color: '#06B6D4' },
    { icon: CreditCard, title: 'Finance', desc: 'Fee management & payment history', color: '#EF4444' },
    { icon: MessageCircle, title: 'Chat', desc: 'Real-time messaging & announcements', color: '#10B981' },
    { icon: TrendingUp, title: 'Analytics', desc: 'Data-driven institutional insights', color: '#EC4899' },
];

const roles = [
    {
        icon: GraduationCap,
        title: 'Student Portal',
        color: '#3B82F6',
        gradient: 'from-blue-500/20 to-blue-600/5',
        loginPath: '/login/student',
        features: ['View grades & academic progress', 'Submit assignments on time', 'Track attendance records', 'Access library & schedules'],
    },
    {
        icon: Users,
        title: 'Faculty Portal',
        color: '#8B5CF6',
        gradient: 'from-purple-500/20 to-purple-600/5',
        loginPath: '/login/faculty',
        features: ['Mark & manage attendance', 'Grade assignments & exams', 'View teaching schedule', 'Track student performance'],
    },
    {
        icon: Shield,
        title: 'Admin Portal',
        color: '#06B6D4',
        gradient: 'from-cyan-500/20 to-cyan-600/5',
        loginPath: '/login/admin',
        features: ['Full system control', 'User & course management', 'Financial operations', 'Advanced analytics & reports'],
    },
    {
        icon: Briefcase,
        title: 'Placement Officer',
        color: '#22C55E',
        gradient: 'from-green-500/20 to-green-600/5',
        loginPath: '/login/placement',
        features: ['Post job opportunities', 'Track student placements', 'Company management', 'Generate placement reports'],
    },
    {
        icon: BookOpen,
        title: 'Librarian Portal',
        color: '#F59E0B',
        gradient: 'from-amber-500/20 to-amber-600/5',
        loginPath: '/login/library',
        features: ['Manage book catalog', 'Issue & return books', 'Track overdue items', 'Digital library access'],
    },
];

const stats = [
    { value: '1,500+', label: 'Requests/sec', icon: Zap },
    { value: '<50ms', label: 'Response Time', icon: Clock },
    { value: 'Real-time', label: 'Live Updates', icon: Activity },
    { value: '30+', label: 'Modules', icon: Globe },
];

const techStack = [
    { name: 'React', color: '#61DAFB' },
    { name: 'TypeScript', color: '#3178C6' },
    { name: 'Node.js', color: '#339933' },
    { name: 'MongoDB', color: '#47A248' },
    { name: 'Socket.IO', color: '#FFFFFF' },
    { name: 'Tailwind', color: '#06B6D4' },
];

const howItWorks = [
    { step: '01', title: 'Request Access', desc: 'Choose your role and submit a quick registration form. Admin reviews and approves your request.', color: '#3B82F6' },
    { step: '02', title: 'Get Onboarded', desc: 'Once approved, log in to your personalized dashboard — everything is pre-configured for your role.', color: '#8B5CF6' },
    { step: '03', title: 'Start Managing', desc: 'Track attendance, grades, schedules, and more — all from one unified platform in real-time.', color: '#06B6D4' },
];

const testimonials = [
    { name: 'Dr. Priya Sharma', role: 'HOD, Computer Science', quote: 'EduConnect replaced 5 different tools we were juggling. Attendance tracking alone saved us 10+ hours per week.', color: '#3B82F6' },
    { name: 'Rahul Patel', role: 'Student, IT Department', quote: 'I can check my grades, schedule, and attendance all in one place. The real-time notifications are a game-changer.', color: '#8B5CF6' },
    { name: 'Prof. Anand Desai', role: 'Dean of Academics', quote: 'The analytics dashboard gives us insights we never had before. Decision-making has become data-driven.', color: '#06B6D4' },
    { name: 'Sneha Gupta', role: 'Administrative Officer', quote: 'Fee management and report generation that used to take days now happens in minutes. Absolutely brilliant.', color: '#EC4899' },
];

const faqItems = [
    { q: 'How do I get started with EduConnect?', a: 'Click "Request Access" and fill in your details along with your role (Student, Faculty, or Admin). Once approved by your institution\'s admin, you\'ll receive login credentials.' },
    { q: 'Is EduConnect free for educational institutions?', a: 'EduConnect is open-source and free to deploy. Institutions can self-host the platform on their own infrastructure with no licensing fees.' },
    { q: 'Does it work on mobile devices?', a: 'Yes! EduConnect has a dedicated Android app for students and faculty, plus the web dashboard is fully responsive on all screen sizes.' },
    { q: 'What kind of real-time features does it support?', a: 'Live attendance tracking, instant grade updates, real-time chat between students and faculty, push notifications, and live schedule changes — all powered by Socket.IO.' },
    { q: 'Can different departments be managed separately?', a: 'Absolutely. EduConnect supports multi-program, multi-branch, and multi-section management. Each admin level (Head, Program, Branch) has scoped access.' },
];

/* ─────────── Animated Counter ─────────── */
const AnimatedCounter: React.FC<{ value: string; label: string; icon: React.ElementType }> = ({ value, label, icon: Icon }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    const numericPart = value.replace(/[^0-9]/g, '');
    const prefix = value.match(/^[^0-9]*/)?.[0] || '';
    const suffix = value.match(/[^0-9]*$/)?.[0] || '';
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!isInView || !numericPart) return;
        const target = parseInt(numericPart, 10);
        const duration = 2000;
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) { setCount(target); clearInterval(timer); }
            else setCount(Math.floor(current));
        }, duration / steps);
        return () => clearInterval(timer);
    }, [isInView, numericPart]);

    return (
        <GlowCard glowColor="rgba(6,182,212,0.15)">
            <div ref={ref} className="text-center">
                <Icon className="w-6 h-6 text-cyan-400 mx-auto mb-3" />
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-1">
                    {numericPart ? `${prefix}${count.toLocaleString()}${suffix}` : value}
                </div>
                <div className="text-sm text-gray-500">{label}</div>
            </div>
        </GlowCard>
    );
};

/* ─────────── Infinite Marquee ─────────── */
const Marquee: React.FC = () => {
    const items = ['Attendance', 'Assignments', 'Grades', 'Schedule', 'Library', 'Finance', 'Chat', 'Analytics', 'Notifications', 'Reports', 'Sections', 'Courses'];
    return (
        <div className="relative overflow-hidden py-6 border-y border-white/[0.04]">
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#020617] to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#020617] to-transparent z-10" />
            <motion.div
                className="flex gap-8 whitespace-nowrap"
                animate={{ x: ['0%', '-50%'] }}
                transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            >
                {[...items, ...items].map((item, i) => (
                    <span key={i} className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                        {item}
                    </span>
                ))}
            </motion.div>
        </div>
    );
};

/* ─────────── FAQ Accordion ─────────── */
const FAQItem: React.FC<{ q: string; a: string; idx: number }> = ({ q, a, idx }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-40px' });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: idx * 0.08, duration: 0.5 }}
            className="border border-white/[0.06] rounded-xl overflow-hidden hover:border-white/[0.12] transition-colors"
        >
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
            >
                <span className="font-medium text-gray-200 pr-4">{q}</span>
                <motion.span
                    animate={{ rotate: open ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-gray-400 text-xl flex-shrink-0"
                >
                    +
                </motion.span>
            </button>
            <motion.div
                initial={false}
                animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
            >
                <p className="px-5 pb-5 text-sm text-gray-400 leading-relaxed">{a}</p>
            </motion.div>
        </motion.div>
    );
};

/* ════════════════════════════════════════════════════════════
   LANDING PAGE COMPONENT
   ════════════════════════════════════════════════════════════ */
export const LandingPage: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileNav, setMobileNav] = useState(false);
    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll();
    const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

    const typedText = useTypingEffect([
        'Attendance Tracking',
        'Grade Management',
        'Smart Scheduling',
        'Library Access',
        'Real-time Analytics',
        'Fee Management',
    ]);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden" style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}>
            <Particles />

            {/* ─── Gradient Mesh Background ─── */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[128px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[128px]" />
                <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-[128px] -translate-x-1/2 -translate-y-1/2" />
            </div>

            {/* ════════════ NAVBAR ════════════ */}
            <motion.nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
                    ? 'bg-[#020617]/90 backdrop-blur-xl border-b border-white/[0.06] shadow-2xl shadow-black/20'
                    : 'bg-transparent'
                    }`}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 sm:h-20">
                        {/* Logo */}
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                                <GraduationCap className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                EduConnect
                            </span>
                        </div>

                        {/* Desktop nav */}
                        <div className="hidden md:flex items-center gap-3">
                            <Link
                                to="/login"
                                className="px-5 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/[0.05]"
                            >
                                Login
                            </Link>
                            <Link
                                to="/request-verification"
                                className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 hover:scale-[1.03] active:scale-[0.98] inline-block"
                            >
                                Request Access
                            </Link>
                        </div>

                        {/* Mobile hamburger */}
                        <button className="md:hidden p-2 text-gray-300 hover:text-white" onClick={() => setMobileNav(!mobileNav)}>
                            {mobileNav ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile dropdown */}
                {mobileNav && (
                    <motion.div
                        className="md:hidden bg-[#0a0f1e]/95 backdrop-blur-xl border-t border-white/[0.06] px-4 pb-4"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <Link to="/login" onClick={() => setMobileNav(false)} className="block w-full py-3 text-left text-gray-300 hover:text-white">
                            Login
                        </Link>
                        <Link
                            to="/request-verification"
                            onClick={() => setMobileNav(false)}
                            className="block w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-center font-semibold"
                        >
                            Request Access
                        </Link>
                    </motion.div>
                )}
            </motion.nav>

            {/* ════════════ HERO SECTION ════════════ */}
            <motion.div
                ref={heroRef}
                style={{ opacity: heroOpacity, scale: heroScale }}
                className="relative z-10 min-h-screen flex items-center justify-center px-4"
            >
                <div className="text-center max-w-4xl mx-auto pt-20">
                    {/* Badge */}
                    <motion.div
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/[0.08] text-sm text-gray-400 mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        The Operating System for Modern Education
                    </motion.div>

                    {/* Main headline */}
                    <motion.h1
                        className="text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight mb-6"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                    >
                        <span className="bg-gradient-to-b from-white via-white to-gray-400 bg-clip-text text-transparent">
                            Education,{' '}
                        </span>
                        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                            Redefined
                        </span>
                    </motion.h1>

                    {/* Typing tagline */}
                    <motion.div
                        className="text-lg sm:text-xl md:text-2xl text-gray-400 mb-4 h-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        30+ Modules • 5 Portals • 1 Seamless Platform
                    </motion.div>

                    {/* Terminal typing */}
                    <motion.div
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0d1526]/80 border border-white/[0.08] text-sm sm:text-base font-mono mb-10"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                    >
                        <span className="text-green-400">›</span>
                        <span className="text-gray-300">Initializing</span>
                        <span className="text-cyan-400">{typedText}</span>
                        <span className="w-[2px] h-5 bg-cyan-400 animate-pulse" />
                    </motion.div>

                    {/* CTA Buttons */}
                    <motion.div
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                    >
                        <Link
                            to="/request-verification"
                            className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-semibold text-lg shadow-2xl shadow-blue-600/25 hover:shadow-blue-500/40 transition-all hover:scale-[1.04] active:scale-[0.97] flex items-center gap-2"
                        >
                            Request Access
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <button
                            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                            className="px-8 py-4 rounded-2xl border border-white/[0.12] hover:border-white/[0.25] text-gray-300 hover:text-white font-medium text-lg transition-all hover:bg-white/[0.04]"
                        >
                            Explore Features
                        </button>
                    </motion.div>

                    {/* Scroll indicator */}
                    <motion.div
                        className="mt-16 flex flex-col items-center gap-2 text-gray-500 text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5 }}
                    >
                        <span>Scroll to explore</span>
                        <motion.div
                            className="w-6 h-10 rounded-full border-2 border-gray-600 flex justify-center pt-2"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <motion.div
                                className="w-1.5 h-1.5 rounded-full bg-gray-400"
                                animate={{ y: [0, 16, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </motion.div>
                    </motion.div>
                </div>
            </motion.div>

            {/* ════════════ MARQUEE BANNER ════════════ */}
            <div className="relative z-10">
                <Marquee />
            </div>

            {/* ════════════ FEATURES SECTION ════════════ */}
            <div id="features" className="relative z-10 py-24 sm:py-32 px-4">
                <div className="max-w-7xl mx-auto">
                    <AnimatedSection className="text-center mb-16">
                        <p className="text-sm font-semibold text-blue-400 uppercase tracking-widest mb-3">Powerful Modules</p>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent mb-4">
                            Everything You Need
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            30+ integrated modules working together to streamline every aspect of educational management.
                        </p>
                    </AnimatedSection>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {features.map((f, i) => (
                            <GlowCard key={f.title} delay={i * 0.08} glowColor={`${f.color}30`}>
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                                    style={{ background: `${f.color}15` }}
                                >
                                    <f.icon className="w-6 h-6" style={{ color: f.color }} />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-1">{f.title}</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
                            </GlowCard>
                        ))}
                    </div>
                </div>
            </div>

            {/* ════════════ HOW IT WORKS ════════════ */}
            <div className="relative z-10 py-24 sm:py-32 px-4">
                <div className="max-w-5xl mx-auto">
                    <AnimatedSection className="text-center mb-16">
                        <p className="text-sm font-semibold text-green-400 uppercase tracking-widest mb-3">Simple Process</p>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent mb-4">
                            Up & Running in 3 Steps
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            From registration to full productivity in minutes, not weeks.
                        </p>
                    </AnimatedSection>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        {/* Connecting line */}
                        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-cyan-500/30" />
                        {howItWorks.map((step, i) => (
                            <GlowCard key={step.step} delay={i * 0.15} glowColor={`${step.color}25`}>
                                <div className="text-center">
                                    <div
                                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl font-bold"
                                        style={{ background: `${step.color}12`, color: step.color }}
                                    >
                                        {step.step}
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
                                </div>
                            </GlowCard>
                        ))}
                    </div>
                </div>
            </div>

            {/* ════════════ ROLE PORTALS SECTION ════════════ */}
            <div className="relative z-10 py-24 sm:py-32 px-4">
                <div className="max-w-7xl mx-auto">
                    <AnimatedSection className="text-center mb-16">
                        <p className="text-sm font-semibold text-purple-400 uppercase tracking-widest mb-3">Role-Based Access</p>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent mb-4">
                            Five Portals, One Platform
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            Tailored experiences for students, faculty, administrators, placement officers, and librarians — each with their own dashboard and tools.
                        </p>
                    </AnimatedSection>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        {roles.map((role, i) => (
                            <GlowCard key={role.title} delay={i * 0.15} glowColor={`${role.color}25`}>
                                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${role.gradient} opacity-50`} />
                                <div className="relative z-10 flex flex-col h-full">
                                    <div
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                                        style={{ background: `${role.color}15` }}
                                    >
                                        <role.icon className="w-7 h-7" style={{ color: role.color }} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-4">{role.title}</h3>
                                    <ul className="space-y-3 flex-1">
                                        {role.features.map((feat) => (
                                            <li key={feat} className="flex items-start gap-3 text-sm text-gray-300">
                                                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: role.color }} />
                                                <span>{feat}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link
                                        to={role.loginPath}
                                        className="mt-6 w-full py-3 rounded-xl border border-white/[0.1] hover:border-white/[0.2] text-sm font-medium text-gray-300 hover:text-white transition-all hover:bg-white/[0.04] flex items-center justify-center gap-2"
                                    >
                                        Explore Portal <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </GlowCard>
                        ))}
                    </div>
                </div>
            </div>

            {/* ════════════ DASHBOARD PREVIEW ════════════ */}
            <div className="relative z-10 py-24 sm:py-32 px-4">
                <div className="max-w-6xl mx-auto">
                    <AnimatedSection className="text-center mb-12">
                        <p className="text-sm font-semibold text-amber-400 uppercase tracking-widest mb-3">See It In Action</p>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent mb-4">
                            A Dashboard That Works for You
                        </h2>
                    </AnimatedSection>

                    <AnimatedSection delay={0.2}>
                        <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0a0f1e]/80 backdrop-blur-xl p-1">
                            {/* Browser chrome mockup */}
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                                </div>
                                <div className="flex-1 mx-4">
                                    <div className="bg-white/[0.05] rounded-lg px-4 py-1.5 text-xs text-gray-500 max-w-md mx-auto text-center">
                                        educonnect.app/dashboard
                                    </div>
                                </div>
                            </div>
                            {/* Dashboard content mockup */}
                            <div className="p-6 grid grid-cols-12 gap-4 min-h-[350px]">
                                {/* Sidebar mock */}
                                <div className="col-span-2 space-y-3 hidden sm:block">
                                    {['📊', '📝', '📅', '📚', '💬', '⚙️'].map((e, i) => (
                                        <div key={i} className={`p-2 rounded-lg text-center text-sm ${i === 0 ? 'bg-blue-500/20 border border-blue-500/30' : 'hover:bg-white/[0.03]'}`}>{e}</div>
                                    ))}
                                </div>
                                {/* Main area */}
                                <div className="col-span-12 sm:col-span-10 space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {[{ label: 'Attendance', val: '92%', c: 'text-green-400' }, { label: 'Assignments', val: '8/10', c: 'text-blue-400' }, { label: 'GPA', val: '3.7', c: 'text-purple-400' }, { label: 'Messages', val: '3 new', c: 'text-cyan-400' }].map((s) => (
                                            <div key={s.label} className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
                                                <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                                                <div className={`text-xl font-bold ${s.c}`}>{s.val}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Chart */}
                                    <div className="bg-white/[0.02] rounded-xl p-5 border border-white/[0.06] flex-1">
                                        <div className="text-sm text-gray-400 mb-3">Weekly Attendance Overview</div>
                                        <div className="flex items-end gap-2 h-32">
                                            {[65, 80, 72, 90, 85, 95, 88].map((h, i) => (
                                                <motion.div
                                                    key={i}
                                                    className="flex-1 rounded-t-md bg-gradient-to-t from-blue-600/60 to-blue-400/40"
                                                    initial={{ height: 0 }}
                                                    whileInView={{ height: `${h}%` }}
                                                    viewport={{ once: true }}
                                                    transition={{ delay: i * 0.08, duration: 0.6 }}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                                                <span key={d} className="flex-1 text-center text-[10px] text-gray-600">{d}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Glow behind preview */}
                        <div className="absolute -inset-4 -z-10 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-cyan-600/10 rounded-3xl blur-2xl" />
                    </AnimatedSection>
                </div>
            </div>

            {/* ════════════ TESTIMONIALS ════════════ */}
            <div className="relative z-10 py-24 sm:py-32 px-4">
                <div className="max-w-7xl mx-auto">
                    <AnimatedSection className="text-center mb-16">
                        <p className="text-sm font-semibold text-pink-400 uppercase tracking-widest mb-3">What People Say</p>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent mb-4">
                            Trusted by Educators
                        </h2>
                    </AnimatedSection>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {testimonials.map((t, i) => (
                            <GlowCard key={t.name} delay={i * 0.12} glowColor={`${t.color}20`}>
                                <div className="space-y-4">
                                    <p className="text-gray-300 leading-relaxed italic">"{t.quote}"</p>
                                    <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: `${t.color}20`, color: t.color }}>
                                            {t.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-white">{t.name}</div>
                                            <div className="text-xs text-gray-500">{t.role}</div>
                                        </div>
                                    </div>
                                </div>
                            </GlowCard>
                        ))}
                    </div>
                </div>
            </div>

            {/* ════════════ TECH & STATS SECTION ════════════ */}
            <div className="relative z-10 py-24 sm:py-32 px-4">
                <div className="max-w-7xl mx-auto">
                    <AnimatedSection className="text-center mb-16">
                        <p className="text-sm font-semibold text-cyan-400 uppercase tracking-widest mb-3">Built for Scale</p>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent mb-4">
                            Enterprise-Grade Performance
                        </h2>
                    </AnimatedSection>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-16">
                        {stats.map((s) => (
                            <AnimatedCounter key={s.label} value={s.value} label={s.label} icon={s.icon} />
                        ))}
                    </div>

                    {/* Tech Stack */}
                    <AnimatedSection delay={0.2}>
                        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
                            {techStack.map((tech) => (
                                <div key={tech.name} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                    <div className="w-3 h-3 rounded-full" style={{ background: tech.color }} />
                                    <span className="text-sm font-medium text-gray-300">{tech.name}</span>
                                </div>
                            ))}
                        </div>
                    </AnimatedSection>
                </div>
            </div>

            {/* ════════════ FAQ SECTION ════════════ */}
            <div className="relative z-10 py-24 sm:py-32 px-4">
                <div className="max-w-3xl mx-auto">
                    <AnimatedSection className="text-center mb-12">
                        <p className="text-sm font-semibold text-orange-400 uppercase tracking-widest mb-3">FAQ</p>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent mb-4">
                            Common Questions
                        </h2>
                    </AnimatedSection>

                    <div className="space-y-3">
                        {faqItems.map((item, i) => (
                            <FAQItem key={i} q={item.q} a={item.a} idx={i} />
                        ))}
                    </div>
                </div>
            </div>

            {/* ════════════ CTA + FOOTER ════════════ */}
            <div className="relative z-10 py-24 sm:py-32 px-4">
                <div className="max-w-4xl mx-auto">
                    <AnimatedSection className="text-center">
                        {/* CTA Card */}
                        <div className="relative rounded-3xl overflow-hidden">
                            {/* Gradient background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-cyan-600/20" />
                            <div className="absolute inset-0 bg-[#0a0f1e]/60 backdrop-blur-sm" />
                            <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20" style={{ zIndex: -1 }} />

                            <div className="relative px-8 py-16 sm:px-16 sm:py-20">
                                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                                    <span className="bg-gradient-to-r from-white via-white to-gray-300 bg-clip-text text-transparent">
                                        Ready to Transform
                                    </span>
                                    <br />
                                    <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                        Your Institution?
                                    </span>
                                </h2>
                                <p className="text-gray-400 text-lg mb-8 max-w-lg mx-auto">
                                    Join the future of educational management. It takes less than a minute to get started.
                                </p>
                                <div className="flex items-center justify-center">
                                    <Link
                                        to="/login"
                                        className="group px-10 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-semibold text-lg shadow-2xl shadow-blue-600/30 hover:shadow-blue-500/50 transition-all hover:scale-[1.04] active:scale-[0.97] flex items-center gap-2"
                                    >
                                        Login Now
                                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </AnimatedSection>
                </div>
            </div>

            {/* ─── Footer ─── */}
            <footer className="relative z-10 border-t border-white/[0.06] py-10 px-4">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <GraduationCap className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm text-gray-400">
                            © {new Date().getFullYear()} EduConnect. Built with ❤️
                        </span>
                    </div>
                    <div className="flex items-center gap-6">
                        <Link to="/login" className="text-sm text-gray-500 hover:text-white transition-colors">
                            Login
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
