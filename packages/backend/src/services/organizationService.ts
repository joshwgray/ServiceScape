import type { Pool } from 'pg';
import * as domainRepo from '../repositories/domainRepository.js';
import * as teamRepo from '../repositories/teamRepository.js';
import * as serviceRepo from '../repositories/serviceRepository.js';
import * as memberRepo from '../repositories/memberRepository.js';
import * as dependencyRepo from '../repositories/dependencyRepository.js';

/**
 * Domain with computed fields
 */
export interface DomainWithMetadata {
  id: string;
  name: string;
  metadata: Record<string, any>;
  teamCount: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Team with computed fields
 */
export interface TeamWithMetadata {
  id: string;
  domain_id: string | null;
  name: string;
  metadata: Record<string, any>;
  serviceCount: number;
  members?: MemberInfo[];
  created_at: Date;
  updated_at: Date;
}

/**
 * Service with computed fields
 */
export interface ServiceWithMetadata {
  id: string;
  team_id: string | null;
  name: string;
  type: string | null;
  tier: string | null;
  metadata: Record<string, any>;
  upstreamCount: number;
  downstreamCount: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Member info
 */
export interface MemberInfo {
  id: string;
  team_id: string | null;
  name: string;
  role: string;
  email: string | null;
}

/**
 * Get all domains with team counts
 */
export async function getDomains(pool: Pool): Promise<DomainWithMetadata[]> {
  const domains = await domainRepo.getAllDomains(pool);

  const domainsWithMetadata = await Promise.all(
    domains.map(async (domain) => {
      const teams = await teamRepo.getTeamsByDomainId(pool, domain.id);
      return {
        ...domain,
        teamCount: teams.length,
      };
    })
  );

  return domainsWithMetadata;
}

/**
 * Get a single domain by ID with metadata
 */
export async function getDomainById(
  pool: Pool,
  id: string
): Promise<DomainWithMetadata | null> {
  const domain = await domainRepo.getDomainById(pool, id);

  if (!domain) {
    return null;
  }

  const teams = await teamRepo.getTeamsByDomainId(pool, domain.id);

  return {
    ...domain,
    teamCount: teams.length,
  };
}

/**
 * Get all teams for a domain with service counts
 */
export async function getTeamsByDomain(pool: Pool, domainId: string): Promise<TeamWithMetadata[]> {
  const teams = await teamRepo.getTeamsByDomainId(pool, domainId);

  const teamsWithMetadata = await Promise.all(
    teams.map(async (team) => {
      const services = await serviceRepo.getServicesByTeamId(pool, team.id);
      return {
        ...team,
        serviceCount: services.length,
      };
    })
  );

  return teamsWithMetadata;
}

/**
 * Get a single team by ID with members and service count
 */
export async function getTeamById(pool: Pool, id: string): Promise<TeamWithMetadata | null> {
  const team = await teamRepo.getTeamById(pool, id);

  if (!team) {
    return null;
  }

  const [members, services] = await Promise.all([
    memberRepo.getMembersByTeamId(pool, team.id),
    serviceRepo.getServicesByTeamId(pool, team.id),
  ]);

  return {
    ...team,
    serviceCount: services.length,
    members: members.map((m) => ({
      id: m.id,
      team_id: m.team_id,
      name: m.name,
      role: m.role,
      email: m.email,
    })),
  };
}

/**
 * Get all services for a team with dependency counts
 */
export async function getServicesByTeam(
  pool: Pool,
  teamId: string
): Promise<ServiceWithMetadata[]> {
  const services = await serviceRepo.getServicesByTeamId(pool, teamId);

  const servicesWithMetadata = await Promise.all(
    services.map(async (service) => {
      const [upstreamCount, downstreamCount] = await Promise.all([
        dependencyRepo.getUpstreamDependencyCount(pool, service.id),
        dependencyRepo.getDownstreamDependencyCount(pool, service.id),
      ]);

      return {
        ...service,
        upstreamCount,
        downstreamCount,
      };
    })
  );

  return servicesWithMetadata;
}

/**
 * Get a single service by ID with dependency counts
 */
export async function getServiceById(
  pool: Pool,
  id: string
): Promise<ServiceWithMetadata | null> {
  const service = await serviceRepo.getServiceById(pool, id);

  if (!service) {
    return null;
  }

  const [upstreamCount, downstreamCount] = await Promise.all([
    dependencyRepo.getUpstreamDependencyCount(pool, service.id),
    dependencyRepo.getDownstreamDependencyCount(pool, service.id),
  ]);

  return {
    ...service,
    upstreamCount,
    downstreamCount,
  };
}
