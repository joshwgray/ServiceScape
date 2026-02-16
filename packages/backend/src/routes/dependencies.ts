import { Router, Request, Response } from 'express';
import type { Pool } from 'pg';
import type { DependencyType } from '../db/schema.js';
import * as dependencyService from '../services/dependencyService.js';

export const dependencyRouter = Router({ mergeParams: true });

/**
 * GET /api/services/:serviceId/dependencies
 * Get all dependencies for a service (both upstream and downstream)
 */
dependencyRouter.get('/', async (req: Request, res: Response) => {
  try {
    const pool: Pool = req.app.locals.pool;
    const { serviceId } = req.params;
    const type = req.query.type as DependencyType | undefined;

    // Validate type parameter
    if (type !== undefined && type !== 'DECLARED' && type !== 'OBSERVED') {
      res.status(400).json({ error: 'Invalid type parameter. Must be DECLARED or OBSERVED' });
      return;
    }

    const dependencies = await dependencyService.getServiceDependencies(pool, serviceId, type);

    res.json(dependencies);
  } catch (error) {
    console.error('Error fetching dependencies:', error);
    res.status(500).json({ error: 'Failed to fetch dependencies' });
  }
});

/**
 * GET /api/services/:serviceId/dependencies/upstream
 * Get only upstream dependencies (services this service depends on)
 */
dependencyRouter.get('/upstream', async (req: Request, res: Response) => {
  try {
    const pool: Pool = req.app.locals.pool;
    const { serviceId } = req.params;
    const type = req.query.type as DependencyType | undefined;

    // Validate type parameter
    if (type !== undefined && type !== 'DECLARED' && type !== 'OBSERVED') {
      res.status(400).json({ error: 'Invalid type parameter. Must be DECLARED or OBSERVED' });
      return;
    }

    const dependencies = await dependencyService.getServiceDependencies(pool, serviceId, type);

    res.json(dependencies.upstream);
  } catch (error) {
    console.error('Error fetching upstream dependencies:', error);
    res.status(500).json({ error: 'Failed to fetch upstream dependencies' });
  }
});

/**
 * GET /api/services/:serviceId/dependencies/downstream
 * Get only downstream dependencies (services that depend on this service)
 */
dependencyRouter.get('/downstream', async (req: Request, res: Response) => {
  try {
    const pool: Pool = req.app.locals.pool;
    const { serviceId } = req.params;
    const type = req.query.type as DependencyType | undefined;

    // Validate type parameter
    if (type !== undefined && type !== 'DECLARED' && type !== 'OBSERVED') {
      res.status(400).json({ error: 'Invalid type parameter. Must be DECLARED or OBSERVED' });
      return;
    }

    const dependencies = await dependencyService.getServiceDependencies(pool, serviceId, type);

    res.json(dependencies.downstream);
  } catch (error) {
    console.error('Error fetching downstream dependencies:', error);
    res.status(500).json({ error: 'Failed to fetch downstream dependencies' });
  }
});
