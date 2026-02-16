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
          domain_id: 'domain-1',
          name: 'Backend Team',
          metadata: {},
          serviceCount: 5,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'team-2',
          domain_id: 'domain-1',
          name: 'Frontend Team',
          metadata: {},
          serviceCount: 3,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      vi.mocked(organizationService.getTeamsByDomain).mockResolvedValue(mockTeams);

      const response = await request(app).get('/api/domains/domain-1/teams');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('Backend Team');
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

  describe('GET /api/teams/:id', () => {
    it('should return 200 with team when found', async () => {
      const mockTeam = {
        id: 'team-1',
        domain_id: 'domain-1',
        name: 'Backend Team',
        metadata: {},
        serviceCount: 5,
        members: [
          {
            id: 'member-1',
            team_id: 'team-1',
            name: 'John Doe',
            role: 'Engineer',
            email: 'john@example.com',
          },
        ],
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(organizationService.getTeamById).mockResolvedValue(mockTeam);

      const response = await request(app).get('/api/teams/team-1');

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Backend Team');
      expect(response.body.serviceCount).toBe(5);
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
