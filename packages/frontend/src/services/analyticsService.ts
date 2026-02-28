import type {
  BlastRadiusResult,
  ChangeImpactAnalysis,
  DomainHealthScore,
  GodServiceResult,
  GraphMetrics,
} from '@servicescape/shared';
import apiClient from './apiClient';

export const getMetrics = async (type: 'ALL' | 'DECLARED' | 'OBSERVED' = 'ALL') => {
  const response = await apiClient.get<GraphMetrics>('/analytics/metrics', {
    params: { type },
  });
  return response.data;
};

export const getGodServices = async (type: 'ALL' | 'DECLARED' | 'OBSERVED' = 'ALL') => {
  const response = await apiClient.get<GodServiceResult[]>('/analytics/god-services', {
    params: { type },
  });
  return response.data;
};

export const getBlastRadius = async (
  serviceId: string,
  type: 'ALL' | 'DECLARED' | 'OBSERVED' = 'ALL'
) => {
  const response = await apiClient.get<BlastRadiusResult>(`/services/${serviceId}/blast-radius`, {
    params: { type },
  });
  return response.data;
};

export const getDomainHealth = async (type: 'ALL' | 'DECLARED' | 'OBSERVED' = 'ALL') => {
  const response = await apiClient.get<DomainHealthScore[]>('/analytics/domain-health', {
    params: { type },
  });
  return response.data;
};

export const analyzeImpact = async (
  serviceId: string,
  changeType = 'CODE_CHANGE',
  type: 'ALL' | 'DECLARED' | 'OBSERVED' = 'ALL'
) => {
  const response = await apiClient.post<ChangeImpactAnalysis>(
    '/analytics/impact-analysis',
    { serviceId, changeType },
    { params: { type } }
  );
  return response.data;
};
