import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './db/init.js';
import { setSandboxMode } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import analysisRoutes from './routes/analysisRoutes.js';
import copilotRoutes from './routes/copilotRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS with dynamic localhost support for development port shifts
const allowedOrigins = [process.env.CLIENT_URL || 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    // Check if origin matches allowed list or is any localhost port
    const isLocalhost = /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);
    if (allowedOrigins.includes(origin) || isLocalhost) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Parse incoming requests with JSON payloads
app.use(express.json());

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/copilot', copilotRoutes);

// Standard API health endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'HireLens AI API Server is initialized and running',
    timestamp: new Date().toISOString()
  });
});

// Global error handler middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[server-error]:', err.stack || err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// Initialize database schema and start server
const startServer = async () => {
  try {
    // Run schema creation if tables don't exist
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`⚡️ [server]: HireLens AI Backend API is active at http://localhost:${PORT}`);
    });
  } catch (error: any) {
    setSandboxMode(true);
    console.warn('⚠️ [server-warning]: Failed to initialize database on boot, running in Sandbox Mode:', error.message || error);
    app.listen(PORT, () => {
      console.log(`⚡️ [server]: HireLens AI Backend API is active in Sandbox Mode at http://localhost:${PORT}`);
    });
  }
};

startServer();
