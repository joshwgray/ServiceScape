import { MultiDirectedGraph } from 'graphology';
import { stronglyConnectedComponents } from 'graphology-components';
import betweennessCentrality from 'graphology-metrics/centrality/betweenness';
import pagerank from 'graphology-metrics/centrality/pagerank';
import type { Pool } from 'pg';
import type { DbDependency, DbGraphMetricsCache, DependencyType } from '../db/schema.js';
import type {
  BlastRadiusResult,
  ChangeImpactAnalysis,
  CircularDependency,
  DomainHealthScore,
  GodServiceResult,
  GraphMetrics,
  SuggestedStakeholder,
  ServiceMetrics,
} from '../types/metrics.js';
import * as dependencyRepo from '../repositories/dependencyRepository.js';
import * as memberRepo from '../repositories/memberRepository.js';
import * as serviceRepo from '../repositories/serviceRepository.js';
import * as teamRepo from '../repositories/teamRepository.js';

export type GraphDependencyFilter = DependencyType | 'ALL';

export interface GraphBuildOptions {
  type?: GraphDependencyFilter;
}

export interface AnalyticsQueryOptions {
  type?: GraphDependencyFilter;
  refresh?: boolean;
}

const CACHE_DURATION_MS = 3600000; // 1 hour
const CACHE_VERSION = 1;

/**
 * Graph analytics foundation service.
 * Converts dependency rows into a directed graph using
 * from_service_id -> to_service_id semantics.
 */
export class GraphAnalyticsService {
  buildGraph(
    dependencies: DbDependency[],
    options: GraphBuildOptions = {}
  ): MultiDirectedGraph {
    const graph = new MultiDirectedGraph();
    const filterType = options.type ?? 'ALL';
    const filteredDependencies =
      filterType === 'ALL'
        ? dependencies
        : dependencies.filter((dependency) => dependency.type === filterType);

    for (const dependency of filteredDependencies) {
      if (!graph.hasNode(dependency.from_service_id)) {
        graph.addNode(dependency.from_service_id);
      }

      if (!graph.hasNode(dependency.to_service_id)) {
        graph.addNode(dependency.to_service_id);
      }

      if (!graph.hasEdge(dependency.id)) {
        graph.addDirectedEdgeWithKey(
          dependency.id,
          dependency.from_service_id,
          dependency.to_service_id,
          {
            type: dependency.type,
            metadata: dependency.metadata,
          }
        );
      }
    }

    return graph;
  }

  calculateMetrics(graph: MultiDirectedGraph): GraphMetrics {
    const nodeIds = graph.nodes();

    if (nodeIds.length === 0) {
      return { services: [] };
    }

    const inDegreeRaw: Record<string, number> = {};
    const outDegreeRaw: Record<string, number> = {};
    const totalDegreeRaw: Record<string, number> = {};

    for (const nodeId of nodeIds) {
      inDegreeRaw[nodeId] = graph.inDegree(nodeId);
      outDegreeRaw[nodeId] = graph.outDegree(nodeId);
      totalDegreeRaw[nodeId] = graph.degree(nodeId);
    }

    const betweennessRaw = betweennessCentrality(graph, { normalized: true });
    const pagerankRaw = pagerank(graph);

    const inDegree = this.normalizeMetricMap(inDegreeRaw);
    const outDegree = this.normalizeMetricMap(outDegreeRaw);
    const totalDegree = this.normalizeMetricMap(totalDegreeRaw);
    const betweenness = this.normalizeMetricMap(betweennessRaw);
    const pageRank = this.normalizeMetricMap(pagerankRaw);

    const services: ServiceMetrics[] = nodeIds
      .map((serviceId) => ({
        serviceId,
        inDegree: inDegree[serviceId] ?? 0,
        outDegree: outDegree[serviceId] ?? 0,
        totalDegree: totalDegree[serviceId] ?? 0,
        betweenness: betweenness[serviceId] ?? 0,
        pageRank: pageRank[serviceId] ?? 0,
      }))
      .sort((a, b) => a.serviceId.localeCompare(b.serviceId));

    return { services };
  }

  calculateBlastRadius(
    graph: MultiDirectedGraph,
    serviceId: string
  ): BlastRadiusResult {
    if (!graph.hasNode(serviceId)) {
      return {
        serviceId,
        affectedServiceIds: [],
        affectedCount: 0,
        blastRadius: 0,
      };
    }

    const visited = new Set<string>();
    const queue: string[] = [serviceId];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) {
        continue;
      }

      const consumers = graph.inNeighbors(current);
      for (const consumerId of consumers) {
        if (!visited.has(consumerId)) {
          visited.add(consumerId);
          queue.push(consumerId);
        }
      }
    }

    const affectedServiceIds = Array.from(visited).sort((a, b) => a.localeCompare(b));
    const totalOtherServices = Math.max(graph.order - 1, 1);
    const blastRadius = affectedServiceIds.length / totalOtherServices;

    return {
      serviceId,
      affectedServiceIds,
      affectedCount: affectedServiceIds.length,
      blastRadius,
    };
  }

  detectGodServices(
    graph: MultiDirectedGraph,
    metrics: GraphMetrics,
    serviceDomainMap: Record<string, string | null>
  ): GodServiceResult[] {
    if (metrics.services.length === 0) {
      return [];
    }

    const sortedByBetweenness = [...metrics.services].sort(
      (a, b) => b.betweenness - a.betweenness
    );

    const topCount = Math.max(1, Math.ceil(sortedByBetweenness.length * 0.05));
    const topCandidates = sortedByBetweenness.slice(0, topCount);

    return topCandidates
      .map((candidate) => {
        const crossDomainEdgeCount = this.countCrossDomainEdges(
          graph,
          candidate.serviceId,
          serviceDomainMap
        );

        return {
          serviceId: candidate.serviceId,
          betweenness: candidate.betweenness,
          crossDomainEdgeCount,
        };
      })
      .filter((candidate) => candidate.crossDomainEdgeCount > 0);
  }

  detectCircularDependencies(
    graph: MultiDirectedGraph,
    serviceDomainMap: Record<string, string | null> = {}
  ): CircularDependency[] {
    const components = stronglyConnectedComponents(graph);
    const cyclicComponents = components.filter((component) => component.length > 1);

    return cyclicComponents
      .map((component) => {
        const domains = new Set<string>();
        for (const serviceId of component) {
          const domain = serviceDomainMap[serviceId];
          if (domain) {
            domains.add(domain);
          }
        }

        const crossDomain = domains.size > 1;
        const crossDomainFactor = crossDomain
          ? (domains.size - 1) / domains.size
          : 0;
        const riskScore = component.length * (1 + crossDomainFactor);

        return {
          serviceIds: [...component].sort((a, b) => a.localeCompare(b)),
          size: component.length,
          crossDomain,
          cycleRisk: {
            componentSize: component.length,
            crossDomainFactor,
            riskScore,
          },
        };
      })
      .sort((a, b) => b.cycleRisk.riskScore - a.cycleRisk.riskScore);
  }

  async getMetrics(
    pool: Pool,
    options: AnalyticsQueryOptions = {}
  ): Promise<GraphMetrics> {
    const type = options.type ?? 'ALL';
    const refresh = options.refresh ?? false;
    const cacheKey = `metrics_${type.toLowerCase()}`;

    if (!refresh) {
      const cached = await this.readCache<GraphMetrics>(pool, cacheKey);
      if (cached) {
        return cached;
      }
    }

    const graph = await this.buildGraphFromDatabase(pool, type);
    const metrics = this.calculateMetrics(graph);
    await this.writeCache(pool, cacheKey, metrics, { type, version: CACHE_VERSION });
    return metrics;
  }

  async getGodServices(
    pool: Pool,
    options: AnalyticsQueryOptions = {}
  ): Promise<GodServiceResult[]> {
    const type = options.type ?? 'ALL';
    const refresh = options.refresh ?? false;
    const cacheKey = `god_services_${type.toLowerCase()}`;

    if (!refresh) {
      const cached = await this.readCache<GodServiceResult[]>(pool, cacheKey);
      if (cached) {
        return cached;
      }
    }

    const graph = await this.buildGraphFromDatabase(pool, type);
    const metrics = await this.getMetrics(pool, { type, refresh });
    const serviceDomainMap = await serviceRepo.getServiceDomainMap(pool);
    const godServices = this.detectGodServices(graph, metrics, serviceDomainMap);
    await this.writeCache(pool, cacheKey, godServices, { type, version: CACHE_VERSION });
    return godServices;
  }

  async getBlastRadius(
    pool: Pool,
    serviceId: string,
    options: AnalyticsQueryOptions = {}
  ): Promise<BlastRadiusResult> {
    const type = options.type ?? 'ALL';
    const refresh = options.refresh ?? false;
    const cacheKey = `blast_radius_${serviceId}_${type.toLowerCase()}`;

    if (!refresh) {
      const cached = await this.readCache<BlastRadiusResult>(pool, cacheKey);
      if (cached) {
        return cached;
      }
    }

    const graph = await this.buildGraphFromDatabase(pool, type);
    const blastRadius = this.calculateBlastRadius(graph, serviceId);
    await this.writeCache(pool, cacheKey, blastRadius, { type, version: CACHE_VERSION, serviceId });
    return blastRadius;
  }

  async getDomainHealthScores(
    pool: Pool,
    options: AnalyticsQueryOptions = {}
  ): Promise<DomainHealthScore[]> {
    const type = options.type ?? 'ALL';
    const refresh = options.refresh ?? false;
    const cacheKey = `domain_health_${type.toLowerCase()}`;

    if (!refresh) {
      const cached = await this.readCache<DomainHealthScore[]>(pool, cacheKey);
      if (cached) {
        return cached;
      }
    }

    const graph = await this.buildGraphFromDatabase(pool, type);
    const metrics = await this.getMetrics(pool, { type, refresh });
    const serviceDomainMap = await serviceRepo.getServiceDomainMap(pool);
    const domainHealth = this.calculateDomainHealth(graph, metrics, serviceDomainMap);
    await this.writeCache(pool, cacheKey, domainHealth, { type, version: CACHE_VERSION });
    return domainHealth;
  }

  async getDomainHealthById(
    pool: Pool,
    domainId: string,
    options: AnalyticsQueryOptions = {}
  ): Promise<DomainHealthScore | null> {
    const domainHealthScores = await this.getDomainHealthScores(pool, options);
    return domainHealthScores.find((score) => score.domainId === domainId) ?? null;
  }

  async analyzeChangeImpact(
    pool: Pool,
    serviceId: string,
    options: AnalyticsQueryOptions & { changeType?: string } = {}
  ): Promise<ChangeImpactAnalysis> {
    const type = options.type ?? 'ALL';
    const graph = await this.buildGraphFromDatabase(pool, type);
    const metrics = this.calculateMetrics(graph);
    const blastRadius = this.calculateBlastRadius(graph, serviceId);
    const services = await serviceRepo.getAllServices(pool);
    const teams = await teamRepo.getAllTeams(pool);
    const serviceDomainMap = await serviceRepo.getServiceDomainMap(pool);

    const serviceMap = new Map(services.map((service) => [service.id, service]));
    const teamMap = new Map(teams.map((team) => [team.id, team]));
    const metricMap = new Map(metrics.services.map((metric) => [metric.serviceId, metric]));

    const affectedServices = blastRadius.affectedServiceIds
      .map((affectedServiceId) => {
        const serviceRecord = serviceMap.get(affectedServiceId);
        const metric = metricMap.get(affectedServiceId);
        const centrality = metric
          ? (metric.totalDegree + metric.betweenness + metric.pageRank) / 3
          : 0;

        return {
          serviceId: affectedServiceId,
          serviceName: serviceRecord?.name ?? affectedServiceId,
          teamId: serviceRecord?.team_id ?? null,
          domainId: serviceDomainMap[affectedServiceId] ?? null,
          centrality,
        };
      })
      .sort((a, b) => b.centrality - a.centrality || a.serviceId.localeCompare(b.serviceId));

    const affectedTeamIds = Array.from(
      new Set(
        affectedServices
          .map((affectedService) => affectedService.teamId)
          .filter((teamId): teamId is string => Boolean(teamId))
      )
    ).sort((a, b) => a.localeCompare(b));

    const affectedDomainIds = Array.from(
      new Set(
        affectedServices
          .map((affectedService) => affectedService.domainId)
          .filter((domainId): domainId is string => Boolean(domainId))
      )
    ).sort((a, b) => a.localeCompare(b));

    const avgCentrality = affectedServices.length === 0
      ? 0
      : affectedServices.reduce((sum, affectedService) => sum + affectedService.centrality, 0) /
        affectedServices.length;

    const crossDomainFactor = affectedDomainIds.length <= 1
      ? 0
      : (affectedDomainIds.length - 1) / affectedDomainIds.length;

    const riskScore = affectedServices.length * avgCentrality * (1 + crossDomainFactor);

    const stakeholders: SuggestedStakeholder[] = [];
    for (const teamId of affectedTeamIds) {
      const team = teamMap.get(teamId);
      const members = await memberRepo.getMembersByTeamId(pool, teamId);
      const preferredContact =
        members.find((member) => member.role === 'MANAGER') ??
        members.find((member) => member.role === 'LEAD') ??
        members[0] ??
        null;

      stakeholders.push({
        teamId,
        teamName: team?.name ?? teamId,
        memberId: preferredContact?.id ?? null,
        memberName: preferredContact?.name ?? null,
        email: preferredContact?.email ?? null,
        role: preferredContact?.role ?? null,
      });
    }

    return {
      serviceId,
      changeType: options.changeType ?? 'update',
      affectedCount: affectedServices.length,
      affectedServices,
      affectedTeamIds,
      affectedDomainIds,
      avgCentrality,
      crossDomainFactor,
      riskScore,
      stakeholders,
    };
  }

  calculateDomainHealth(
    graph: MultiDirectedGraph,
    metrics: GraphMetrics,
    serviceDomainMap: Record<string, string | null>
  ): DomainHealthScore[] {
    const metricByServiceId = new Map(
      metrics.services.map((serviceMetric) => [serviceMetric.serviceId, serviceMetric])
    );

    const servicesByDomain = new Map<string, string[]>();
    for (const [serviceId, domainId] of Object.entries(serviceDomainMap)) {
      if (!domainId) {
        continue;
      }

      const services = servicesByDomain.get(domainId) ?? [];
      services.push(serviceId);
      servicesByDomain.set(domainId, services);
    }

    const domainHealthScores: DomainHealthScore[] = [];
    for (const [domainId, domainServiceIds] of servicesByDomain.entries()) {
      let totalOutboundEdges = 0;
      let crossDomainEdges = 0;

      for (const serviceId of domainServiceIds) {
        if (!graph.hasNode(serviceId)) {
          continue;
        }

        const outboundEdges = graph.outEdges(serviceId) ?? [];
        totalOutboundEdges += outboundEdges.length;

        for (const edgeId of outboundEdges) {
          const targetServiceId = graph.target(edgeId);
          const targetDomainId = serviceDomainMap[targetServiceId] ?? null;
          if (targetDomainId !== domainId) {
            crossDomainEdges += 1;
          }
        }
      }

      const couplingRatio = totalOutboundEdges === 0
        ? 0
        : crossDomainEdges / totalOutboundEdges;

      const pageRanks = domainServiceIds.map((serviceId) => {
        const metric = metricByServiceId.get(serviceId);
        return metric?.pageRank ?? 0;
      });
      const centralizationFactor = this.calculateGiniCoefficient(pageRanks);

      const avgBlastRadius = domainServiceIds.length === 0
        ? 0
        : domainServiceIds
            .map((serviceId) => this.calculateBlastRadius(graph, serviceId).blastRadius)
            .reduce((sum, value) => sum + value, 0) / domainServiceIds.length;

      const score = this.clamp01(
        (1 - couplingRatio) * 0.4 +
          (1 - centralizationFactor) * 0.3 +
          (1 - avgBlastRadius) * 0.3
      );

      domainHealthScores.push({
        domainId,
        score,
        status: this.getHealthStatus(score),
        components: {
          couplingRatio,
          centralizationFactor,
          avgBlastRadius,
        },
        serviceCount: domainServiceIds.length,
      });
    }

    return domainHealthScores.sort((a, b) => a.domainId.localeCompare(b.domainId));
  }

  private normalizeMetricMap(values: Record<string, number>): Record<string, number> {
    const numericValues = Object.values(values);
    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);

    if (min === max) {
      return Object.fromEntries(
        Object.keys(values).map((key) => [key, 0])
      );
    }

    const denominator = max - min;
    return Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, (value - min) / denominator])
    );
  }

  private countCrossDomainEdges(
    graph: MultiDirectedGraph,
    serviceId: string,
    serviceDomainMap: Record<string, string | null>
  ): number {
    const ownDomain = serviceDomainMap[serviceId] ?? null;
    if (!ownDomain) {
      return 0;
    }

    const neighborIds = new Set<string>([
      ...graph.inNeighbors(serviceId),
      ...graph.outNeighbors(serviceId),
    ]);

    let crossDomainEdgeCount = 0;
    for (const neighborId of neighborIds) {
      const neighborDomain = serviceDomainMap[neighborId] ?? null;
      if (neighborDomain && neighborDomain !== ownDomain) {
        crossDomainEdgeCount += 1;
      }
    }

    return crossDomainEdgeCount;
  }

  private calculateGiniCoefficient(values: number[]): number {
    if (values.length <= 1) {
      return 0;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const total = sorted.reduce((sum, value) => sum + value, 0);

    if (total === 0) {
      return 0;
    }

    const n = sorted.length;
    const weightedSum = sorted.reduce(
      (sum, value, index) => sum + (index + 1) * value,
      0
    );
    const gini = (2 * weightedSum) / (n * total) - (n + 1) / n;
    return this.clamp01(gini);
  }

  private getHealthStatus(score: number): 'healthy' | 'at-risk' | 'fragile' {
    if (score > 0.7) {
      return 'healthy';
    }

    if (score >= 0.4) {
      return 'at-risk';
    }

    return 'fragile';
  }

  private clamp01(value: number): number {
    return Math.max(0, Math.min(1, value));
  }

  private async buildGraphFromDatabase(
    pool: Pool,
    type: GraphDependencyFilter
  ): Promise<MultiDirectedGraph> {
    const dependencies = await dependencyRepo.getAllDependencies(
      pool,
      type === 'ALL' ? undefined : type
    );
    return this.buildGraph(dependencies, { type: 'ALL' });
  }

  private async readCache<T>(pool: Pool, cacheKey: string): Promise<T | null> {
    const result = await pool.query<DbGraphMetricsCache>(
      'SELECT * FROM graph_metrics_cache WHERE cache_key = $1',
      [cacheKey]
    );

    const cached = result.rows[0];
    if (!cached || !cached.expires_at) {
      return null;
    }

    const isNotExpired = new Date(cached.expires_at) > new Date();
    const hasCorrectVersion = cached.metadata?.version === CACHE_VERSION;

    if (!isNotExpired || !hasCorrectVersion) {
      return null;
    }

    return cached.cache_data as T;
  }

  private async writeCache<T>(
    pool: Pool,
    cacheKey: string,
    cacheData: T,
    metadata: Record<string, unknown>
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + CACHE_DURATION_MS);

    await pool.query(
      `INSERT INTO graph_metrics_cache (cache_key, cache_data, metadata, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (cache_key)
       DO UPDATE SET cache_data = $2, metadata = $3, expires_at = $4, updated_at = CURRENT_TIMESTAMP`,
      [cacheKey, JSON.stringify(cacheData), JSON.stringify(metadata), expiresAt]
    );
  }
}

export const graphAnalyticsService = new GraphAnalyticsService();
