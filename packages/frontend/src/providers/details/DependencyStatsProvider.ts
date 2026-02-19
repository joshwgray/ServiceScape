import type { Dependency } from '@servicescape/shared';
import type { EnrichedServiceDetails, ServiceDetailsProvider } from './types';

/**
 * A function that fetches all dependencies (both directions) for a given service ID.
 * Matches the signature of `getDependencies` in `services/apiClient`.
 */
export type FetchDependenciesFn = (serviceId: string) => Promise<Dependency[]>;

/**
 * Provider that enriches service details with upstream/downstream dependency
 * statistics by fetching all dependency records for the service and counting
 * unique counterpart service IDs.
 *
 * Terminology (aligned with the `ServiceStats` interface and plan spec):
 *  - `stats.upstream`   — number of **unique services that depend ON** this service
 *                         (entries where `toServiceId === serviceId`)
 *  - `stats.downstream` — number of **unique services this service depends ON**
 *                         (entries where `fromServiceId === serviceId`)
 *
 * On any fetch failure the provider returns `{}` and logs the error so that the
 * rest of the enrichment pipeline can still proceed.
 */
export class DependencyStatsProvider implements ServiceDetailsProvider {
  private readonly fetchDependencies: FetchDependenciesFn;

  constructor(fetchDependencies: FetchDependenciesFn) {
    this.fetchDependencies = fetchDependencies;
  }

  async getDetails(serviceId: string): Promise<Partial<EnrichedServiceDetails>> {
    try {
      const deps = await this.fetchDependencies(serviceId);

      // Unique services that depend ON this service (callers / consumers)
      const upstreamCallers = new Set<string>(
        deps.filter((d) => d.toServiceId === serviceId).map((d) => d.fromServiceId),
      );

      // Unique services this service depends ON (providers / dependencies)
      const downstreamProviders = new Set<string>(
        deps.filter((d) => d.fromServiceId === serviceId).map((d) => d.toServiceId),
      );

      return {
        stats: {
          upstream: upstreamCallers.size,
          downstream: downstreamProviders.size,
        },
      };
    } catch (err) {
      console.error('[DependencyStatsProvider] Failed to fetch dependencies for service', serviceId, err);
      return {};
    }
  }
}
