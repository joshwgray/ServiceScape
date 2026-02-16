import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { domainRouter } from '../domains.js';
import * as organizationService from '../../services/organizationService.js';
import type { Pool } from 'pg';

vi.mock('../../services/organizationService.js');

describe('Domain Routes', () => {
  let app: Express;
  let mockPool: Pool;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPool = {} as Pool;

    app = express();
    app.use(express.json());
    // Attach pool to app locals for routes to access
    app.locals.pool = mockPool;
    app.use('/api/domains', domainRouter);
  });

  describe('GET /api/domains', () => {
    it('should return 200 with domains array', async () => {
      const mockDomains = [
        {
          id: 'domain-1',
          name: 'Engineering',
          metadata: {},
          teamCount: 3,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'domain-2',
          name: 'Product',
          metadata: {},
          teamCount: 2,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      vi.mocked(organizationService.getDomains).mockResolvedValue(mockDomains);

      const response = await request(app).get('/api/domains');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('Engineering');
      expect(organizationService.getDomains).toHaveBeenCalledWith(mockPool);
    });

    it('should return 200 with empty array when no domains', async () => {
      vi.mocked(organizationService.getDomains).mockResolvedValue([]);

      const response = await request(app).get('/api/domains');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(organizationService.getDomains).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app).get('/api/domains');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/domains/:id', () => {
    it('should return 200 with domain when found', async () => {
      const mockDomain = {
        id: 'domain-1',
        name: 'Engineering',
        metadata: { description: 'Engineering teams' },
        teamCount: 3,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(organizationService.getDomainById).mockResolvedValue(mockDomain);

      const response = await request(app).get('/api/domains/domain-1');

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Engineering');
      expect(response.body.teamCount).toBe(3);
      expect(organizationService.getDomainById).toHaveBeenCalledWith(mockPool, 'domain-1');
    });

    it('should return 404 when domain not found', async () => {
      vi.mocked(organizationService.getDomainById).mockResolvedValue(null);

      const response = await request(app).get('/api/domains/non-existent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(organizationService.getDomainById).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).get('/api/domains/domain-1');

      expect(response.status).toBe(500);
    });
  });
});
