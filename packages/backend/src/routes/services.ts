import { Router, Request, Response } from 'express';
import type { Pool } from 'pg';
import * as organizationService from '../services/organizationService.js';
import * as serviceRepo from '../repositories/serviceRepository.js';

export const serviceRouter = Router({ mergeParams: true });

/**
 * GET /api/teams/:teamId/services
 * List all services for a team
 * OR
 * GET /api/services
 * List all services
 */
serviceRouter.get('/', async (req: Request, res: Response) => {
  try {
    const pool: Pool = req.app.locals.pool;
    const { teamId } = req.params;

    // If teamId is present, get services by team
    if (teamId) {
      const services = await organizationService.getServicesByTeam(pool, teamId);
      res.json(services);
      return;
    }

    // Otherwise return all services
    const allServices = await serviceRepo.getAllServices(pool);
    res.json(allServices);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

/**
 * GET /api/services/:id
 * Get single service by ID
 */
serviceRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const pool: Pool = req.app.locals.pool;
    const { id } = req.params;

    const service = await organizationService.getServiceById(pool, id);

    if (!service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    res.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});
