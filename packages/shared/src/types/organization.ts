/**
 * Core organization structure types for ServiceScape
 */

export interface Domain {
  id: string;
  name: string;
  metadata?: Record<string, any>;
}

export interface Team {
  id: string;
  domainId: string;
  name: string;
  managerId?: string;
}

export interface Service {
  id: string;
  teamId: string;
  name: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface Member {
  id: string;
  name: string;
  role: string;
  teamId?: string;
}

export interface EngineeringManager {
  id: string;
  name: string;
  teamIds: string[];
}
