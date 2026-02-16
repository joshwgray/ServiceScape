import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { Router } from 'express';
import type { Pool } from 'pg';
import * as dependencyService from '../../services/dependencyService.js';

vi.mock('../../services/dependencyService.js');

// Create a minimal team router for testing
const teamDependencyRouter = Router({ mergeParams: true });

teamDependencyRouter.get('/dependencies', async (req, res) => {
  try {
    const pool: Pool = req.app.locals.pool;
    const { teamId } = req.params;
    const type = req.query.type as 'DECLARED' | 'OBSERVED' | undefined;

    // Validate type parameter
    if (type !== undefined && type !== 'DECLARED' && type !== 'OBSERVED') {
      res.status(400).json({ error: 'Invalid type parameter. Must be DECLARED or OBSERVED' });
      return;
    }

    const dependencies = await dependencyService.getTeamDependencies(pool, teamId, type);
    res.json(dependencies);
  } catch (error) {
    console.error('Error fetching team dependencies:', error);
    res.status(500).json({ error: 'Failed to fetch team dependencies' });
  }
});

describe('Team Dependency Routes', () => {
  let app: Express;
  let mockPool: Pool;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPool = {} as Pool;

    app = express();
    app.use(express.json());
    app.locals.pool = mockPool;
    app.use('/api/teams/:teamId', teamDependencyRouter);
  });

  describe('GET /api/teams/:teamId/dependencies', () => {
    it('should return 200 with team dependencies', async () => {
      const now = new Date();
      const mockDeps = {
        upstream: [
          {
            id: 'dep-1',
            from_service_id: 'service-2',
            to_service_id: 'service-1',
            type: 'DECLARED' as const,
            metadata: {},
            created_at: now,
            updated_at: now,
          },
        ],
        downstream: [
          {
            id: 'dep-2',
            from_service_id: 'service-1',
            to_service_id: 'service-3',
            type: 'OBSERVED' as const,
            metadata: {},
            created_at: now,
            updated_at: now,
          },
        ],
      };

      vi.mocked(dependencyService.getTeamDependencies).mockResolvedValue(mockDeps);

      const response = await request(app).get('/api/teams/team-1/dependencies');

      expect(response.status).toBe(200);
      expect(response.body.upstream).toHaveLength(1);
      expect(response.body.downstream).toHaveLength(1);
      expect(dependencyService.getTeamDependencies).toHaveBeenCalledWith(
        mockPool,
        'team-1',
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
            from_service_id: 'service-1',
            to_service_id: 'service-2',
            type: 'DECLARED' as const,
            metadata: {},
            created_at: now,
            updated_at: now,
          },
        ],
      };

      vi.mocked(dependencyService.getTeamDependencies).mockResolvedValue(mockDeps);

      const response = await request(app).get('/api/teams/team-1/dependencies?type=DECLARED');

      expect(response.status).toBe(200);
      expect(response.body.downstream).toHaveLength(1);
      expect(dependencyService.getTeamDependencies).toHaveBeenCalledWith(
        mockPool,
        'team-1',
        'DECLARED'
      );
    });

    it('should return 400 for invalid type parameter', async () => {
      const response = await request(app).get('/api/teams/team-1/dependencies?type=INVALID');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid type parameter');
    });

    it('should return 500 on error', async () => {
      vi.mocked(dependencyService.getTeamDependencies).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).get('/api/teams/team-1/dependencies');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
});
