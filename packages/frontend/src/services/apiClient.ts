import axios from 'axios';
import { Domain, Team, Service, Dependency } from '@servicescape/shared';
import type { Position3D } from '@servicescape/shared';

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

export const getDependencies = async (serviceId: string, type?: string): Promise<Dependency[]> => {
  const params = type ? { type } : {};
  // Backend now returns camelCase, so we can use the response directly
  const response = await apiClient.get<{ upstream: Dependency[]; downstream: Dependency[] }>(
    `/services/${serviceId}/dependencies`,
    { params }
  );
  
  const { upstream, downstream } = response.data;
  return [...upstream, ...downstream];
};

export const getLayout = async () => {
  const response = await apiClient.get<LayoutPositions>('/layout');
  return response.data;
};

/**
 * Layout positions returned from /api/layout endpoint
 * Maps entity IDs to their Position3D coordinates {x, y, z}
 */
export interface LayoutPositions {
  domains: Record<string, Position3D>;
  teams: Record<string, Position3D>;
  services: Record<string, Position3D>;
}

export default apiClient;
