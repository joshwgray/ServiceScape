import { Router, Request, Response } from 'express';
import type { Pool } from 'pg';
import * as organizationService from '../services/organizationService.js';

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
