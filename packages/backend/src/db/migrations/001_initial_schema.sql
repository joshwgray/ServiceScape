-- Initial schema for ServiceScape
-- Creates tables for domains, teams, services, members, and dependencies

-- Domains table
CREATE TABLE domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services table
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  tier VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Members table
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dependencies table
CREATE TABLE dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  to_service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('DECLARED', 'OBSERVED')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for foreign keys and common queries
CREATE INDEX idx_teams_domain_id ON teams(domain_id);
CREATE INDEX idx_services_team_id ON services(team_id);
CREATE INDEX idx_members_team_id ON members(team_id);
CREATE INDEX idx_dependencies_from_service ON dependencies(from_service_id);
CREATE INDEX idx_dependencies_to_service ON dependencies(to_service_id);
CREATE INDEX idx_dependencies_type ON dependencies(type);

-- Composite indexes for dependency queries
CREATE INDEX idx_dependencies_from_to ON dependencies(from_service_id, to_service_id);
CREATE INDEX idx_dependencies_type_from ON dependencies(type, from_service_id);
