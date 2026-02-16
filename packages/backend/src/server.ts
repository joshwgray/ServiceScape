import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// API routes (placeholder)
const apiRouter = express.Router();

// Test route for error handling (development only)
if (process.env.NODE_ENV !== 'production') {
  apiRouter.get('/throw-error', (req: Request, res: Response) => {
    throw new Error('Test error');
  });
}

// Mount API router
app.use('/api', apiRouter);

// Error handler (must be last)
app.use(errorHandler);
