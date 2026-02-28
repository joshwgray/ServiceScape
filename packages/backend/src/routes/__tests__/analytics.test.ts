import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { analyticsRouter, domainAnalyticsRouter, serviceAnalyticsRouter } from '../analytics.js';
import { graphAnalyticsService } from '../../services/graphAnalyticsService.js';
import type { Pool } from 'pg';

vi.mock('../../services/graphAnalyticsService.js', () => ({
  graphAnalyticsService: {
    getMetrics: vi.fn(),
    getGodServices: vi.fn(),
    getBlastRadius: vi.fn(),
    getDomainHealthScores: vi.fn(),
    getDomainHealthById: vi.fn(),
    analyzeChangeImpact: vi.fn(),
  },
}));

describe('Analytics Routes', () => {
  let app: Express;
  let mockPool: Pool;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPool = {} as Pool;

    app = express();
    app.use(express.json());
    app.locals.pool = mockPool;
    app.use('/api/analytics', analyticsRouter);
    app.use('/api/services', serviceAnalyticsRouter);
    app.use('/api/domains', domainAnalyticsRouter);
  });

  describe('GET /api/analytics/metrics', () => {
    it('should return graph metrics', async () => {
      const mockMetrics = {
        services: [
          {
            serviceId: 'service-a',
            inDegree: 0.5,
            outDegree: 0.25,
            totalDegree: 0.4,
            betweenness: 0.8,
            pageRank: 0.9,
          },
        ],
      };

      vi.mocked(graphAnalyticsService.getMetrics).mockResolvedValue(mockMetrics);

      const response = await request(app).get('/api/analytics/metrics');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockMetrics);
      expect(graphAnalyticsService.getMetrics).toHaveBeenCalledWith(mockPool, {
        type: 'ALL',
        refresh: false,
      });
    });

    it('should pass refresh=true through to service', async () => {
      vi.mocked(graphAnalyticsService.getMetrics).mockResolvedValue({ services: [] });

      const response = await request(app).get('/api/analytics/metrics?refresh=true');

      expect(response.status).toBe(200);
      expect(graphAnalyticsService.getMetrics).toHaveBeenCalledWith(mockPool, {
        type: 'ALL',
        refresh: true,
      });
    });
  });

  describe('GET /api/analytics/god-services', () => {
    it('should return god services', async () => {
      const mockGodServices = [
        {
          serviceId: 'service-b',
          betweenness: 0.91,
          crossDomainEdgeCount: 3,
        },
      ];

      vi.mocked(graphAnalyticsService.getGodServices).mockResolvedValue(mockGodServices);

      const response = await request(app).get('/api/analytics/god-services?type=DECLARED');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockGodServices);
      expect(graphAnalyticsService.getGodServices).toHaveBeenCalledWith(mockPool, {
        type: 'DECLARED',
        refresh: false,
      });
    });
  });

  describe('GET /api/services/:id/blast-radius', () => {
    it('should return blast radius for a service', async () => {
      const mockBlastRadius = {
        serviceId: 'service-c',
        affectedServiceIds: ['service-a', 'service-b'],
        affectedCount: 2,
        blastRadius: 0.5,
      };

      vi.mocked(graphAnalyticsService.getBlastRadius).mockResolvedValue(mockBlastRadius);

      const response = await request(app).get('/api/services/service-c/blast-radius');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockBlastRadius);
      expect(graphAnalyticsService.getBlastRadius).toHaveBeenCalledWith(
        mockPool,
        'service-c',
        { type: 'ALL', refresh: false }
      );
    });
  });

  describe('GET /api/analytics/domain-health', () => {
    it('should return all domain health scores', async () => {
      const mockDomainHealth = [
        {
          domainId: 'domain-1',
          score: 0.82,
          status: 'healthy' as const,
          components: {
            couplingRatio: 0.1,
            centralizationFactor: 0.2,
            avgBlastRadius: 0.3,
          },
          serviceCount: 8,
        },
      ];

      vi.mocked(graphAnalyticsService.getDomainHealthScores).mockResolvedValue(mockDomainHealth);

      const response = await request(app).get('/api/analytics/domain-health?refresh=true');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockDomainHealth);
      expect(graphAnalyticsService.getDomainHealthScores).toHaveBeenCalledWith(mockPool, {
        type: 'ALL',
        refresh: true,
      });
    });
  });

  describe('GET /api/domains/:id/health', () => {
    it('should return domain health for a specific domain', async () => {
      const mockDomainHealth = {
        domainId: 'domain-2',
        score: 0.51,
        status: 'at-risk' as const,
        components: {
          couplingRatio: 0.45,
          centralizationFactor: 0.4,
          avgBlastRadius: 0.5,
        },
        serviceCount: 10,
      };

      vi.mocked(graphAnalyticsService.getDomainHealthById).mockResolvedValue(mockDomainHealth);

      const response = await request(app).get('/api/domains/domain-2/health?type=OBSERVED');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockDomainHealth);
      expect(graphAnalyticsService.getDomainHealthById).toHaveBeenCalledWith(
        mockPool,
        'domain-2',
        { type: 'OBSERVED', refresh: false }
      );
    });

    it('should return 404 when domain health is not found', async () => {
      vi.mocked(graphAnalyticsService.getDomainHealthById).mockResolvedValue(null);

      const response = await request(app).get('/api/domains/domain-missing/health');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Domain health not found' });
    });
  });

  describe('POST /api/analytics/impact-analysis', () => {
    it('should return change impact analysis for a service', async () => {
      const mockImpactAnalysis = {
        serviceId: 'service-a',
        changeType: 'deploy',
        affectedCount: 2,
        affectedServices: [
          {
            serviceId: 'service-b',
            serviceName: 'Service B',
            teamId: 'team-1',
            domainId: 'domain-1',
            centrality: 0.5,
          },
        ],
        affectedTeamIds: ['team-1'],
        affectedDomainIds: ['domain-1'],
        avgCentrality: 0.5,
        crossDomainFactor: 0,
        riskScore: 1,
        stakeholders: [
          {
            teamId: 'team-1',
            teamName: 'Team 1',
            memberId: 'member-1',
            memberName: 'Alex Smith',
            email: 'alex@company.com',
            role: 'MANAGER',
          },
        ],
      };

      vi.mocked(graphAnalyticsService.analyzeChangeImpact).mockResolvedValue(mockImpactAnalysis);

      const response = await request(app)
        .post('/api/analytics/impact-analysis?type=DECLARED')
        .send({ serviceId: 'service-a', changeType: 'deploy' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockImpactAnalysis);
      expect(graphAnalyticsService.analyzeChangeImpact).toHaveBeenCalledWith(
        mockPool,
        'service-a',
        { type: 'DECLARED', changeType: 'deploy' }
      );
    });

    it('should return 400 when serviceId is missing', async () => {
      const response = await request(app)
        .post('/api/analytics/impact-analysis')
        .send({ changeType: 'deploy' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'serviceId is required' });
    });
  });
});
