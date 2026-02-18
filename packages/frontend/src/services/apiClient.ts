import axios from 'axios';
import { Domain, Team, Service, Dependency, DependencyType } from '@servicescape/shared';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getDomains = async () => {
  const response = await apiClient.get<Domain[]>('/domains');
  return response.data;
};

export const getAllTeams = async () => {
  const response = await apiClient.get<Team[]>('/teams');
  return response.data;
};

export const getAllServices = async () => {
  const response = await apiClient.get<Service[]>('/services');
  return response.data;
};

export const getTeams = async (domainId: string) => {
  const response = await apiClient.get<Team[]>(`/domains/${domainId}/teams`);
  return response.data;
};

export const getServices = async (teamId: string) => {
  const response = await apiClient.get<Service[]>(`/teams/${teamId}/services`);
  return response.data;
};

export interface BackendDependency {
  id: string;
  from_service_id: string;
  to_service_id: string;
  type: string;
  metadata?: Record<string, any>;
}

export interface BackendDependenciesResponse {
  upstream: BackendDependency[];
  downstream: BackendDependency[];
}

export const getDependencies = async (serviceId: string, type?: string): Promise<Dependency[]> => {
  const params = type ? { type } : {};
  // The backend returns { upstream: [], downstream: [] } with snake_case fields
  const response = await apiClient.get<BackendDependenciesResponse>(`/services/${serviceId}/dependencies`, { params });
  
  const { upstream, downstream } = response.data;
  const allDeps = [...upstream, ...downstream];

  // Map to frontend model (camelCase)
  return allDeps.map((dep) => ({
    id: dep.id,
    fromServiceId: dep.from_service_id,
    toServiceId: dep.to_service_id,
    type: dep.type as DependencyType,
    metadata: dep.metadata,
  }));
};

export const getLayout = async () => {
  const response = await apiClient.get<LayoutPositions>('/layout');
  return response.data;
};

export interface Position3D {
  x: number;
  y: number;
  z: number;
}
export interface LayoutPositions {
  domains: Record<string, Position3D>;
  teams: Record<string, Position3D>;
  services: Record<string, Position3D>;
}

export default apiClient;
