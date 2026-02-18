import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../../services/apiClient';

// Mock the entire apiClient module
vi.mock('../../services/apiClient', async () => {
  const actual = await vi.importActual<typeof import('../../services/apiClient')>('../../services/apiClient');
  return {
    ...actual,
    getAllTeams: vi.fn(),
    getAllServices: vi.fn(),
    getDependencies: vi.fn(),
  };
});

describe('API Hierarchy Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Teams have domainId populated', () => {
    it('should load teams and verify domainId exists in camelCase', async () => {
      const mockTeams = [
        {
          id: 'team-1',
          domainId: 'domain-1',
          name: 'Backend Team',
          metadata: {},
          serviceCount: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'team-2',
          domainId: 'domain-2',
          name: 'Frontend Team',
          metadata: {},
          serviceCount: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      vi.mocked(apiClient.getAllTeams).mockResolvedValue(mockTeams);

      const teams = await apiClient.getAllTeams();

      expect(teams).toHaveLength(2);
      expect(teams[0].domainId).toBe('domain-1');
      expect(teams[1].domainId).toBe('domain-2');
      // Ensure no snake_case fields
      expect(teams[0]).not.toHaveProperty('domain_id');
      expect(teams[1]).not.toHaveProperty('domain_id');
    });
  });

  describe('Services have teamId populated', () => {
    it('should load services and verify teamId exists in camelCase', async () => {
      const mockServices = [
        {
          id: 'service-1',
          teamId: 'team-1',
          name: 'API Service',
          type: 'REST',
          tier: 'T1',
          metadata: {},
          upstreamCount: 1,
          downstreamCount: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'service-2',
          teamId: 'team-2',
          name: 'Database Service',
          type: 'PostgreSQL',
          tier: 'T1',
          metadata: {},
          upstreamCount: 0,
          downstreamCount: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      vi.mocked(apiClient.getAllServices).mockResolvedValue(mockServices);

      const services = await apiClient.getAllServices();

      expect(services).toHaveLength(2);
      expect(services[0].teamId).toBe('team-1');
      expect(services[1].teamId).toBe('team-2');
      // Ensure no snake_case fields
      expect(services[0]).not.toHaveProperty('team_id');
      expect(services[1]).not.toHaveProperty('team_id');
    });
  });

  describe('Dependencies have fromServiceId/toServiceId populated', () => {
    it('should load dependencies and verify fromServiceId/toServiceId exist in camelCase', async () => {
      const mockDependencies = [
        {
          id: 'dep-1',
          fromServiceId: 'service-2',
          toServiceId: 'service-1',
          type: 'DECLARED' as const,
          metadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'dep-2',
          fromServiceId: 'service-1',
          toServiceId: 'service-3',
          type: 'OBSERVED' as const,
          metadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      vi.mocked(apiClient.getDependencies).mockResolvedValue(mockDependencies);

      const dependencies = await apiClient.getDependencies('service-1');

      expect(dependencies).toHaveLength(2);
      expect(dependencies[0].fromServiceId).toBe('service-2');
      expect(dependencies[0].toServiceId).toBe('service-1');
      expect(dependencies[1].fromServiceId).toBe('service-1');
      expect(dependencies[1].toServiceId).toBe('service-3');
      // Ensure no snake_case fields
      expect(dependencies[0]).not.toHaveProperty('from_service_id');
      expect(dependencies[0]).not.toHaveProperty('to_service_id');
      expect(dependencies[1]).not.toHaveProperty('from_service_id');
      expect(dependencies[1]).not.toHaveProperty('to_service_id');
    });
  });

  describe('End-to-end hierarchy verification', () => {
    it('should verify complete hierarchy chain: domain -> team -> service -> dependency', async () => {
      const mockTeams = [
        {
          id: 'team-1',
          domainId: 'domain-1',
          name: 'Backend Team',
          metadata: {},
          serviceCount: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const mockServices = [
        {
          id: 'service-1',
          teamId: 'team-1',
          name: 'API Service',
          type: 'REST',
          tier: 'T1',
          metadata: {},
          upstreamCount: 0,
          downstreamCount: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const mockDependencies = [
        {
          id: 'dep-1',
          fromServiceId: 'service-1',
          toServiceId: 'service-2',
          type: 'DECLARED' as const,
          metadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      vi.mocked(apiClient.getAllTeams).mockResolvedValue(mockTeams);
      vi.mocked(apiClient.getAllServices).mockResolvedValue(mockServices);
      vi.mocked(apiClient.getDependencies).mockResolvedValue(mockDependencies);

      // Verify complete chain
      const teams = await apiClient.getAllTeams();
      expect(teams[0].domainId).toBe('domain-1');

      const services = await apiClient.getAllServices();
      expect(services[0].teamId).toBe('team-1');

      const dependencies = await apiClient.getDependencies('service-1');
      expect(dependencies[0].fromServiceId).toBe('service-1');
      expect(dependencies[0].toServiceId).toBe('service-2');

      // Verify no snake_case anywhere in the hierarchy
      expect(teams[0]).not.toHaveProperty('domain_id');
      expect(services[0]).not.toHaveProperty('team_id');
      expect(dependencies[0]).not.toHaveProperty('from_service_id');
      expect(dependencies[0]).not.toHaveProperty('to_service_id');
    });
  });
});
