import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { teamRouter } from '../teams.js';
import * as organizationService from '../../services/organizationService.js';
import type { Pool } from 'pg';

vi.mock('../../services/organizationService.js');

describe('Team Routes', () => {
  let app: Express;
  let mockPool: Pool;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPool = {} as Pool;

    app = express();
    app.use(express.json());
    app.locals.pool = mockPool;
    // Mount team routes at both paths
    app.use('/api/domains/:domainId/teams', teamRouter);
    app.use('/api/teams', teamRouter);
  });

  describe('GET /api/domains/:domainId/teams', () => {
    it('should return 200 with teams array', async () => {
      const mockTeams = [
        {
          id: 'team-1',
          domainId: 'domain-1',
          name: 'Backend',
          metadata: {},
          serviceCount: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'team-2',
          domainId: 'domain-1',
          name: 'Frontend',
          metadata: {},
          serviceCount: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(organizationService.getTeamsByDomain).mockResolvedValue(mockTeams);

      const response = await request(app).get('/api/domains/domain-1/teams');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('Backend');
      expect(response.body[0].domainId).toBe('domain-1');
      expect(response.body[0]).not.toHaveProperty('domain_id');
      expect(organizationService.getTeamsByDomain).toHaveBeenCalledWith(mockPool, 'domain-1');
    });

    it('should return 200 with empty array when domain has no teams', async () => {
      vi.mocked(organizationService.getTeamsByDomain).mockResolvedValue([]);

      const response = await request(app).get('/api/domains/domain-1/teams');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(organizationService.getTeamsByDomain).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).get('/api/domains/domain-1/teams');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/teams', () => {
    it('should return 200 with all teams in camelCase', async () => {
      const mockTeams = [
        {
          id: 'team-1',
          domainId: 'domain-1',
          name: 'Backend',
          metadata: {},
          serviceCount: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'team-2',
          domainId: 'domain-2',
          name: 'Frontend',
          metadata: {},
          serviceCount: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(organizationService.getAllTeams).mockResolvedValue(mockTeams);

      const response = await request(app).get('/api/teams');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('Backend');
      expect(response.body[0].domainId).toBe('domain-1');
      expect(response.body[0]).not.toHaveProperty('domain_id');
      expect(response.body[0]).not.toHaveProperty('created_at');
      expect(response.body[0]).not.toHaveProperty('updated_at');
      expect(response.body[0]).toHaveProperty('createdAt');
      expect(response.body[0]).toHaveProperty('updatedAt');
      expect(organizationService.getAllTeams).toHaveBeenCalledWith(mockPool);
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(organizationService.getAllTeams).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).get('/api/teams');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/teams/:id', () => {
    it('should return 200 with team when found', async () => {
      const mockTeam = {
        id: 'team-1',
        domainId: 'domain-1',
        name: 'Backend',
        metadata: {},
        serviceCount: 2,
        members: [
          {
            id: 'member-1',
            teamId: 'team-1',
            name: 'John Doe',
            role: 'Engineer',
            email: 'john@example.com',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(organizationService.getTeamById).mockResolvedValue(mockTeam);

      const response = await request(app).get('/api/teams/team-1');

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Backend');
      expect(response.body.serviceCount).toBe(2);
      expect(response.body.members).toHaveLength(1);
      expect(organizationService.getTeamById).toHaveBeenCalledWith(mockPool, 'team-1');
    });

    it('should return 404 when team not found', async () => {
      vi.mocked(organizationService.getTeamById).mockResolvedValue(null);

      const response = await request(app).get('/api/teams/non-existent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(organizationService.getTeamById).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/teams/team-1');

      expect(response.status).toBe(500);
    });
  });
});
