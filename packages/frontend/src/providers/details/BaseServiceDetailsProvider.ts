import type { Service } from '@servicescape/shared';
import type { EnrichedServiceDetails, ServiceDetailsProvider } from './types';

/**
 * Base provider that supplies fundamental service information from the
 * in-memory services array (id, name, description, teamId).
 */
export class BaseServiceDetailsProvider implements ServiceDetailsProvider {
  private readonly services: Service[];

  constructor(services: Service[]) {
    this.services = services;
  }

  async getDetails(serviceId: string): Promise<Partial<EnrichedServiceDetails>> {
    const service = this.services.find((s) => s.id === serviceId);

    if (!service) {
      return {};
    }

    return {
      id: service.id,
      name: service.name,
      teamId: service.teamId,
      ...(service.description !== undefined && { description: service.description }),
      ...(service.metadata !== undefined && { metadata: service.metadata }),
    };
  }
}
