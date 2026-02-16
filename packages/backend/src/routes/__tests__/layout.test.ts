import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { layoutRouter } from '../layout.js';
import * as layoutService from '../../services/layoutService.js';
import type { Pool } from 'pg';

vi.mock('../../services/layoutService.js');

describe('Layout Routes', () => {
  let app: Express;
  let mockPool: Pool;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPool = {} as Pool;

    app = express();
    app.use(express.json());
    app.locals.pool = mockPool;
    app.use('/api/layout', layoutRouter);
  });

  describe('GET /api/layout', () => {
    it('should return 200 with layout positions', async () => {
      const mockLayout = {
        domains: {
          'domain-1': { x: 0, y: 0, z: 0 },
          'domain-2': { x: 150, y: 0, z: 0 },
        },
        teams: {
          'team-1': { x: 10, y: 10, z: 5 },
          'team-2': { x: 160, y: 10, z: 5 },
        },
        services: {
          'service-1': { x: 30, y: 30, z: 15 },
          'service-2': { x: 180, y: 30, z: 15 },
        },
      };

      vi.mocked(layoutService.getLayout).mockResolvedValue(mockLayout);

      const response = await request(app).get('/api/layout');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockLayout);
      expect(layoutService.getLayout).toHaveBeenCalledWith(mockPool);
    });

    it('should return 500 on error', async () => {
      vi.mocked(layoutService.getLayout).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/layout');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/layout/invalidate', () => {
    it('should invalidate cache and return 200', async () => {
      vi.mocked(layoutService.invalidateLayoutCache).mockResolvedValue(undefined);

      const response = await request(app).post('/api/layout/invalidate');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(layoutService.invalidateLayoutCache).toHaveBeenCalledWith(mockPool);
    });

    it('should return 500 on error', async () => {
      vi.mocked(layoutService.invalidateLayoutCache).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).post('/api/layout/invalidate');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/layout/compute', () => {
    it('should compute new layout and return 200', async () => {
      const mockLayout = {
        domains: { 'domain-1': { x: 0, y: 0, z: 0 } },
        teams: { 'team-1': { x: 10, y: 10, z: 5 } },
        services: { 'service-1': { x: 30, y: 30, z: 15 } },
      };

      vi.mocked(layoutService.computeLayout).mockResolvedValue(mockLayout);

      const response = await request(app).post('/api/layout/compute');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockLayout);
      expect(layoutService.computeLayout).toHaveBeenCalledWith(mockPool);
    });

    it('should return 500 on error', async () => {
      vi.mocked(layoutService.computeLayout).mockRejectedValue(new Error('Compute error'));

      const response = await request(app).post('/api/layout/compute');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
});
