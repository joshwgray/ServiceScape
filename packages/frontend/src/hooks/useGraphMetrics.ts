import { useEffect, useMemo, useState } from 'react';
import type { Service } from '@servicescape/shared';
import * as analyticsService from '../services/analyticsService';

export type RiskLevel = 'none' | 'amber' | 'red';

export interface TeamRiskSummary {
  teamId: string;
  riskLevel: RiskLevel;
  glowIntensity: number;
  hasGodService: boolean;
  highestBlastRadius: number;
}

interface UseGraphMetricsResult {
  teamRiskMap: Record<string, TeamRiskSummary>;
  loading: boolean;
  error: Error | null;
}

const teamRiskCache = new Map<string, Record<string, TeamRiskSummary>>();

export function useGraphMetrics(services: Service[]): UseGraphMetricsResult {
  const [teamRiskMap, setTeamRiskMap] = useState<Record<string, TeamRiskSummary>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const serviceIds = useMemo(
    () => services.map((service) => service.id).sort((a, b) => a.localeCompare(b)),
    [services]
  );

  useEffect(() => {
    if (serviceIds.length === 0) {
      setTeamRiskMap({});
      setLoading(false);
      setError(null);
      return;
    }

    let mounted = true;
    const cacheKey = serviceIds.join('|');

    if (teamRiskCache.has(cacheKey)) {
      const cached = teamRiskCache.get(cacheKey);
      if (cached) setTeamRiskMap(cached);
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [metrics, godServices, blastRadiusResults] = await Promise.all([
          analyticsService.getMetrics('ALL'),
          analyticsService.getGodServices('ALL'),
          Promise.all(serviceIds.map((serviceId) => analyticsService.getBlastRadius(serviceId, 'ALL'))),
        ]);

        const godServiceSet = new Set(godServices.map((entry) => entry.serviceId));
        const blastRadiusByServiceId = new Map(
          blastRadiusResults.map((result) => [result.serviceId, result.blastRadius])
        );
        const metricByServiceId = new Map(
          metrics.services.map((metric) => [metric.serviceId, metric])
        );

        const nextTeamRiskMap: Record<string, TeamRiskSummary> = {};
        for (const service of services) {
          const teamId = service.teamId;
          if (!teamId) {
            continue;
          }

          const blastRadius = blastRadiusByServiceId.get(service.id) ?? 0;
          const metric = metricByServiceId.get(service.id);
          const hasGodService = godServiceSet.has(service.id);
          const current = nextTeamRiskMap[teamId] ?? {
            teamId,
            riskLevel: 'none' as const,
            glowIntensity: 0,
            hasGodService: false,
            highestBlastRadius: 0,
          };

          const highestBlastRadius = Math.max(current.highestBlastRadius, blastRadius);
          const riskLevel: RiskLevel =
            highestBlastRadius > 0.8 ? 'red' :
            highestBlastRadius > 0.5 || hasGodService || current.hasGodService ? 'amber' :
            'none';

          const glowBase = riskLevel === 'red' ? 0.95 : riskLevel === 'amber' ? 0.65 : 0;
          const glowFromCentrality = metric
            ? Math.min(1, (metric.betweenness + metric.pageRank) / 2)
            : 0;

          nextTeamRiskMap[teamId] = {
            teamId,
            riskLevel,
            glowIntensity: riskLevel === 'none' ? 0 : Math.max(glowBase, glowFromCentrality),
            hasGodService: current.hasGodService || hasGodService,
            highestBlastRadius,
          };
        }

        if (mounted) {
          teamRiskCache.set(cacheKey, nextTeamRiskMap);
          setTeamRiskMap(nextTeamRiskMap);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [serviceIds, services]);

  return { teamRiskMap, loading, error };
}
