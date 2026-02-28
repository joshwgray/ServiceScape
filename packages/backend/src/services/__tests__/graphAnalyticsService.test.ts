import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Pool } from 'pg';
import type { DbDependency } from '../../db/schema.js';
import { GraphAnalyticsService } from '../graphAnalyticsService.js';
import * as dependencyRepo from '../../repositories/dependencyRepository.js';
import * as memberRepo from '../../repositories/memberRepository.js';
import * as serviceRepo from '../../repositories/serviceRepository.js';
import * as teamRepo from '../../repositories/teamRepository.js';

vi.mock('../../repositories/dependencyRepository.js');
vi.mock('../../repositories/memberRepository.js');
vi.mock('../../repositories/serviceRepository.js');
vi.mock('../../repositories/teamRepository.js');

function createDependency(
  id: string,
  fromServiceId: string,
  toServiceId: string,
  type: 'DECLARED' | 'OBSERVED'
): DbDependency {
  return {
    id,
    from_service_id: fromServiceId,
    to_service_id: toServiceId,
    type,
    metadata: {},
    created_at: new Date(),
    updated_at: new Date(),
  };
}

describe('GraphAnalyticsService', () => {
  describe('buildGraph', () => {
    it('should convert dependency rows to a directed adjacency graph', () => {
      const service = new GraphAnalyticsService();
      const dependencies: DbDependency[] = [
        createDependency('dep-1', 'service-a', 'service-b', 'DECLARED'),
        createDependency('dep-2', 'service-b', 'service-c', 'OBSERVED'),
      ];

      const graph = service.buildGraph(dependencies);

      expect(graph.order).toBe(3); // nodes
      expect(graph.size).toBe(2); // edges
      expect(graph.hasNode('service-a')).toBe(true);
      expect(graph.hasNode('service-b')).toBe(true);
      expect(graph.hasNode('service-c')).toBe(true);
      expect(graph.hasDirectedEdge('service-a', 'service-b')).toBe(true);
      expect(graph.hasDirectedEdge('service-b', 'service-c')).toBe(true);
      expect(graph.hasDirectedEdge('service-c', 'service-a')).toBe(false);
    });

    it('should include only DECLARED dependencies when filtered', () => {
      const service = new GraphAnalyticsService();
      const dependencies: DbDependency[] = [
        createDependency('dep-1', 'service-a', 'service-b', 'DECLARED'),
        createDependency('dep-2', 'service-a', 'service-c', 'OBSERVED'),
      ];

      const graph = service.buildGraph(dependencies, { type: 'DECLARED' });

      expect(graph.order).toBe(2);
      expect(graph.size).toBe(1);
      expect(graph.hasNode('service-a')).toBe(true);
      expect(graph.hasNode('service-b')).toBe(true);
      expect(graph.hasNode('service-c')).toBe(false);
      expect(graph.hasDirectedEdge('service-a', 'service-b')).toBe(true);
      expect(graph.hasDirectedEdge('service-a', 'service-c')).toBe(false);
    });

    it('should include only OBSERVED dependencies when filtered', () => {
      const service = new GraphAnalyticsService();
      const dependencies: DbDependency[] = [
        createDependency('dep-1', 'service-a', 'service-b', 'DECLARED'),
        createDependency('dep-2', 'service-c', 'service-a', 'OBSERVED'),
      ];

      const graph = service.buildGraph(dependencies, { type: 'OBSERVED' });

      expect(graph.order).toBe(2);
      expect(graph.size).toBe(1);
      expect(graph.hasNode('service-a')).toBe(true);
      expect(graph.hasNode('service-c')).toBe(true);
      expect(graph.hasNode('service-b')).toBe(false);
      expect(graph.hasDirectedEdge('service-c', 'service-a')).toBe(true);
      expect(graph.hasDirectedEdge('service-a', 'service-b')).toBe(false);
    });

    it('should include all dependency types when ALL filter is provided', () => {
      const service = new GraphAnalyticsService();
      const dependencies: DbDependency[] = [
        createDependency('dep-1', 'service-a', 'service-b', 'DECLARED'),
        createDependency('dep-2', 'service-c', 'service-a', 'OBSERVED'),
      ];

      const graph = service.buildGraph(dependencies, { type: 'ALL' });

      expect(graph.order).toBe(3);
      expect(graph.size).toBe(2);
      expect(graph.hasDirectedEdge('service-a', 'service-b')).toBe(true);
      expect(graph.hasDirectedEdge('service-c', 'service-a')).toBe(true);
    });
  });

  describe('calculateMetrics', () => {
    it('should calculate normalized degree centrality values for a line topology', () => {
      const service = new GraphAnalyticsService();
      const graph = service.buildGraph([
        createDependency('dep-1', 'service-a', 'service-b', 'DECLARED'),
        createDependency('dep-2', 'service-b', 'service-c', 'DECLARED'),
      ]);

      const metrics = service.calculateMetrics(graph);
      const byService = new Map(metrics.services.map((metric) => [metric.serviceId, metric]));

      expect(byService.get('service-b')?.inDegree).toBe(1);
      expect(byService.get('service-b')?.outDegree).toBe(1);
      expect(byService.get('service-b')?.totalDegree).toBe(1);

      expect(byService.get('service-a')?.inDegree).toBe(0);
      expect(byService.get('service-c')?.outDegree).toBe(0);
    });

    it('should identify the bridge node with highest normalized betweenness', () => {
      const service = new GraphAnalyticsService();
      const graph = service.buildGraph([
        createDependency('dep-1', 'service-a', 'service-b', 'DECLARED'),
        createDependency('dep-2', 'service-b', 'service-c', 'DECLARED'),
      ]);

      const metrics = service.calculateMetrics(graph);
      const byService = new Map(metrics.services.map((metric) => [metric.serviceId, metric]));

      expect(byService.get('service-b')?.betweenness).toBe(1);
      expect(byService.get('service-a')?.betweenness).toBe(0);
      expect(byService.get('service-c')?.betweenness).toBe(0);
    });

    it('should assign highest normalized PageRank to center of an inbound star', () => {
      const service = new GraphAnalyticsService();
      const graph = service.buildGraph([
        createDependency('dep-1', 'leaf-1', 'center', 'DECLARED'),
        createDependency('dep-2', 'leaf-2', 'center', 'DECLARED'),
        createDependency('dep-3', 'leaf-3', 'center', 'DECLARED'),
      ]);

      const metrics = service.calculateMetrics(graph);
      const byService = new Map(metrics.services.map((metric) => [metric.serviceId, metric]));

      expect(byService.get('center')?.pageRank).toBe(1);
      expect(byService.get('leaf-1')?.pageRank).toBe(0);
      expect(byService.get('leaf-2')?.pageRank).toBe(0);
      expect(byService.get('leaf-3')?.pageRank).toBe(0);
    });

    it('should normalize every metric into the 0-1 range', () => {
      const service = new GraphAnalyticsService();
      const graph = service.buildGraph([
        createDependency('dep-1', 'service-a', 'service-b', 'DECLARED'),
        createDependency('dep-2', 'service-b', 'service-c', 'DECLARED'),
        createDependency('dep-3', 'service-c', 'service-d', 'OBSERVED'),
      ]);

      const metrics = service.calculateMetrics(graph);

      for (const metric of metrics.services) {
        expect(metric.inDegree).toBeGreaterThanOrEqual(0);
        expect(metric.inDegree).toBeLessThanOrEqual(1);
        expect(metric.outDegree).toBeGreaterThanOrEqual(0);
        expect(metric.outDegree).toBeLessThanOrEqual(1);
        expect(metric.totalDegree).toBeGreaterThanOrEqual(0);
        expect(metric.totalDegree).toBeLessThanOrEqual(1);
        expect(metric.betweenness).toBeGreaterThanOrEqual(0);
        expect(metric.betweenness).toBeLessThanOrEqual(1);
        expect(metric.pageRank).toBeGreaterThanOrEqual(0);
        expect(metric.pageRank).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('calculateBlastRadius', () => {
    it('should return all transitive consumers using reverse traversal', () => {
      const service = new GraphAnalyticsService();
      const graph = service.buildGraph([
        createDependency('dep-1', 'service-a', 'service-b', 'DECLARED'),
        createDependency('dep-2', 'service-b', 'service-c', 'DECLARED'),
        createDependency('dep-3', 'service-d', 'service-b', 'OBSERVED'),
      ]);

      const result = service.calculateBlastRadius(graph, 'service-c');

      expect(result.affectedServiceIds).toEqual(['service-a', 'service-b', 'service-d']);
      expect(result.affectedCount).toBe(3);
      expect(result.blastRadius).toBe(1);
    });

    it('should return empty impact for isolated or unknown services', () => {
      const service = new GraphAnalyticsService();
      const graph = service.buildGraph([
        createDependency('dep-1', 'service-a', 'service-b', 'DECLARED'),
      ]);

      const result = service.calculateBlastRadius(graph, 'service-x');

      expect(result.affectedServiceIds).toEqual([]);
      expect(result.affectedCount).toBe(0);
      expect(result.blastRadius).toBe(0);
    });
  });

  describe('detectGodServices', () => {
    it('should detect top-5% betweenness services that have cross-domain edges', () => {
      const service = new GraphAnalyticsService();
      const graph = service.buildGraph([
        createDependency('dep-1', 'service-a', 'service-b', 'DECLARED'),
        createDependency('dep-2', 'service-b', 'service-c', 'DECLARED'),
        createDependency('dep-3', 'service-d', 'service-b', 'OBSERVED'),
      ]);

      const metrics = service.calculateMetrics(graph);
      const result = service.detectGodServices(graph, metrics, {
        'service-a': 'domain-1',
        'service-b': 'domain-2',
        'service-c': 'domain-2',
        'service-d': 'domain-2',
      });

      expect(result).toEqual([
        {
          serviceId: 'service-b',
          betweenness: 1,
          crossDomainEdgeCount: 1,
        },
      ]);
    });

    it('should exclude top centrality services that do not cross domain boundaries', () => {
      const service = new GraphAnalyticsService();
      const graph = service.buildGraph([
        createDependency('dep-1', 'service-a', 'service-b', 'DECLARED'),
        createDependency('dep-2', 'service-b', 'service-c', 'DECLARED'),
      ]);

      const metrics = service.calculateMetrics(graph);
      const result = service.detectGodServices(graph, metrics, {
        'service-a': 'domain-1',
        'service-b': 'domain-1',
        'service-c': 'domain-1',
      });

      expect(result).toEqual([]);
    });
  });

  describe('detectCircularDependencies', () => {
    it('should detect strongly connected components that are true cycles', () => {
      const service = new GraphAnalyticsService();
      const graph = service.buildGraph([
        createDependency('dep-1', 'service-a', 'service-b', 'DECLARED'),
        createDependency('dep-2', 'service-b', 'service-c', 'DECLARED'),
        createDependency('dep-3', 'service-c', 'service-a', 'DECLARED'),
      ]);

      const result = service.detectCircularDependencies(graph);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        serviceIds: ['service-a', 'service-b', 'service-c'],
        size: 3,
        crossDomain: false,
      });
    });

    it('should return an empty array for acyclic graphs', () => {
      const service = new GraphAnalyticsService();
      const graph = service.buildGraph([
        createDependency('dep-1', 'service-a', 'service-b', 'DECLARED'),
        createDependency('dep-2', 'service-b', 'service-c', 'DECLARED'),
      ]);

      const result = service.detectCircularDependencies(graph);

      expect(result).toEqual([]);
    });

    it('should increase cycle risk score for cross-domain cycles', () => {
      const service = new GraphAnalyticsService();
      const graph = service.buildGraph([
        createDependency('dep-1', 'service-a', 'service-b', 'DECLARED'),
        createDependency('dep-2', 'service-b', 'service-a', 'DECLARED'),
      ]);

      const result = service.detectCircularDependencies(graph, {
        'service-a': 'domain-1',
        'service-b': 'domain-2',
      });

      expect(result).toHaveLength(1);
      expect(result[0].crossDomain).toBe(true);
      expect(result[0].cycleRisk.riskScore).toBeGreaterThan(2);
    });

    it('should rank larger cycles as higher risk when domain factor is equal', () => {
      const service = new GraphAnalyticsService();
      const graph = service.buildGraph([
        // 2-node cycle
        createDependency('dep-1', 'service-a', 'service-b', 'DECLARED'),
        createDependency('dep-2', 'service-b', 'service-a', 'DECLARED'),
        // 3-node cycle
        createDependency('dep-3', 'service-c', 'service-d', 'DECLARED'),
        createDependency('dep-4', 'service-d', 'service-e', 'DECLARED'),
        createDependency('dep-5', 'service-e', 'service-c', 'DECLARED'),
      ]);

      const result = service.detectCircularDependencies(graph, {
        'service-a': 'domain-1',
        'service-b': 'domain-1',
        'service-c': 'domain-1',
        'service-d': 'domain-1',
        'service-e': 'domain-1',
      });

      expect(result).toHaveLength(2);
      expect(result[0].size).toBe(3);
      expect(result[1].size).toBe(2);
      expect(result[0].cycleRisk.riskScore).toBeGreaterThan(result[1].cycleRisk.riskScore);
    });
  });

  describe('cache-backed analytics', () => {
    let mockPool: Pool;
    let mockQuery: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      vi.clearAllMocks();
      mockQuery = vi.fn();
      mockPool = {
        query: mockQuery,
      } as unknown as Pool;
    });

    it('should return cached metrics when cache is valid', async () => {
      const service = new GraphAnalyticsService();
      const cachedMetrics = {
        services: [
          {
            serviceId: 'service-a',
            inDegree: 0,
            outDegree: 0,
            totalDegree: 0,
            betweenness: 0,
            pageRank: 0,
          },
        ],
      };

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            cache_key: 'metrics_all',
            cache_data: cachedMetrics,
            metadata: { version: 1 },
            created_at: new Date(),
            updated_at: new Date(),
            expires_at: new Date(Date.now() + 60000),
          },
        ],
        command: '',
        oid: 0,
        fields: [],
        rowCount: 1,
      });

      const result = await service.getMetrics(mockPool, { type: 'ALL' });

      expect(result).toEqual(cachedMetrics);
      expect(dependencyRepo.getAllDependencies).not.toHaveBeenCalled();
    });

    it('should compute and cache metrics on cache miss', async () => {
      const service = new GraphAnalyticsService();

      mockQuery
        .mockResolvedValueOnce({
          rows: [],
          command: '',
          oid: 0,
          fields: [],
          rowCount: 0,
        })
        .mockResolvedValueOnce({
          rows: [],
          command: '',
          oid: 0,
          fields: [],
          rowCount: 0,
        });

      vi.mocked(dependencyRepo.getAllDependencies).mockResolvedValue([
        createDependency('dep-1', 'service-a', 'service-b', 'DECLARED'),
      ]);

      const result = await service.getMetrics(mockPool, { type: 'ALL' });

      expect(result.services.length).toBeGreaterThan(0);
      expect(dependencyRepo.getAllDependencies).toHaveBeenCalled();
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO graph_metrics_cache'),
        expect.any(Array)
      );
    });

    it('should recompute metrics when cache is expired', async () => {
      const service = new GraphAnalyticsService();

      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              cache_key: 'metrics_all',
              cache_data: { services: [] },
              metadata: { version: 1 },
              created_at: new Date(),
              updated_at: new Date(),
              expires_at: new Date(Date.now() - 60000),
            },
          ],
          command: '',
          oid: 0,
          fields: [],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [],
          command: '',
          oid: 0,
          fields: [],
          rowCount: 0,
        });

      vi.mocked(dependencyRepo.getAllDependencies).mockResolvedValue([
        createDependency('dep-1', 'service-a', 'service-b', 'DECLARED'),
      ]);

      await service.getMetrics(mockPool, { type: 'ALL' });

      expect(dependencyRepo.getAllDependencies).toHaveBeenCalled();
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO graph_metrics_cache'),
        expect.any(Array)
      );
    });
  });

  describe('calculateDomainHealth', () => {
    it('should calculate coupling ratio as cross-domain outbound edges over total outbound edges', () => {
      const service = new GraphAnalyticsService();
      const graph = service.buildGraph([
        createDependency('dep-1', 'service-a', 'service-b', 'DECLARED'),
        createDependency('dep-2', 'service-a', 'service-c', 'DECLARED'),
      ]);
      const metrics = service.calculateMetrics(graph);

      const result = service.calculateDomainHealth(graph, metrics, {
        'service-a': 'domain-1',
        'service-b': 'domain-1',
        'service-c': 'domain-2',
      });

      const domain1 = result.find((entry) => entry.domainId === 'domain-1');
      expect(domain1).toBeDefined();
      expect(domain1?.components.couplingRatio).toBeCloseTo(0.5, 5);
    });

    it('should calculate centralization factor using PageRank Gini coefficient', () => {
      const service = new GraphAnalyticsService();
      const graph = service.buildGraph([
        createDependency('dep-1', 'leaf-1', 'center', 'DECLARED'),
        createDependency('dep-2', 'leaf-2', 'center', 'DECLARED'),
        createDependency('dep-3', 'leaf-3', 'center', 'DECLARED'),
      ]);
      const metrics = service.calculateMetrics(graph);

      const result = service.calculateDomainHealth(graph, metrics, {
        center: 'domain-1',
        'leaf-1': 'domain-1',
        'leaf-2': 'domain-1',
        'leaf-3': 'domain-1',
      });

      const domain1 = result.find((entry) => entry.domainId === 'domain-1');
      expect(domain1).toBeDefined();
      expect(domain1?.components.centralizationFactor).toBeGreaterThan(0);
      expect(domain1?.components.centralizationFactor).toBeLessThanOrEqual(1);
    });

    it('should calculate average blast radius across services in a domain', () => {
      const service = new GraphAnalyticsService();
      const graph = service.buildGraph([
        createDependency('dep-1', 'service-a', 'service-b', 'DECLARED'),
        createDependency('dep-2', 'service-b', 'service-c', 'DECLARED'),
      ]);
      const metrics = service.calculateMetrics(graph);

      const result = service.calculateDomainHealth(graph, metrics, {
        'service-a': 'domain-1',
        'service-b': 'domain-1',
        'service-c': 'domain-1',
      });

      const domain1 = result.find((entry) => entry.domainId === 'domain-1');
      expect(domain1).toBeDefined();
      expect(domain1?.components.avgBlastRadius).toBeCloseTo(0.5, 5);
    });

    it('should classify domains with composite score thresholds', () => {
      const service = new GraphAnalyticsService();

      const healthyGraph = service.buildGraph([]);
      const healthyMetrics = service.calculateMetrics(healthyGraph);
      const healthy = service.calculateDomainHealth(healthyGraph, healthyMetrics, {
        'h-service': 'domain-healthy',
      });

      const atRiskGraph = service.buildGraph([
        createDependency('dep-1', 'a1', 'a2', 'DECLARED'),
        createDependency('dep-2', 'a2', 'x1', 'DECLARED'),
      ]);
      const atRiskMetrics = service.calculateMetrics(atRiskGraph);
      const atRisk = service.calculateDomainHealth(atRiskGraph, atRiskMetrics, {
        a1: 'domain-at-risk',
        a2: 'domain-at-risk',
        x1: 'domain-other',
      });

      const fragileGraph = service.buildGraph([
        createDependency('dep-1', 'f1', 'o1', 'DECLARED'),
        createDependency('dep-2', 'o1', 'f1', 'DECLARED'),
        createDependency('dep-3', 'o2', 'o1', 'DECLARED'),
      ]);
      const fragileMetrics = service.calculateMetrics(fragileGraph);
      const fragile = service.calculateDomainHealth(fragileGraph, fragileMetrics, {
        f1: 'domain-fragile',
        o1: 'domain-other',
        o2: 'domain-other',
      });

      const healthyDomain = healthy.find((entry) => entry.domainId === 'domain-healthy');
      const atRiskDomain = atRisk.find((entry) => entry.domainId === 'domain-at-risk');
      const fragileDomain = fragile.find((entry) => entry.domainId === 'domain-fragile');

      expect(healthyDomain?.score).toBeGreaterThan(0.7);
      expect(healthyDomain?.status).toBe('healthy');

      expect(atRiskDomain?.score).toBeGreaterThanOrEqual(0.4);
      expect(atRiskDomain?.score).toBeLessThanOrEqual(0.7);
      expect(atRiskDomain?.status).toBe('at-risk');

      expect(fragileDomain?.score).toBeLessThan(0.4);
      expect(fragileDomain?.status).toBe('fragile');
    });
  });

  describe('analyzeChangeImpact', () => {
    let mockPool: Pool;

    beforeEach(() => {
      vi.clearAllMocks();
      mockPool = { query: vi.fn() } as unknown as Pool;
    });

    it('should discover affected services using blast radius traversal', async () => {
      const service = new GraphAnalyticsService();

      vi.mocked(dependencyRepo.getAllDependencies).mockResolvedValue([
        createDependency('dep-1', 'service-a', 'service-b', 'DECLARED'),
        createDependency('dep-2', 'service-b', 'service-c', 'DECLARED'),
      ]);
      vi.mocked(serviceRepo.getAllServices).mockResolvedValue([
        {
          id: 'service-a',
          team_id: 'team-a',
          name: 'Service A',
          type: 'API',
          tier: 'T1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'service-b',
          team_id: 'team-b',
          name: 'Service B',
          type: 'API',
          tier: 'T1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'service-c',
          team_id: 'team-c',
          name: 'Service C',
          type: 'API',
          tier: 'T1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
      vi.mocked(teamRepo.getAllTeams).mockResolvedValue([]);
      vi.mocked(serviceRepo.getServiceDomainMap).mockResolvedValue({
        'service-a': 'domain-a',
        'service-b': 'domain-b',
        'service-c': 'domain-c',
      });
      vi.mocked(memberRepo.getMembersByTeamId).mockResolvedValue([]);

      const result = await service.analyzeChangeImpact(mockPool, 'service-c');

      expect(result.affectedCount).toBe(2);
      expect(result.affectedServices.map((entry) => entry.serviceId)).toEqual([
        'service-b',
        'service-a',
      ]);
      expect(result.affectedDomainIds).toEqual(['domain-a', 'domain-b']);
    });

    it('should calculate risk score from affected count, avg centrality, and cross-domain factor', async () => {
      const service = new GraphAnalyticsService();

      vi.mocked(dependencyRepo.getAllDependencies).mockResolvedValue([
        createDependency('dep-1', 'service-a', 'service-b', 'DECLARED'),
        createDependency('dep-2', 'service-b', 'service-c', 'DECLARED'),
      ]);
      vi.mocked(serviceRepo.getAllServices).mockResolvedValue([
        {
          id: 'service-a',
          team_id: 'team-a',
          name: 'Service A',
          type: 'API',
          tier: 'T1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'service-b',
          team_id: 'team-b',
          name: 'Service B',
          type: 'API',
          tier: 'T1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'service-c',
          team_id: 'team-c',
          name: 'Service C',
          type: 'API',
          tier: 'T1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
      vi.mocked(teamRepo.getAllTeams).mockResolvedValue([]);
      vi.mocked(serviceRepo.getServiceDomainMap).mockResolvedValue({
        'service-a': 'domain-a',
        'service-b': 'domain-b',
        'service-c': 'domain-c',
      });
      vi.mocked(memberRepo.getMembersByTeamId).mockResolvedValue([]);

      const result = await service.analyzeChangeImpact(mockPool, 'service-c');

      expect(result.avgCentrality).toBeGreaterThan(0);
      expect(result.crossDomainFactor).toBe(0.5);
      expect(result.riskScore).toBeCloseTo(
        result.affectedCount * result.avgCentrality * (1 + result.crossDomainFactor),
        10
      );
    });

    it('should identify stakeholders by preferring MANAGER, then LEAD, then first member', async () => {
      const service = new GraphAnalyticsService();

      vi.mocked(dependencyRepo.getAllDependencies).mockResolvedValue([
        createDependency('dep-1', 'service-a', 'service-b', 'DECLARED'),
      ]);
      vi.mocked(serviceRepo.getAllServices).mockResolvedValue([
        {
          id: 'service-a',
          team_id: 'team-a',
          name: 'Service A',
          type: 'API',
          tier: 'T1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'service-b',
          team_id: 'team-b',
          name: 'Service B',
          type: 'API',
          tier: 'T1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
      vi.mocked(teamRepo.getAllTeams).mockResolvedValue([
        {
          id: 'team-a',
          domain_id: 'domain-a',
          name: 'Team A',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
      vi.mocked(serviceRepo.getServiceDomainMap).mockResolvedValue({
        'service-a': 'domain-a',
        'service-b': 'domain-b',
      });
      vi.mocked(memberRepo.getMembersByTeamId).mockResolvedValue([
        {
          id: 'member-1',
          team_id: 'team-a',
          name: 'Jamie Lead',
          role: 'LEAD',
          email: 'jamie@company.com',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'member-2',
          team_id: 'team-a',
          name: 'Alex Manager',
          role: 'MANAGER',
          email: 'alex@company.com',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      const result = await service.analyzeChangeImpact(mockPool, 'service-b');

      expect(result.stakeholders).toEqual([
        {
          teamId: 'team-a',
          teamName: 'Team A',
          memberId: 'member-2',
          memberName: 'Alex Manager',
          email: 'alex@company.com',
          role: 'MANAGER',
        },
      ]);
    });
  });
});
