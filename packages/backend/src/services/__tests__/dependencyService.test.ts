import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Pool } from 'pg';
import {
  getServiceDependencies,
  getTeamDependencies,
  getDomainDependencies,
} from '../dependencyService.js';
import * as dependencyRepo from '../../repositories/dependencyRepository.js';
import * as serviceRepo from '../../repositories/serviceRepository.js';
import * as teamRepo from '../../repositories/teamRepository.js';
import type { DbDependency, DbService, DbTeam } from '../../db/schema.js';

vi.mock('../../repositories/dependencyRepository.js');
vi.mock('../../repositories/serviceRepository.js');
vi.mock('../../repositories/teamRepository.js');

describe('Dependency Service', () => {
  let mockPool: Pool;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPool = {} as Pool;
  });

  describe('getServiceDependencies', () => {
    it('should return upstream and downstream dependencies for a service', async () => {
      // Upstream: service-1 depends on service-2 (from_service_id = service-1)
      const mockUpstream: DbDependency[] = [
        {
          id: 'dep-1',
          from_service_id: 'service-1',
          to_service_id: 'service-2',
          type: 'DECLARED',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Downstream: service-3 depends on service-1 (to_service_id = service-1)
      const mockDownstream: DbDependency[] = [
        {
          id: 'dep-2',
          from_service_id: 'service-3',
          to_service_id: 'service-1',
          type: 'OBSERVED',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      vi.mocked(dependencyRepo.getUpstreamDependencies).mockResolvedValue(mockUpstream);
      vi.mocked(dependencyRepo.getDownstreamDependencies).mockResolvedValue(mockDownstream);

      const result = await getServiceDependencies(mockPool, 'service-1');

      expect(result).toEqual({
        upstream: mockUpstream,
        downstream: mockDownstream,
      });
      expect(dependencyRepo.getUpstreamDependencies).toHaveBeenCalledWith(
        mockPool,
        'service-1',
        undefined
      );
      expect(dependencyRepo.getDownstreamDependencies).toHaveBeenCalledWith(
        mockPool,
        'service-1',
        undefined
      );
    });

    it('should filter by dependency type when provided', async () => {
      vi.mocked(dependencyRepo.getUpstreamDependencies).mockResolvedValue([]);
      vi.mocked(dependencyRepo.getDownstreamDependencies).mockResolvedValue([]);

      await getServiceDependencies(mockPool, 'service-1', 'DECLARED');

      expect(dependencyRepo.getUpstreamDependencies).toHaveBeenCalledWith(
        mockPool,
        'service-1',
        'DECLARED'
      );
      expect(dependencyRepo.getDownstreamDependencies).toHaveBeenCalledWith(
        mockPool,
        'service-1',
        'DECLARED'
      );
    });
  });

  describe('getTeamDependencies', () => {
    it('should aggregate upstream dependencies and filter out internal team deps', async () => {
      // Team-1 has service-1 and service-2
      const mockServices: DbService[] = [
        {
          id: 'service-1',
          team_id: 'team-1',
          name: 'Service 1',
          type: 'REST',
          tier: 'T1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'service-2',
          team_id: 'team-1',
          name: 'Service 2',
          type: 'REST',
          tier: 'T1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // service-1 upstream deps: depends ON service-3 (external) and service-2 (internal)
      const service1UpstreamDeps: DbDependency[] = [
        {
          id: 'dep-1',
          from_service_id: 'service-1', // from_service_id = queried service
          to_service_id: 'service-3',   // to_service_id = external dependency
          type: 'DECLARED',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'dep-2',
          from_service_id: 'service-1',
          to_service_id: 'service-2',   // to_service_id = internal (should be filtered)
          type: 'DECLARED',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const externalService: DbService = {
        id: 'service-3',
        team_id: 'team-2',
        name: 'Service 3',
        type: 'REST',
        tier: 'T1',
        metadata: {},
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(serviceRepo.getServicesByTeamId).mockResolvedValue(mockServices);
      vi.mocked(dependencyRepo.getUpstreamDependencies)
        .mockImplementation(async (pool, serviceId) => {
          if (serviceId === 'service-1') return service1UpstreamDeps;
          return [];
        });
      vi.mocked(dependencyRepo.getDownstreamDependencies).mockResolvedValue([]);
      vi.mocked(serviceRepo.getServiceById)
        .mockImplementation(async (pool, id) => {
          if (id === 'service-3') return externalService;
          return mockServices.find(s => s.id === id) || null;
        });

      const result = await getTeamDependencies(mockPool, 'team-1');

      // Should only include external upstream dependency (service-1 -> service-3)
      expect(result.upstream).toHaveLength(1);
      expect(result.upstream[0].to_service_id).toBe('service-3');
      expect(result.downstream).toHaveLength(0);
    });

    it('should aggregate downstream dependencies and filter out internal team deps', async () => {
      // Team-1 has service-1 and service-2
      const mockServices: DbService[] = [
        {
          id: 'service-1',
          team_id: 'team-1',
          name: 'Service 1',
          type: 'REST',
          tier: 'T1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'service-2',
          team_id: 'team-1',
          name: 'Service 2',
          type: 'REST',
          tier: 'T1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // service-1 downstream deps: service-3 (external) and service-2 (internal) depend ON service-1
      const service1DownstreamDeps: DbDependency[] = [
        {
          id: 'dep-1',
          from_service_id: 'service-3',  // from_service_id = external dependent
          to_service_id: 'service-1',    // to_service_id = queried service
          type: 'DECLARED',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'dep-2',
          from_service_id: 'service-2',  // from_service_id = internal (should be filtered)
          to_service_id: 'service-1',
          type: 'DECLARED',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const externalService: DbService = {
        id: 'service-3',
        team_id: 'team-2',
        name: 'Service 3',
        type: 'REST',
        tier: 'T1',
        metadata: {},
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(serviceRepo.getServicesByTeamId).mockResolvedValue(mockServices);
      vi.mocked(dependencyRepo.getUpstreamDependencies).mockResolvedValue([]);
      vi.mocked(dependencyRepo.getDownstreamDependencies)
        .mockImplementation(async (pool, serviceId) => {
          if (serviceId === 'service-1') return service1DownstreamDeps;
          return [];
        });
      vi.mocked(serviceRepo.getServiceById)
        .mockImplementation(async (pool, id) => {
          if (id === 'service-3') return externalService;
          return mockServices.find(s => s.id === id) || null;
        });

      const result = await getTeamDependencies(mockPool, 'team-1');

      // Should only include external downstream dependency (service-3 -> service-1)
      expect(result.upstream).toHaveLength(0);
      expect(result.downstream).toHaveLength(1);
      expect(result.downstream[0].from_service_id).toBe('service-3');
    });

  });

  describe('getDomainDependencies', () => {
    it('should aggregate upstream dependencies and filter out internal domain deps', async () => {
      const mockTeams: DbTeam[] = [
        {
          id: 'team-1',
          domain_id: 'domain-1',
          name: 'Team 1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const mockServices: DbService[] = [
        {
          id: 'service-1',
          team_id: 'team-1',
          name: 'Service 1',
          type: 'REST',
          tier: 'T1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // service-1 depends ON service-2 (external to domain)
      const mockDeps: DbDependency[] = [
        {
          id: 'dep-1',
          from_service_id: 'service-1',  // from_service_id = queried service
          to_service_id: 'service-2',    // to_service_id = external dependency
          type: 'DECLARED',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const externalService: DbService = {
        id: 'service-2',
        team_id: 'team-2',
        name: 'Service 2',
        type: 'REST',
        tier: 'T1',
        metadata: {},
        created_at: new Date(),
        updated_at: new Date(),
      };

      const externalTeam: DbTeam = {
        id: 'team-2',
        domain_id: 'domain-2',
        name: 'Team 2',
        metadata: {},
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(teamRepo.getTeamsByDomainId).mockResolvedValue(mockTeams);
      vi.mocked(serviceRepo.getServicesByTeamId).mockResolvedValue(mockServices);
      vi.mocked(dependencyRepo.getUpstreamDependencies).mockResolvedValue(mockDeps);
      vi.mocked(dependencyRepo.getDownstreamDependencies).mockResolvedValue([]);
      vi.mocked(serviceRepo.getServiceById).mockResolvedValue(externalService);
      vi.mocked(teamRepo.getTeamById).mockResolvedValue(externalTeam);

      const result = await getDomainDependencies(mockPool, 'domain-1');

      expect(result.upstream).toHaveLength(1);
      expect(result.downstream).toHaveLength(0);
    });

    it('should aggregate downstream dependencies and filter out internal domain deps', async () => {
      const mockTeams: DbTeam[] = [
        {
          id: 'team-1',
          domain_id: 'domain-1',
          name: 'Team 1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const mockServices: DbService[] = [
        {
          id: 'service-1',
          team_id: 'team-1',
          name: 'Service 1',
          type: 'REST',
          tier: 'T1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // service-2 depends ON service-1 (external dependent)
      const mockDeps: DbDependency[] = [
        {
          id: 'dep-1',
          from_service_id: 'service-2',  // from_service_id = external dependent
          to_service_id: 'service-1',    // to_service_id = queried service
          type: 'DECLARED',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const externalService: DbService = {
        id: 'service-2',
        team_id: 'team-2',
        name: 'Service 2',
        type: 'REST',
        tier: 'T1',
        metadata: {},
        created_at: new Date(),
        updated_at: new Date(),
      };

      const externalTeam: DbTeam = {
        id: 'team-2',
        domain_id: 'domain-2',
        name: 'Team 2',
        metadata: {},
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(teamRepo.getTeamsByDomainId).mockResolvedValue(mockTeams);
      vi.mocked(serviceRepo.getServicesByTeamId).mockResolvedValue(mockServices);
      vi.mocked(dependencyRepo.getUpstreamDependencies).mockResolvedValue([]);
      vi.mocked(dependencyRepo.getDownstreamDependencies).mockResolvedValue(mockDeps);
      vi.mocked(serviceRepo.getServiceById).mockResolvedValue(externalService);
      vi.mocked(teamRepo.getTeamById).mockResolvedValue(externalTeam);

      const result = await getDomainDependencies(mockPool, 'domain-1');

      expect(result.upstream).toHaveLength(0);
      expect(result.downstream).toHaveLength(1);
    });

    it('should filter out internal domain dependencies across teams', async () => {
      const mockTeams: DbTeam[] = [
        {
          id: 'team-1',
          domain_id: 'domain-1',
          name: 'Team 1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'team-2',
          domain_id: 'domain-1',
          name: 'Team 2',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const mockServices1: DbService[] = [
        {
          id: 'service-1',
          team_id: 'team-1',
          name: 'Service 1',
          type: 'REST',
          tier: 'T1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const mockServices2: DbService[] = [
        {
          id: 'service-2',
          team_id: 'team-2',
          name: 'Service 2',
          type: 'REST',
          tier: 'T1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // service-1 depends ON service-2 (both in domain-1, should be filtered)
      const mockDeps: DbDependency[] = [
        {
          id: 'dep-1',
          from_service_id: 'service-1',  // from_service_id = queried service
          to_service_id: 'service-2',    // to_service_id = internal to domain
          type: 'DECLARED',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const internalService: DbService = {
        id: 'service-2',
        team_id: 'team-2',
        name: 'Service 2',
        type: 'REST',
        tier: 'T1',
        metadata: {},
        created_at: new Date(),
        updated_at: new Date(),
      };

      const internalTeam: DbTeam = {
        id: 'team-2',
        domain_id: 'domain-1',
        name: 'Team 2',
        metadata: {},
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(teamRepo.getTeamsByDomainId).mockResolvedValue(mockTeams);
      vi.mocked(serviceRepo.getServicesByTeamId)
        .mockResolvedValueOnce(mockServices1)
        .mockResolvedValueOnce(mockServices2);
      vi.mocked(dependencyRepo.getUpstreamDependencies).mockResolvedValue(mockDeps);
      vi.mocked(dependencyRepo.getDownstreamDependencies).mockResolvedValue([]);
      vi.mocked(serviceRepo.getServiceById).mockResolvedValue(internalService);
      vi.mocked(teamRepo.getTeamById).mockResolvedValue(internalTeam);

      const result = await getDomainDependencies(mockPool, 'domain-1');

      // Should filter out internal dependencies
      expect(result.upstream).toHaveLength(0);
      expect(result.downstream).toHaveLength(0);
    });
  });
});
