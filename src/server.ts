import dotenv from 'dotenv';
dotenv.config();

import express, { Express } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import { connectDatabase } from './config/database';
import cookieParser from 'cookie-parser';
import { initializeSocketServer } from './services/socketService';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/authRoutes';
import roomRoutes from './routes/roomRoutes';

const app: Express = express();
const server = createServer(app);

// Initialize Socket.IO
const io = initializeSocketServer(server);

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Error handlers 
app.use(notFoundHandler);
app.use(errorHandler);

// Connect to database and start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDatabase();
    
    server.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║   🚀 Callify Backend Server Started   ║
╠════════════════════════════════════════╣
║   Port: ${PORT}                       
║   Environment: ${process.env.NODE_ENV || 'development'}
║   Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3000'}
╚════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { app, io };

