import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { serviceRouter } from '../services.js';
import * as organizationService from '../../services/organizationService.js';
import type { Pool } from 'pg';

vi.mock('../../services/organizationService.js');

describe('Service Routes', () => {
  let app: Express;
  let mockPool: Pool;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPool = {} as Pool;

    app = express();
    app.use(express.json());
    app.locals.pool = mockPool;
    // Mount service routes at both paths
    app.use('/api/teams/:teamId/services', serviceRouter);
    app.use('/api/services', serviceRouter);
  });

  describe('GET /api/teams/:teamId/services', () => {
    it('should return 200 with services array', async () => {
      const mockServices = [
        {
          id: 'service-1',
          teamId: 'team-1',
          name: 'API Service',
          type: 'REST',
          tier: 'T1',
          metadata: {},
          upstreamCount: 2,
          downstreamCount: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'service-2',
          teamId: 'team-1',
          name: 'Database Service',
          type: 'PostgreSQL',
          tier: 'T1',
          metadata: {},
          upstreamCount: 0,
          downstreamCount: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(organizationService.getServicesByTeam).mockResolvedValue(mockServices);

      const response = await request(app).get('/api/teams/team-1/services');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('API Service');
      expect(response.body[0].teamId).toBe('team-1');
      expect(response.body[0]).not.toHaveProperty('team_id');
      expect(response.body[0].upstreamCount).toBe(2);
      expect(organizationService.getServicesByTeam).toHaveBeenCalledWith(mockPool, 'team-1');
    });

    it('should return 200 with empty array when team has no services', async () => {
      vi.mocked(organizationService.getServicesByTeam).mockResolvedValue([]);

      const response = await request(app).get('/api/teams/team-1/services');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(organizationService.getServicesByTeam).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).get('/api/teams/team-1/services');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/services/:id', () => {
    it('should return 200 with service when found', async () => {
      const mockService = {
        id: 'service-1',
        teamId: 'team-1',
        name: 'API',
        type: 'REST',
        tier: 'T1',
        metadata: { version: '1.0.0' },
        upstreamCount: 2,
        downstreamCount: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(organizationService.getServiceById).mockResolvedValue(mockService);

      const response = await request(app).get('/api/services/service-1');

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('API');
      expect(response.body.upstreamCount).toBe(2);
      expect(response.body.downstreamCount).toBe(3);
      expect(organizationService.getServiceById).toHaveBeenCalledWith(mockPool, 'service-1');
    });

    it('should return 404 when service not found', async () => {
      vi.mocked(organizationService.getServiceById).mockResolvedValue(null);

      const response = await request(app).get('/api/services/non-existent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(organizationService.getServiceById).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).get('/api/services/service-1');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/services', () => {
    it('should return all services in camelCase', async () => {
      const mockServices = [
        {
          id: 'service-1',
          teamId: 'team-1',
          name: 'API Service',
          type: 'REST',
          tier: 'T1',
          metadata: {},
          upstreamCount: 2,
          downstreamCount: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'service-2',
          teamId: 'team-2',
          name: 'Auth Service',
          type: 'gRPC',
          tier: 'T2',
          metadata: {},
          upstreamCount: 1,
          downstreamCount: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(organizationService.getAllServices).mockResolvedValue(mockServices);

      const response = await request(app).get('/api/services');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('API Service');
      expect(response.body[0].teamId).toBe('team-1');
      expect(response.body[0]).not.toHaveProperty('team_id');
      expect(response.body[0]).not.toHaveProperty('created_at');
      expect(response.body[0]).not.toHaveProperty('updated_at');
      expect(response.body[0]).toHaveProperty('createdAt');
      expect(response.body[0]).toHaveProperty('updatedAt');
      expect(response.body[0].upstreamCount).toBe(2);
      expect(response.body[0].downstreamCount).toBe(3);
      expect(organizationService.getAllServices).toHaveBeenCalledWith(mockPool);
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(organizationService.getAllServices).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/services');

      expect(response.status).toBe(500);
    });
  });
});
