import axios from 'axios';
import { Domain, Team, Service } from '@servicescape/shared';

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

export const getTeams = async (domainId: string) => {
  const response = await apiClient.get<Team[]>(`/domains/${domainId}/teams`);
  return response.data;
};

export const getServices = async (teamId: string) => {
  const response = await apiClient.get<Service[]>(`/teams/${teamId}/services`);
  return response.data;
};

export default apiClient;
