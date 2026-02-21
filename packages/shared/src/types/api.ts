/**
 * API request and response types for ServiceScape backend
 */

import type { Domain, Team, Service, Member, EngineeringManager } from './organization';
import type { Dependency } from './dependencies';

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Team detail response (includes members)
export interface TeamMemberDetail extends Member {
  email?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamDetailResponse extends Team {
  members: TeamMemberDetail[];
}

// Organization API types
export interface GetOrganizationResponse {
  domains: Domain[];
  teams: Team[];
  services: Service[];
  members: Member[];
  managers: EngineeringManager[];
  dependencies: Dependency[];
}

export interface CreateDomainRequest {
  name: string;
  metadata?: Record<string, any>;
}

export interface CreateTeamRequest {
  domainId: string;
  name: string;
  managerId?: string;
}

export interface CreateServiceRequest {
  teamId: string;
  name: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface CreateMemberRequest {
  name: string;
  role: string;
  teamId?: string;
}

export interface CreateDependencyRequest {
  fromServiceId: string;
  toServiceId: string;
  type: 'DECLARED' | 'OBSERVED';
  description?: string;
  metadata?: Record<string, any>;
}

// Update types (partial updates)
export type UpdateDomainRequest = Partial<CreateDomainRequest>;
export type UpdateTeamRequest = Partial<CreateTeamRequest>;
export type UpdateServiceRequest = Partial<CreateServiceRequest>;
export type UpdateMemberRequest = Partial<CreateMemberRequest>;
export type UpdateDependencyRequest = Partial<CreateDependencyRequest>;

// Query filter types
export interface ServiceFilters {
  teamId?: string;
  domainId?: string;
  search?: string;
}

export interface DependencyFilters {
  serviceId?: string;
  type?: 'DECLARED' | 'OBSERVED';
}

// Error response type
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  details?: any;
}
