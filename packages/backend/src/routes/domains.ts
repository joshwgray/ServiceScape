import { Router, Request, Response } from 'express';
import type { Pool } from 'pg';
import type { DependencyType } from '../db/schema.js';
import * as organizationService from '../services/organizationService.js';
import * as dependencyService from '../services/dependencyService.js';

export const domainRouter = Router();

/**
 * GET /api/domains
 * List all domains
 */
domainRouter.get('/', async (req: Request, res: Response) => {
  try {
    const pool: Pool = req.app.locals.pool;
    const domains = await organizationService.getDomains(pool);
    res.json(domains);
  } catch (error) {
    console.error('Error fetching domains:', error);
    res.status(500).json({ error: 'Failed to fetch domains' });
  }
});

/**
 * GET /api/domains/:id/dependencies
 * Get dependencies for a domain (aggregated from all teams in the domain)
 */
domainRouter.get('/:id/dependencies', async (req: Request, res: Response) => {
  try {
    const pool: Pool = req.app.locals.pool;
    const { id } = req.params;
    const type = req.query.type as DependencyType | undefined;

    // Validate type parameter
    if (type !== undefined && type !== 'DECLARED' && type !== 'OBSERVED') {
      res.status(400).json({ error: 'Invalid type parameter. Must be DECLARED or OBSERVED' });
      return;
    }

    const dependencies = await dependencyService.getDomainDependencies(pool, id, type);
    res.json(dependencies);
  } catch (error) {
    console.error('Error fetching domain dependencies:', error);
    res.status(500).json({ error: 'Failed to fetch domain dependencies' });
  }
});

/**
 * GET /api/domains/:id
 * Get single domain by ID
 */
domainRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const pool: Pool = req.app.locals.pool;
    const { id } = req.params;

    const domain = await organizationService.getDomainById(pool, id);

    if (!domain) {
      res.status(404).json({ error: 'Domain not found' });
      return;
    }

    res.json(domain);
  } catch (error) {
    console.error('Error fetching domain:', error);
    res.status(500).json({ error: 'Failed to fetch domain' });
  }
});
