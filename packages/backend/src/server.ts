import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { domainRouter } from './routes/domains.js';
import { teamRouter } from './routes/teams.js';
import { serviceRouter } from './routes/services.js';
import { dependencyRouter } from './routes/dependencies.js';
import { layoutRouter } from './routes/layout.js';

export const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// API routes
const apiRouter = express.Router();

// API Health check endpoint
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Test route for error handling (development only)
if (process.env.NODE_ENV !== 'production') {
  apiRouter.get('/throw-error', (_req: Request, _res: Response) => {
    throw new Error('Test error');
  });
}

// Organization routes
apiRouter.use('/domains', domainRouter);
apiRouter.use('/domains/:domainId/teams', teamRouter);
apiRouter.use('/teams', teamRouter);
apiRouter.use('/teams/:teamId/services', serviceRouter);
apiRouter.use('/services', serviceRouter);

// Dependency routes
apiRouter.use('/services/:serviceId/dependencies', dependencyRouter);

// Layout routes
apiRouter.use('/layout', layoutRouter);

// Mount API router
app.use('/api', apiRouter);

// Error handler (must be last)
app.use(errorHandler);
