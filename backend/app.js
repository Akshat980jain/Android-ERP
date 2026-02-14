
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { cacheMiddleware, getCacheStats, clearCache, clearAllCache } = require('./middleware/cache');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// ========== ROUTES ==========
const authRoutes = require('./routes/auth');
const coursesRouter = require('./routes/courses');
const academicRoutes = require('./routes/academic');
const attendanceRoutes = require('./routes/attendance');
const financeRoutes = require('./routes/finance');
const libraryRoutes = require('./routes/library');
const placementRoutes = require('./routes/placement');
const notificationRoutes = require('./routes/notifications');
const assignmentRoutes = require('./routes/assignments');
const eventRoutes = require('./routes/events');
const chatRoutes = require('./routes/chat');
const analyticsRoutes = require('./routes/analytics');
const servicesRoutes = require('./routes/services');
const transportRoutes = require('./routes/transport');
const studentsRoutes = require('./routes/students');
const scheduleRoutes = require('./routes/schedule');
const assessmentsRoutes = require('./routes/assessments');
const examsRoutes = require('./routes/exams');
const feedbackRoutes = require('./routes/feedback');
const calendarRoutes = require('./routes/calendar');
const reportsRoutes = require('./routes/reports');
const settingsRoutes = require('./routes/settings');
const leavesRoutes = require('./routes/leaves');
const hostelRoutes = require('./routes/hostel');
const parentRoutes = require('./routes/parents');
const emailRoutes = require('./routes/email');
const sectionsRoutes = require('./routes/sections');

// ========== SECURITY & PERFORMANCE MIDDLEWARE ==========
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

// CORS configuration (supports multiple origins and wildcard)
const configuredOrigins = (process.env.CORS_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173,http://192.168.1.13:5000,http://192.168.1.13:3000')
  .split(',')
  .map((s) => s.trim());

const corsOptions = {
  origin: (origin, callback) => {
    console.log('CORS request from origin:', origin); // Log incoming origin
    // Allow non-browser requests or same-origin
    if (!origin) return callback(null, true);
    if (configuredOrigins.includes('*') || configuredOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Allow localhost on any port for development (Metro bundler, etc.)
    if (origin && origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    // Allow any 192.168.* LAN IP for local development (Android emulator/device)
    if (origin && /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    // Allow 10.0.2.2 for Android emulator
    if (origin && origin.startsWith('http://10.0.2.2:')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Disposition'],
  optionsSuccessStatus: 204,
  preflightContinue: false
};
app.use(cors(corsOptions));
// Explicitly handle preflight OPTIONS requests for all routes
app.options('*', cors(corsOptions));

// Rate limiting - move AFTER CORS so 429 responses include CORS headers
const limitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const limitMax = Number(process.env.RATE_LIMIT_MAX || (process.env.NODE_ENV === 'production' ? 100 : 1000));
const limiter = rateLimit({
  windowMs: limitWindowMs,
  max: limitMax,
  standardHeaders: true,
  legacyHeaders: false,
  // Do not rate-limit preflight requests
  skip: (req) => req.method === 'OPTIONS',
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  }
});
app.use('/api/', limiter);

// Trust proxy (useful when deploying behind reverse proxies)
app.set('trust proxy', 1);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ========== DATABASE CONNECTION ==========
// Optimized connection with connection pooling for better scalability
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://akshat980jain:zm3aHd1m1a4pxU7q@cluster0.nkrpubg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  maxPoolSize: 50,              // Maximum number of connections in the pool
  minPoolSize: 10,              // Minimum number of connections to maintain
  serverSelectionTimeoutMS: 5000, // Timeout for server selection
  socketTimeoutMS: 45000,       // Socket timeout
  family: 4                     // Use IPv4, skip trying IPv6
})
  .then(() => {
    console.log('✅ Connected to MongoDB with optimized connection pool');
    console.log(`📊 Pool size: 10-50 connections`);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// ========== API ROUTES ==========
// Root endpoint for basic connectivity test
// Root endpoint for basic connectivity test
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'EduConnect Backend Server',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Backend is running!', timestamp: new Date().toISOString() });
});

// Cache statistics endpoint (admin only in production)
app.get('/api/cache/stats', (req, res) => {
  const stats = getCacheStats();
  res.json({ success: true, cache: stats });
});

// Clear cache endpoint (admin only in production)
app.post('/api/cache/clear', (req, res) => {
  const { pattern } = req.body;
  const cleared = pattern ? clearCache(pattern) : clearAllCache();
  res.json({ success: true, message: `Cleared ${cleared} cache entries`, pattern: pattern || 'all' });
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRouter);
app.use('/api/academic', academicRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/placement', placementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/assessments', assessmentsRoutes);
app.use('/api/exams', examsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/leaves', leavesRoutes);
app.use('/api/hostel', hostelRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/sections', sectionsRoutes);

// ========== SERVER START ==========
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

// ========== SOCKET.IO SETUP ==========
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: (process.env.CORS_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173,http://192.168.1.13:5000,http://192.168.1.13:3000')
      .split(',')
      .map((s) => s.trim())
      .includes('*')
      ? '*'
      : (process.env.CORS_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173,http://192.168.1.13:5000,http://192.168.1.13:3000')
        .split(',')
        .map((s) => s.trim()),
    methods: ['GET', 'POST']
  },
  // Performance optimizations for Socket.IO
  pingTimeout: 60000,        // 60 seconds - how long to wait for pong
  pingInterval: 25000,       // 25 seconds - how often to send ping
  upgradeTimeout: 10000,     // 10 seconds - time to wait for upgrade
  maxHttpBufferSize: 1e6,    // 1MB - max message size
  transports: ['websocket', 'polling'], // Prefer websocket
  allowEIO3: true,           // Allow Engine.IO v3 clients
  // Ready for horizontal scaling with Redis adapter (uncomment when needed)
  // adapter: require('socket.io-redis')({ host: 'localhost', port: 6379 })
});

// Cron: generate reminders daily at 08:00 server time
try {
  const cron = require('node-cron');
  const Notification = require('./models/Notification');
  const Fee = require('./models/Fee');
  const Assignment = require('./models/Assignment');
  const Attendance = require('./models/Attendance');
  const User = require('./models/User');
  const { authorize } = require('./middleware/auth');

  // Lightweight inline scheduler that mimics the logic in /notifications/generate-reminders
  cron.schedule('0 8 * * *', async () => {
    try {
      const now = new Date();
      const inDays = (n) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);
      const sevenDays = inDays(7);
      const threeDays = inDays(3);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Fees
      const pendingFees = await Fee.find({ status: { $in: ['pending', 'overdue'] }, dueDate: { $lte: sevenDays } }).populate('student', '_id');
      for (const fee of pendingFees) {
        if (!fee.student) continue;
        const recent = await Notification.findOne({ category: 'finance', 'targetUsers': fee.student._id, title: { $regex: new RegExp(`${fee.type}`, 'i') }, createdAt: { $gte: inDays(-1) } });
        if (recent) continue;
        const doc = await Notification.create({
          title: `Fee ${fee.status === 'overdue' ? 'overdue' : 'due soon'}: ${fee.type}`,
          message: `Amount ₹${fee.amount} ${fee.status === 'overdue' ? 'is overdue' : 'is due by ' + fee.dueDate.toLocaleDateString()}.`,
          type: fee.status === 'overdue' ? 'warning' : 'info',
          category: 'finance',
          targetUsers: [fee.student._id],
          createdBy: fee.student._id,
        });
        try { if (global.io) global.io.to(String(fee.student._id)).emit('notification', { _id: doc._id, title: doc.title, message: doc.message, type: doc.type, category: doc.category, createdAt: doc.createdAt, targetRoles: doc.targetRoles, read: false }); } catch { }
      }

      // Assignments
      const upcomingAssignments = await Assignment.find({ dueDate: { $gte: now, $lte: threeDays }, status: { $in: ['published'] } }).select('title dueDate');
      if (upcomingAssignments.length > 0) {
        const recent = await Notification.findOne({ category: 'academic', title: /Assignments due soon/i, createdAt: { $gte: inDays(-1) } });
        if (!recent) {
          const doc = await Notification.create({ title: 'Assignments due soon', message: `${upcomingAssignments.length} assignment(s) due within 3 days. Please review and submit on time.`, type: 'info', category: 'academic', targetRoles: ['student'], createdBy: null });
          try { if (global.io) global.io.emit('notification', { _id: doc._id, title: doc.title, message: doc.message, type: doc.type, category: doc.category, createdAt: doc.createdAt, targetRoles: doc.targetRoles, read: false }); } catch { }
        }
      }

      // Attendance
      const pipeline = [
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { student: '$student' }, total: { $sum: 1 }, presents: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } } } },
        { $addFields: { percentage: { $multiply: [{ $divide: ['$presents', '$total'] }, 100] } } },
        { $match: { percentage: { $lt: 75 } } }
      ];
      const lowAttendance = await Attendance.aggregate(pipeline);
      for (const a of lowAttendance) {
        const sid = a._id.student;
        const recent = await Notification.findOne({ category: 'academic', 'targetUsers': sid, title: /Low attendance alert/i, createdAt: { $gte: inDays(-1) } });
        if (recent) continue;
        const doc = await Notification.create({ title: 'Low attendance alert', message: 'Your attendance in the last 30 days is below 75%. Please improve attendance.', type: 'warning', category: 'academic', targetUsers: [sid], createdBy: sid });
        try { if (global.io) global.io.to(String(sid)).emit('notification', { _id: doc._id, title: doc.title, message: doc.message, type: doc.type, category: doc.category, createdAt: doc.createdAt, targetRoles: doc.targetRoles, read: false }); } catch { }
      }
      console.log('Daily reminders generated');
    } catch (e) {
      console.error('Cron reminder generation failed:', e);
    }
  });
} catch (e) {
  console.warn('Cron not initialized:', e?.message);
}
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io available globally
global.io = io;

module.exports = app;
