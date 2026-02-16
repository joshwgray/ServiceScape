import { Router, Request, Response } from 'express';
import type { Pool } from 'pg';
import * as layoutService from '../services/layoutService.js';

export const layoutRouter = Router();

/**
 * GET /api/layout
 * Get layout positions for all domains, teams, and services
 * Returns cached layout if available, otherwise computes on demand
 */
layoutRouter.get('/', async (req: Request, res: Response) => {
  try {
    const pool: Pool = req.app.locals.pool;
    const layout = await layoutService.getLayout(pool);
    res.json(layout);
  } catch (error) {
    console.error('Error fetching layout:', error);
    res.status(500).json({ error: 'Failed to fetch layout' });
  }
});

/**
 * POST /api/layout/invalidate
 * Invalidate the layout cache
 */
layoutRouter.post('/invalidate', async (req: Request, res: Response) => {
  try {
    const pool: Pool = req.app.locals.pool;
    await layoutService.invalidateLayoutCache(pool);
    res.json({ message: 'Layout cache invalidated successfully' });
  } catch (error) {
    console.error('Error invalidating layout cache:', error);
    res.status(500).json({ error: 'Failed to invalidate layout cache' });
  }
});

/**
 * POST /api/layout/compute
 * Force recomputation of layout
 */
layoutRouter.post('/compute', async (req: Request, res: Response) => {
  try {
    const pool: Pool = req.app.locals.pool;
    const layout = await layoutService.computeLayout(pool);
    res.json(layout);
  } catch (error) {
    console.error('Error computing layout:', error);
    res.status(500).json({ error: 'Failed to compute layout' });
  }
});
