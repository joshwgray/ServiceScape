import { Router, Request, Response } from 'express';
import type { Pool } from 'pg';
import type { DependencyType } from '../db/schema.js';
import * as organizationService from '../services/organizationService.js';
import * as dependencyService from '../services/dependencyService.js';

export const teamRouter = Router({ mergeParams: true });

/**
 * GET /api/domains/:domainId/teams
 * List all teams for a domain
 */
teamRouter.get('/', async (req: Request, res: Response) => {
  try {
    const pool: Pool = req.app.locals.pool;
    const { domainId } = req.params;

    // If domainId is present, get teams by domain
    if (domainId) {
      const teams = await organizationService.getTeamsByDomain(pool, domainId);
      res.json(teams);
      return;
    }

    // Otherwise return empty array (or could implement getAll if needed)
    res.json([]);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

/**
 * GET /api/teams/:id
 * Get single team by ID
 */
teamRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const pool: Pool = req.app.locals.pool;
    const { id } = req.params;

    const team = await organizationService.getTeamById(pool, id);

    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    res.json(team);
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

/**
 * GET /api/teams/:id/dependencies
 * Get dependencies for a team (aggregated from all services in the team)
 */
teamRouter.get('/:id/dependencies', async (req: Request, res: Response) => {
  try {
    const pool: Pool = req.app.locals.pool;
    const { id } = req.params;
    const type = req.query.type as DependencyType | undefined;

    // Validate type parameter
    if (type !== undefined && type !== 'DECLARED' && type !== 'OBSERVED') {
      res.status(400).json({ error: 'Invalid type parameter. Must be DECLARED or OBSERVED' });
      return;
    }

    const dependencies = await dependencyService.getTeamDependencies(pool, id, type);
    res.json(dependencies);
  } catch (error) {
    console.error('Error fetching team dependencies:', error);
    res.status(500).json({ error: 'Failed to fetch team dependencies' });
  }
});
