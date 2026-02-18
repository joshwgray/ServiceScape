import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { Router } from 'express';
import type { Pool } from 'pg';
import * as dependencyService from '../../services/dependencyService.js';

vi.mock('../../services/dependencyService.js');

// Create a minimal domain router for testing
const domainDependencyRouter = Router({ mergeParams: true });

domainDependencyRouter.get('/dependencies', async (req, res) => {
  try {
    const pool: Pool = req.app.locals.pool;
    const { domainId } = req.params as { domainId: string };
    const type = req.query.type as 'DECLARED' | 'OBSERVED' | undefined;

    // Validate type parameter
    if (type !== undefined && type !== 'DECLARED' && type !== 'OBSERVED') {
      res.status(400).json({ error: 'Invalid type parameter. Must be DECLARED or OBSERVED' });
      return;
    }

    const dependencies = await dependencyService.getDomainDependencies(pool, domainId, type);
    res.json(dependencies);
  } catch (error) {
    console.error('Error fetching domain dependencies:', error);
    res.status(500).json({ error: 'Failed to fetch domain dependencies' });
  }
});

describe('Domain Dependency Routes', () => {
  let app: Express;
  let mockPool: Pool;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPool = {} as Pool;

    app = express();
    app.use(express.json());
    app.locals.pool = mockPool;
    app.use('/api/domains/:domainId', domainDependencyRouter);
  });

  describe('GET /api/domains/:domainId/dependencies', () => {
    it('should return 200 with domain dependencies', async () => {
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

      vi.mocked(dependencyService.getDomainDependencies).mockResolvedValue(mockDeps);

      const response = await request(app).get('/api/domains/domain-1/dependencies');

      expect(response.status).toBe(200);
      expect(response.body.upstream).toHaveLength(1);
      expect(response.body.downstream).toHaveLength(1);
      expect(dependencyService.getDomainDependencies).toHaveBeenCalledWith(
        mockPool,
        'domain-1',
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

      vi.mocked(dependencyService.getDomainDependencies).mockResolvedValue(mockDeps);

      const response = await request(app).get(
        '/api/domains/domain-1/dependencies?type=DECLARED'
      );

      expect(response.status).toBe(200);
      expect(response.body.downstream).toHaveLength(1);
      expect(dependencyService.getDomainDependencies).toHaveBeenCalledWith(
        mockPool,
        'domain-1',
        'DECLARED'
      );
    });

    it('should return 400 for invalid type parameter', async () => {
      const response = await request(app).get(
        '/api/domains/domain-1/dependencies?type=INVALID'
      );

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid type parameter');
    });

    it('should return 500 on error', async () => {
      vi.mocked(dependencyService.getDomainDependencies).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).get('/api/domains/domain-1/dependencies');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
});
