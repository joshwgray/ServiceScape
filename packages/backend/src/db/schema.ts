/**
 * Database schema types matching PostgreSQL tables
 */

export interface DbDomain {
  id: string;
  name: string;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface DbTeam {
  id: string;
  domain_id: string | null;
  name: string;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface DbService {
  id: string;
  team_id: string | null;
  name: string;
  type: string | null;
  tier: string | null;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface DbMember {
  id: string;
  team_id: string | null;
  name: string;
  role: string;
  email: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DbDependency {
  id: string;
  from_service_id: string;
  to_service_id: string;
  type: 'DECLARED' | 'OBSERVED';
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export type DependencyType = 'DECLARED' | 'OBSERVED';

export type LayoutType = 'DOMAIN_GRID' | 'TEAM_TREEMAP' | 'SERVICE_STACK';

export interface DbLayoutCache {
  id: string;
  cache_key: string;
  layout_type: LayoutType;
  positions: Record<string, any>;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  expires_at: Date | null;
}
