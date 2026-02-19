import type { Service } from '@servicescape/shared';
import type { EnrichedServiceDetails, ServiceDetailsProvider, ServiceLink } from './types';

/**
 * Provider that extracts enrichment data from Service.metadata fields.
 *
 * This provider demonstrates the extensibility pattern by mapping well-known
 * metadata keys to EnrichedServiceDetails fields:
 *  - `metadata.owner` → `owner`
 *  - `metadata.tiers` → `tiers`
 *  - `metadata.members` → `members`
 *  - `metadata.links` → `links`
 *
 * All extractions are validated for type safety. Invalid or missing metadata
 * fields are gracefully ignored (returns undefined for those fields).
 *
 * @example
 * ```ts
 * const services: Service[] = [
 *   {
 *     id: 'svc-1',
 *     teamId: 'team-1',
 *     name: 'Auth Service',
 *     metadata: {
 *       owner: 'platform-team',
 *       tiers: ['tier-1', 'tier-2'],
 *       members: ['alice@example.com', 'bob@example.com'],
 *       links: [
 *         { label: 'Runbook', url: 'https://runbook.example.com/auth' },
 *       ],
 *     },
 *   },
 * ];
 *
 * const provider = new MetadataProvider(services);
 * const details = await provider.getDetails('svc-1');
 * // Returns: { owner: 'platform-team', tiers: [...], members: [...], links: [...] }
 * ```
 */
export class MetadataProvider implements ServiceDetailsProvider {
  private readonly services: Service[];

  constructor(services: Service[]) {
    this.services = services;
  }

  async getDetails(serviceId: string): Promise<Partial<EnrichedServiceDetails>> {
    const service = this.services.find((s) => s.id === serviceId);

    if (!service || !service.metadata) {
      return {};
    }

    const result: Partial<EnrichedServiceDetails> = {};

    // Extract owner (must be a string)
    if (typeof service.metadata.owner === 'string') {
      result.owner = service.metadata.owner;
    }

    // Extract tiers (must be an array of strings)
    if (Array.isArray(service.metadata.tiers) && this.isStringArray(service.metadata.tiers)) {
      result.tiers = service.metadata.tiers;
    }

    // Extract members (must be an array of strings)
    if (Array.isArray(service.metadata.members) && this.isStringArray(service.metadata.members)) {
      result.members = service.metadata.members;
    }

    // Extract links (must be an array of valid ServiceLink objects)
    if (Array.isArray(service.metadata.links)) {
      const validLinks = service.metadata.links.filter(this.isValidServiceLink);
      if (validLinks.length > 0) {
        result.links = validLinks;
      }
    }

    return result;
  }

  /**
   * Type guard to check if a value is an array of strings.
   */
  private isStringArray(value: any[]): value is string[] {
    return value.every((item) => typeof item === 'string');
  }

  /**
   * Type guard to check if a value is a valid ServiceLink.
   */
  private isValidServiceLink(value: any): value is ServiceLink {
    return (
      typeof value === 'object' &&
      value !== null &&
      typeof value.label === 'string' &&
      typeof value.url === 'string'
    );
  }
}
