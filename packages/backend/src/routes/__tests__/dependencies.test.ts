import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { dependencyRouter } from '../dependencies.js';
import * as dependencyService from '../../services/dependencyService.js';
import type { Pool } from 'pg';

vi.mock('../../services/dependencyService.js');

describe('Dependency Routes', () => {
  let app: Express;
  let mockPool: Pool;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPool = {} as Pool;

    app = express();
    app.use(express.json());
    app.locals.pool = mockPool;
    app.use('/api/services/:serviceId/dependencies', dependencyRouter);
  });

  describe('GET /api/services/:serviceId/dependencies', () => {
    it('should return 200 with dependencies', async () => {
      const now = new Date();
      const mockDeps = {
        upstream: [
          {
            id: 'dep-1',
            fromServiceId: 'service-2',
            toServiceId: 'service-1',
            type: 'DECLARED' as const,
            metadata: {},
            createdAt: now,
            updatedAt: now,
          },
        ],
        downstream: [
          {
            id: 'dep-2',
            fromServiceId: 'service-1',
            toServiceId: 'service-3',
            type: 'OBSERVED' as const,
            metadata: {},
            createdAt: now,
            updatedAt: now,
          },
        ],
      };

      vi.mocked(dependencyService.getServiceDependencies).mockResolvedValue(mockDeps);

      const response = await request(app).get('/api/services/service-1/dependencies');

      expect(response.status).toBe(200);
      expect(response.body.upstream).toHaveLength(1);
      expect(response.body.downstream).toHaveLength(1);
      expect(response.body.upstream[0].id).toBe('dep-1');
      expect(response.body.upstream[0].fromServiceId).toBe('service-2');
      expect(response.body.upstream[0].toServiceId).toBe('service-1');
      expect(response.body.upstream[0]).not.toHaveProperty('from_service_id');
      expect(response.body.upstream[0]).not.toHaveProperty('to_service_id');
      expect(response.body.downstream[0].id).toBe('dep-2');
      expect(response.body.downstream[0].fromServiceId).toBe('service-1');
      expect(response.body.downstream[0].toServiceId).toBe('service-3');
      expect(dependencyService.getServiceDependencies).toHaveBeenCalledWith(
        mockPool,
        'service-1',
        undefined
      );
    });

    it('should filter by type when query parameter is provided', async () => {
      const now = new Date();
      const mockDeps = {
        upstream: [],
        downstream: [
          {
            id: 'dep-1',
            fromServiceId: 'service-1',
            toServiceId: 'service-2',
            type: 'DECLARED' as const,
            metadata: {},
            createdAt: now,
            updatedAt: now,
          },
        ],
      };

      vi.mocked(dependencyService.getServiceDependencies).mockResolvedValue(mockDeps);

      const response = await request(app).get(
        '/api/services/service-1/dependencies?type=DECLARED'
      );

      expect(response.status).toBe(200);
      expect(response.body.downstream).toHaveLength(1);
      expect(response.body.downstream[0].type).toBe('DECLARED');
      expect(dependencyService.getServiceDependencies).toHaveBeenCalledWith(
        mockPool,
        'service-1',
        'DECLARED'
      );
    });

    it('should return 500 on error', async () => {
      vi.mocked(dependencyService.getServiceDependencies).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).get('/api/services/service-1/dependencies');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid type parameter', async () => {
      const response = await request(app).get(
        '/api/services/service-1/dependencies?type=INVALID'
      );

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid type parameter');
    });
  });

  describe('GET /api/services/:serviceId/dependencies/upstream', () => {
    it('should return only upstream dependencies', async () => {
      const now = new Date();
      const mockDeps = {
        upstream: [
          {
            id: 'dep-1',
            fromServiceId: 'service-2',
            toServiceId: 'service-1',
            type: 'DECLARED' as const,
            metadata: {},
            createdAt: now,
            updatedAt: now,
          },
        ],
        downstream: [],
      };

      vi.mocked(dependencyService.getServiceDependencies).mockResolvedValue(mockDeps);

      const response = await request(app).get(
        '/api/services/service-1/dependencies/upstream'
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe('dep-1');
    });

    it('should return 400 for invalid type parameter', async () => {
      const response = await request(app).get(
        '/api/services/service-1/dependencies/upstream?type=INVALID'
      );

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid type parameter');
    });
  });

  describe('GET /api/services/:serviceId/dependencies/downstream', () => {
    it('should return only downstream dependencies', async () => {
      const now = new Date();
      const mockDeps = {
        upstream: [],
        downstream: [
          {
            id: 'dep-2',
            fromServiceId: 'service-1',
            toServiceId: 'service-3',
            type: 'OBSERVED' as const,
            metadata: {},
            createdAt: now,
            updatedAt: now,
          },
        ],
      };

      vi.mocked(dependencyService.getServiceDependencies).mockResolvedValue(mockDeps);

      const response = await request(app).get(
        '/api/services/service-1/dependencies/downstream'
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe('dep-2');
    });

    it('should return 400 for invalid type parameter', async () => {
      const response = await request(app).get(
        '/api/services/service-1/dependencies/downstream?type=INVALID'
      );

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid type parameter');
    });
  });
});
