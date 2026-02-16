import { randomUUID } from 'crypto';

interface GeneratedDependency {
  id: string;
  from_service_id: string;
  to_service_id: string;
  type: 'DECLARED' | 'OBSERVED';
  metadata: Record<string, any>;
}

interface ServiceInput {
  id: string;
  team_id: string | null;
}

interface TeamInput {
  id: string;
  domain_id: string | null;
}

export interface DependencyInput {
  services: ServiceInput[];
  teams: TeamInput[];
}

/**
 * Generate realistic dependency graph
 * - 80% within domain, 20% cross-domain
 * - Mix of DECLARED and OBSERVED
 * - Some standalone services (~30%)
 * - Average ~1.6 dependencies per service
 */
export function generateDependencies(
  services: ServiceInput[],
  teams: TeamInput[]
): GeneratedDependency[] {
  const dependencies: GeneratedDependency[] = [];
  const dependencySet = new Set<string>(); // Track "from-to" pairs to avoid duplicates

  // Build lookup maps
  const serviceToTeam = new Map<string, string>();
  const teamToDomain = new Map<string, string>();
  const domainServices = new Map<string, string[]>();

  services.forEach(service => {
    if (service.team_id) {
      serviceToTeam.set(service.id, service.team_id);
    }
  });

  teams.forEach(team => {
    if (team.domain_id) {
      teamToDomain.set(team.id, team.domain_id);
    }
  });

  // Group services by domain
  services.forEach(service => {
    const teamId = service.team_id;
    if (teamId) {
      const domainId = teamToDomain.get(teamId);
      if (domainId) {
        if (!domainServices.has(domainId)) {
          domainServices.set(domainId, []);
        }
        domainServices.get(domainId)!.push(service.id);
      }
    }
  });

  // Generate dependencies for each service
  services.forEach(service => {
    // 70% chance a service has dependencies
    if (Math.random() > 0.3) {
      const numDeps = weightedRandom([
        { value: 1, weight: 30 },
        { value: 2, weight: 35 },
        { value: 3, weight: 20 },
        { value: 4, weight: 10 },
        { value: 5, weight: 5 }
      ]);

      for (let i = 0; i < numDeps; i++) {
        const targetService = selectTargetService(
          service,
          serviceToTeam,
          teamToDomain,
          domainServices
        );

        if (targetService) {
          const depKey = `${service.id}->${targetService}`;
          if (!dependencySet.has(depKey)) {
            dependencySet.add(depKey);

            // 50% DECLARED, 50% OBSERVED
            const type: 'DECLARED' | 'OBSERVED' = Math.random() > 0.5 ? 'DECLARED' : 'OBSERVED';

            dependencies.push({
              id: `dependency-${randomUUID()}`,
              from_service_id: service.id,
              to_service_id: targetService,
              type,
              metadata: {
                protocol: ['HTTP', 'GRPC', 'MESSAGE_QUEUE', 'DATABASE'][Math.floor(Math.random() * 4)],
                criticality: ['HIGH', 'MEDIUM', 'LOW'][Math.floor(Math.random() * 3)]
              }
            });
          }
        }
      }
    }
  });

  return dependencies;
}

/**
 * Select a target service for dependency
 * 80% within same domain, 20% cross-domain
 */
function selectTargetService(
  sourceService: ServiceInput,
  serviceToTeam: Map<string, string>,
  teamToDomain: Map<string, string>,
  domainServices: Map<string, string[]>
): string | null {
  const sourceTeamId = serviceToTeam.get(sourceService.id);
  if (!sourceTeamId) return null;

  const sourceDomainId = teamToDomain.get(sourceTeamId);
  if (!sourceDomainId) return null;

  // 80% within domain, 20% cross-domain
  const withinDomain = Math.random() < 0.8;

  let candidateServices: string[] = [];

  if (withinDomain) {
    candidateServices = domainServices.get(sourceDomainId) || [];
  } else {
    // Select from different domain
    const otherDomains = Array.from(domainServices.keys()).filter(d => d !== sourceDomainId);
    if (otherDomains.length > 0) {
      const randomDomain = otherDomains[Math.floor(Math.random() * otherDomains.length)];
      candidateServices = domainServices.get(randomDomain) || [];
    }
  }

  // Filter out self
  candidateServices = candidateServices.filter(s => s !== sourceService.id);

  if (candidateServices.length === 0) return null;

  return candidateServices[Math.floor(Math.random() * candidateServices.length)];
}

/**
 * Weighted random selection
 */
function weightedRandom<T>(items: { value: T; weight: number }[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item.value;
    }
  }

  return items[items.length - 1].value;
}
