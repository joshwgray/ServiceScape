import type { Service } from '@servicescape/shared';

/** A labelled hyperlink associated with a service (e.g. runbook, docs). */
export interface ServiceLink {
  label: string;
  url: string;
}

/** Upstream/downstream dependency counts for a service. */
export interface ServiceStats {
  upstream: number;
  downstream: number;
}

/**
 * Enriched representation of a Service with optional fields populated
 * by one or more ServiceDetailsProviders.
 */
export interface EnrichedServiceDetails extends Service {
  owner?: string;
  tiers?: string[];
  stats?: ServiceStats;
  members?: string[];
  links?: ServiceLink[];
}

/**
 * Contract that all service details providers must implement.
 *
 * Each provider returns a **partial** enrichment. The caller is responsible
 * for merging contributions from multiple providers — later providers win on
 * key conflicts unless the orchestrator applies a custom merge strategy.
 *
 * Implementations must be safe to call concurrently for the same `serviceId`.
 */
export interface ServiceDetailsProvider {
  getDetails(serviceId: string): Promise<Partial<EnrichedServiceDetails>>;
}
