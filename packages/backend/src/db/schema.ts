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
