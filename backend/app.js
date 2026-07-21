import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
// Import Route Handlers
import authRoutes from './src/routes/authRoutes.js';
import jobRoutes from './src/routes/jobRoutes.js';
import candidateRoutes from './src/routes/candidateRoutes.js';
import aiRoutes from './src/routes/aiRoutes.js';
import analyticsRoutes from './src/routes/analyticsRoutes.js';
import interviewRoutes from './src/routes/interviewRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';

// Import Error Middleware
import { errorHandler } from './src/middleware/errorMiddleware.js';

const app = express();

// security headers
app.use(helmet());

// CORS configuration
app.use(cors());

// Rate Limiter to guard endpoints from denial of service/abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', limiter);

// Request payload parser limits
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static('uploads'));

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    service: 'AI Recruitment Assistant Backend'
  });
});

// Root path fallback
app.get('/', (req, res) => {
  res.send('AI Recruitment Assistant Backend REST API is running.');
});

// Centralized error treatment
app.use(errorHandler);

export default app;
