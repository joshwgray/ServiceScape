import type { Pool } from 'pg';
import type { DbDependency, DependencyType } from '../db/schema.js';
import * as dependencyRepo from '../repositories/dependencyRepository.js';
import * as serviceRepo from '../repositories/serviceRepository.js';
import * as teamRepo from '../repositories/teamRepository.js';

export interface ServiceDependencies {
  upstream: DbDependency[];
  downstream: DbDependency[];
}

/**
 * Get dependencies for a specific service
 */
export async function getServiceDependencies(
  pool: Pool,
  serviceId: string,
  type?: DependencyType
): Promise<ServiceDependencies> {
  const upstream = await dependencyRepo.getUpstreamDependencies(pool, serviceId, type);
  const downstream = await dependencyRepo.getDownstreamDependencies(pool, serviceId, type);

  return {
    upstream,
    downstream,
  };
}

/**
 * Get dependencies for a team (aggregated from all services in the team)
 * Filters out internal team dependencies
 */
export async function getTeamDependencies(
  pool: Pool,
  teamId: string,
  type?: DependencyType
): Promise<ServiceDependencies> {
  // Get all services for this team
  const services = await serviceRepo.getServicesByTeamId(pool, teamId);
  const serviceIds = services.map((s) => s.id);

  const upstream: DbDependency[] = [];
  const downstream: DbDependency[] = [];

  // Collect all dependencies for team services
  for (const service of services) {
    const upstreamDeps = await dependencyRepo.getUpstreamDependencies(pool, service.id, type);
    const downstreamDeps = await dependencyRepo.getDownstreamDependencies(pool, service.id, type);

    // Filter out dependencies within the same team
    // For upstream: check to_service_id (the thing we depend ON)
    for (const dep of upstreamDeps) {
      const toService = await serviceRepo.getServiceById(pool, dep.to_service_id);
      if (toService && !serviceIds.includes(toService.id)) {
        upstream.push(dep);
      }
    }

    // For downstream: check from_service_id (the thing that depends on us)
    for (const dep of downstreamDeps) {
      const fromService = await serviceRepo.getServiceById(pool, dep.from_service_id);
      if (fromService && !serviceIds.includes(fromService.id)) {
        downstream.push(dep);
      }
    }
  }

  return {
    upstream,
    downstream,
  };
}

/**
 * Get dependencies for a domain (aggregated from all teams in the domain)
 * Filters out internal domain dependencies
 */
export async function getDomainDependencies(
  pool: Pool,
  domainId: string,
  type?: DependencyType
): Promise<ServiceDependencies> {
  // Get all teams for this domain
  const teams = await teamRepo.getTeamsByDomainId(pool, domainId);
  
  const upstream: DbDependency[] = [];
  const downstream: DbDependency[] = [];

  // Collect all service IDs for this domain
  const domainServiceIds: string[] = [];
  for (const team of teams) {
    const services = await serviceRepo.getServicesByTeamId(pool, team.id);
    domainServiceIds.push(...services.map((s) => s.id));
  }

  // Collect dependencies for all teams
  for (const team of teams) {
    const services = await serviceRepo.getServicesByTeamId(pool, team.id);

    for (const service of services) {
      const upstreamDeps = await dependencyRepo.getUpstreamDependencies(pool, service.id, type);
      const downstreamDeps = await dependencyRepo.getDownstreamDependencies(pool, service.id, type);

      // Filter out dependencies within the same domain
      // For upstream: check to_service_id (the thing we depend ON)
      for (const dep of upstreamDeps) {
        if (!domainServiceIds.includes(dep.to_service_id)) {
          const toService = await serviceRepo.getServiceById(pool, dep.to_service_id);
          if (toService && toService.team_id) {
            const toTeam = await teamRepo.getTeamById(pool, toService.team_id);
            if (toTeam && toTeam.domain_id !== domainId) {
              upstream.push(dep);
            }
          }
        }
      }

      // For downstream: check from_service_id (the thing that depends on us)
      for (const dep of downstreamDeps) {
        if (!domainServiceIds.includes(dep.from_service_id)) {
          const fromService = await serviceRepo.getServiceById(pool, dep.from_service_id);
          if (fromService && fromService.team_id) {
            const fromTeam = await teamRepo.getTeamById(pool, fromService.team_id);
            if (fromTeam && fromTeam.domain_id !== domainId) {
              downstream.push(dep);
            }
          }
        }
      }
    }
  }

  return {
    upstream,
    downstream,
  };
}
