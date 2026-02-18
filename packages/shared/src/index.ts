/**
 * Shared types index - exports all type definitions
 */

export const SHARED_VERSION = '1.0.0';

// Organization types
export type {
  Domain,
  Team,
  Service,
  Member,
  EngineeringManager,
} from './types/organization';

// Dependency types
export type {
  Dependency,
  DependencyType,
} from './types/dependencies';
export { DEPENDENCY_TYPES } from './types/dependencies';

// Layout types
export type {
  Position3D,
  BoundingBox,
  LayoutItem,
} from './types/layout';

// API types
export type {
  PaginationParams,
  PaginatedResponse,
  GetOrganizationResponse,
  CreateDomainRequest,
  CreateTeamRequest,
  CreateServiceRequest,
  CreateMemberRequest,
  CreateDependencyRequest,
  UpdateDomainRequest,
  UpdateTeamRequest,
  UpdateServiceRequest,
  UpdateMemberRequest,
  UpdateDependencyRequest,
  ServiceFilters,
  DependencyFilters,
  ErrorResponse,
} from './types/api';
