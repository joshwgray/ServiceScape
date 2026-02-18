/**
 * Case conversion utilities for transforming database entities (snake_case)
 * to API responses (camelCase).
 *
 * Note: Metadata object keys are preserved as-is and not converted.
 */

import type { DbDomain, DbTeam, DbService, DbMember, DbDependency } from '../db/schema';

export interface Domain {
  id: string;
  name: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  domainId: string | null;
  name: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: string;
  teamId: string | null;
  name: string;
  type: string | null;
  tier: string | null;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Member {
  id: string;
  teamId: string | null;
  name: string;
  role: string;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Dependency {
  id: string;
  fromServiceId: string;
  toServiceId: string;
  type: 'DECLARED' | 'OBSERVED';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Converts a DbDomain (snake_case) to Domain (camelCase)
 */
export function convertDomainResponse(dbDomain: DbDomain): Domain {
  return {
    id: dbDomain.id,
    name: dbDomain.name,
    metadata: dbDomain.metadata,
    createdAt: dbDomain.created_at,
    updatedAt: dbDomain.updated_at,
  };
}

/**
 * Converts a DbTeam (snake_case) to Team (camelCase)
 */
export function convertTeamResponse(dbTeam: DbTeam): Team {
  return {
    id: dbTeam.id,
    domainId: dbTeam.domain_id,
    name: dbTeam.name,
    metadata: dbTeam.metadata,
    createdAt: dbTeam.created_at,
    updatedAt: dbTeam.updated_at,
  };
}

/**
 * Converts a DbService (snake_case) to Service (camelCase)
 */
export function convertServiceResponse(dbService: DbService): Service {
  return {
    id: dbService.id,
    teamId: dbService.team_id,
    name: dbService.name,
    type: dbService.type,
    tier: dbService.tier,
    metadata: dbService.metadata,
    createdAt: dbService.created_at,
    updatedAt: dbService.updated_at,
  };
}

/**
 * Converts a DbMember (snake_case) to Member (camelCase)
 */
export function convertMemberResponse(dbMember: DbMember): Member {
  return {
    id: dbMember.id,
    teamId: dbMember.team_id,
    name: dbMember.name,
    role: dbMember.role,
    email: dbMember.email,
    createdAt: dbMember.created_at,
    updatedAt: dbMember.updated_at,
  };
}

/**
 * Converts a DbDependency (snake_case) to Dependency (camelCase)
 */
export function convertDependencyResponse(dbDependency: DbDependency): Dependency {
  return {
    id: dbDependency.id,
    fromServiceId: dbDependency.from_service_id,
    toServiceId: dbDependency.to_service_id,
    type: dbDependency.type,
    metadata: dbDependency.metadata,
    createdAt: dbDependency.created_at,
    updatedAt: dbDependency.updated_at,
  };
}
