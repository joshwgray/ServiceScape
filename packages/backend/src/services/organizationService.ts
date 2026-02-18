import type { Pool } from 'pg';
import * as domainRepo from '../repositories/domainRepository.js';
import * as teamRepo from '../repositories/teamRepository.js';
import * as serviceRepo from '../repositories/serviceRepository.js';
import * as memberRepo from '../repositories/memberRepository.js';
import * as dependencyRepo from '../repositories/dependencyRepository.js';
import {
  convertDomainResponse,
  convertTeamResponse,
  convertServiceResponse,
  convertMemberResponse,
  type Domain,
  type Team,
  type Service,
  type Member,
} from '../utils/caseConverters.js';

/**
 * Domain with computed fields (camelCase response type)
 */
export interface DomainWithMetadata extends Domain {
  teamCount: number;
}

/**
 * Team with computed fields (camelCase response type)
 */
export interface TeamWithMetadata extends Team {
  serviceCount: number;
  members?: Member[];
}

/**
 * Service with computed fields (camelCase response type)
 */
export interface ServiceWithMetadata extends Service {
  upstreamCount: number;
  downstreamCount: number;
}

/**
 * Get all domains with team counts
 */
export async function getDomains(pool: Pool): Promise<DomainWithMetadata[]> {
  const domains = await domainRepo.getAllDomains(pool);

  const domainsWithMetadata = await Promise.all(
    domains.map(async (domain) => {
      const teams = await teamRepo.getTeamsByDomainId(pool, domain.id);
      const convertedDomain = convertDomainResponse(domain);
      return {
        ...convertedDomain,
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
  const convertedDomain = convertDomainResponse(domain);

  return {
    ...convertedDomain,
    teamCount: teams.length,
  };
}

/**
 * Get all teams with service counts
 */
export async function getAllTeams(pool: Pool): Promise<TeamWithMetadata[]> {
  const teams = await teamRepo.getAllTeams(pool);

  const teamsWithMetadata = await Promise.all(
    teams.map(async (team) => {
      const services = await serviceRepo.getServicesByTeamId(pool, team.id);
      const convertedTeam = convertTeamResponse(team);
      return {
        ...convertedTeam,
        serviceCount: services.length,
      };
    })
  );

  return teamsWithMetadata;
}

/**
 * Get all teams for a domain with service counts
 */
export async function getTeamsByDomain(pool: Pool, domainId: string): Promise<TeamWithMetadata[]> {
  const teams = await teamRepo.getTeamsByDomainId(pool, domainId);

  const teamsWithMetadata = await Promise.all(
    teams.map(async (team) => {
      const services = await serviceRepo.getServicesByTeamId(pool, team.id);
      const convertedTeam = convertTeamResponse(team);
      return {
        ...convertedTeam,
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

  const convertedTeam = convertTeamResponse(team);
  const convertedMembers = members.map(convertMemberResponse);

  return {
    ...convertedTeam,
    serviceCount: services.length,
    members: convertedMembers,
  };
}

/**
 * Get all services with dependency counts
 */
export async function getAllServices(pool: Pool): Promise<ServiceWithMetadata[]> {
  const services = await serviceRepo.getAllServices(pool);

  const servicesWithMetadata = await Promise.all(
    services.map(async (service) => {
      const [upstreamCount, downstreamCount] = await Promise.all([
        dependencyRepo.getUpstreamDependencyCount(pool, service.id),
        dependencyRepo.getDownstreamDependencyCount(pool, service.id),
      ]);

      const convertedService = convertServiceResponse(service);
      return {
        ...convertedService,
        upstreamCount,
        downstreamCount,
      };
    })
  );

  return servicesWithMetadata;
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

      const convertedService = convertServiceResponse(service);
      return {
        ...convertedService,
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

  const convertedService = convertServiceResponse(service);

  return {
    ...convertedService,
    upstreamCount,
    downstreamCount,
  };
}
