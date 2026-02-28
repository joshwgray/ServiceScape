import { Router, Request, Response } from 'express';
import type { Pool } from 'pg';
import {
  graphAnalyticsService,
  type GraphDependencyFilter,
} from '../services/graphAnalyticsService.js';

export const analyticsRouter = Router();
export const serviceAnalyticsRouter = Router({ mergeParams: true });
export const domainAnalyticsRouter = Router({ mergeParams: true });

function parseDependencyType(type: string | undefined): GraphDependencyFilter | null {
  if (!type) {
    return 'ALL';
  }

  if (type === 'ALL' || type === 'DECLARED' || type === 'OBSERVED') {
    return type as GraphDependencyFilter;
  }

  return null;
}

function parseRefresh(refresh: string | undefined): boolean {
  return refresh === 'true';
}

/**
 * GET /api/analytics/metrics
 * Returns normalized graph centrality metrics.
 */
analyticsRouter.get('/metrics', async (req: Request, res: Response) => {
  try {
    const pool: Pool = req.app.locals.pool;
    const type = parseDependencyType(req.query.type as string | undefined);
    const refresh = parseRefresh(req.query.refresh as string | undefined);

    if (!type) {
      res.status(400).json({ error: 'Invalid type parameter. Must be ALL, DECLARED, or OBSERVED' });
      return;
    }

    const metrics = await graphAnalyticsService.getMetrics(pool, { type, refresh });
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching graph metrics:', error);
    res.status(500).json({ error: 'Failed to fetch graph metrics' });
  }
});

/**
 * GET /api/analytics/god-services
 * Returns services matching God Service detection criteria.
 */
analyticsRouter.get('/god-services', async (req: Request, res: Response) => {
  try {
    const pool: Pool = req.app.locals.pool;
    const type = parseDependencyType(req.query.type as string | undefined);
    const refresh = parseRefresh(req.query.refresh as string | undefined);

    if (!type) {
      res.status(400).json({ error: 'Invalid type parameter. Must be ALL, DECLARED, or OBSERVED' });
      return;
    }

    const godServices = await graphAnalyticsService.getGodServices(pool, { type, refresh });
    res.json(godServices);
  } catch (error) {
    console.error('Error fetching God Services:', error);
    res.status(500).json({ error: 'Failed to fetch God Services' });
  }
});

/**
 * GET /api/analytics/domain-health
 * Returns health scores for all domains.
 */
analyticsRouter.get('/domain-health', async (req: Request, res: Response) => {
  try {
    const pool: Pool = req.app.locals.pool;
    const type = parseDependencyType(req.query.type as string | undefined);
    const refresh = parseRefresh(req.query.refresh as string | undefined);

    if (!type) {
      res.status(400).json({ error: 'Invalid type parameter. Must be ALL, DECLARED, or OBSERVED' });
      return;
    }

    const domainHealth = await graphAnalyticsService.getDomainHealthScores(pool, { type, refresh });
    res.json(domainHealth);
  } catch (error) {
    console.error('Error fetching domain health:', error);
    res.status(500).json({ error: 'Failed to fetch domain health' });
  }
});

/**
 * POST /api/analytics/impact-analysis
 * Returns pre-change impact analysis for a service.
 */
analyticsRouter.post('/impact-analysis', async (req: Request, res: Response) => {
  try {
    const pool: Pool = req.app.locals.pool;
    const { serviceId, changeType } = req.body as {
      serviceId?: string;
      changeType?: string;
    };
    const type = parseDependencyType(req.query.type as string | undefined);

    if (!serviceId) {
      res.status(400).json({ error: 'serviceId is required' });
      return;
    }

    if (!type) {
      res.status(400).json({ error: 'Invalid type parameter. Must be ALL, DECLARED, or OBSERVED' });
      return;
    }

    const impactAnalysis = await graphAnalyticsService.analyzeChangeImpact(pool, serviceId, {
      type,
      changeType,
    });
    res.json(impactAnalysis);
  } catch (error) {
    console.error('Error running impact analysis:', error);
    res.status(500).json({ error: 'Failed to run impact analysis' });
  }
});

/**
 * GET /api/services/:serviceId/blast-radius
 * Returns blast radius for a service.
 */
serviceAnalyticsRouter.get('/:serviceId/blast-radius', async (req: Request, res: Response) => {
  try {
    const pool: Pool = req.app.locals.pool;
    const { serviceId } = req.params;
    const type = parseDependencyType(req.query.type as string | undefined);
    const refresh = parseRefresh(req.query.refresh as string | undefined);

    if (!type) {
      res.status(400).json({ error: 'Invalid type parameter. Must be ALL, DECLARED, or OBSERVED' });
      return;
    }

    const blastRadius = await graphAnalyticsService.getBlastRadius(pool, serviceId, { type, refresh });
    res.json(blastRadius);
  } catch (error) {
    console.error('Error fetching blast radius:', error);
    res.status(500).json({ error: 'Failed to fetch blast radius' });
  }
});

/**
 * GET /api/domains/:domainId/health
 * Returns health score for a single domain.
 */
domainAnalyticsRouter.get('/:domainId/health', async (req: Request, res: Response) => {
  try {
    const pool: Pool = req.app.locals.pool;
    const { domainId } = req.params;
    const type = parseDependencyType(req.query.type as string | undefined);
    const refresh = parseRefresh(req.query.refresh as string | undefined);

    if (!type) {
      res.status(400).json({ error: 'Invalid type parameter. Must be ALL, DECLARED, or OBSERVED' });
      return;
    }

    const domainHealth = await graphAnalyticsService.getDomainHealthById(pool, domainId, { type, refresh });
    if (!domainHealth) {
      res.status(404).json({ error: 'Domain health not found' });
      return;
    }

    res.json(domainHealth);
  } catch (error) {
    console.error('Error fetching domain health by id:', error);
    res.status(500).json({ error: 'Failed to fetch domain health' });
  }
});
