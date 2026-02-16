import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Pool } from 'pg';
import {
  getDomains,
  getDomainById,
  getTeamsByDomain,
  getTeamById,
  getServicesByTeam,
  getServiceById,
} from '../organizationService.js';
import * as domainRepo from '../../repositories/domainRepository.js';
import * as teamRepo from '../../repositories/teamRepository.js';
import * as serviceRepo from '../../repositories/serviceRepository.js';
import * as memberRepo from '../../repositories/memberRepository.js';
import * as dependencyRepo from '../../repositories/dependencyRepository.js';
import type { DbDomain, DbTeam, DbService, DbMember } from '../../db/schema.js';

vi.mock('../../repositories/domainRepository.js');
vi.mock('../../repositories/teamRepository.js');
vi.mock('../../repositories/serviceRepository.js');
vi.mock('../../repositories/memberRepository.js');
vi.mock('../../repositories/dependencyRepository.js');

describe('Organization Service', () => {
  let mockPool: Pool;

  beforeEach(() => {
    mockPool = {} as Pool;
    vi.clearAllMocks();
  });

  describe('getDomains', () => {
    it('should call domainRepository and return domains', async () => {
      const mockDomains: DbDomain[] = [
        {
          id: 'domain-1',
          name: 'Engineering',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      vi.mocked(domainRepo.getAllDomains).mockResolvedValue(mockDomains);
      vi.mocked(teamRepo.getTeamsByDomainId).mockResolvedValue([]);

      const result = await getDomains(mockPool);

      expect(result).toHaveLength(1);
      expect(domainRepo.getAllDomains).toHaveBeenCalledWith(mockPool);
    });

    it('should include team counts for each domain', async () => {
      const mockDomains: DbDomain[] = [
        {
          id: 'domain-1',
          name: 'Engineering',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const mockTeams: DbTeam[] = [
        {
          id: 'team-1',
          domain_id: 'domain-1',
          name: 'Backend',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'team-2',
          domain_id: 'domain-1',
          name: 'Frontend',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      vi.mocked(domainRepo.getAllDomains).mockResolvedValue(mockDomains);
      vi.mocked(teamRepo.getTeamsByDomainId).mockResolvedValue(mockTeams);

      const result = await getDomains(mockPool);

      expect(result[0]).toHaveProperty('teamCount', 2);
      expect(teamRepo.getTeamsByDomainId).toHaveBeenCalledWith(mockPool, 'domain-1');
    });
  });

  describe('getDomainById', () => {
    it('should call domainRepository and return domain with team count', async () => {
      const mockDomain: DbDomain = {
        id: 'domain-1',
        name: 'Engineering',
        metadata: {},
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(domainRepo.getDomainById).mockResolvedValue(mockDomain);
      vi.mocked(teamRepo.getTeamsByDomainId).mockResolvedValue([]);

      const result = await getDomainById(mockPool, 'domain-1');

      expect(result).toBeDefined();
      expect(result?.teamCount).toBe(0);
      expect(domainRepo.getDomainById).toHaveBeenCalledWith(mockPool, 'domain-1');
    });

    it('should return null when domain not found', async () => {
      vi.mocked(domainRepo.getDomainById).mockResolvedValue(null);

      const result = await getDomainById(mockPool, 'non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getTeamsByDomain', () => {
    it('should call teamRepository with correct domainId', async () => {
      const mockTeams: DbTeam[] = [
        {
          id: 'team-1',
          domain_id: 'domain-1',
          name: 'Backend',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      vi.mocked(teamRepo.getTeamsByDomainId).mockResolvedValue(mockTeams);
      vi.mocked(serviceRepo.getServicesByTeamId).mockResolvedValue([]);

      const result = await getTeamsByDomain(mockPool, 'domain-1');

      expect(result).toHaveLength(1);
      expect(teamRepo.getTeamsByDomainId).toHaveBeenCalledWith(mockPool, 'domain-1');
    });

    it('should include service counts for each team', async () => {
      const mockTeams: DbTeam[] = [
        {
          id: 'team-1',
          domain_id: 'domain-1',
          name: 'Backend',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const mockServices: DbService[] = [
        {
          id: 'service-1',
          team_id: 'team-1',
          name: 'API',
          type: 'REST',
          tier: 'T1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'service-2',
          team_id: 'team-1',
          name: 'Database',
          type: 'PostgreSQL',
          tier: 'T1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      vi.mocked(teamRepo.getTeamsByDomainId).mockResolvedValue(mockTeams);
      vi.mocked(serviceRepo.getServicesByTeamId).mockResolvedValue(mockServices);

      const result = await getTeamsByDomain(mockPool, 'domain-1');

      expect(result[0]).toHaveProperty('serviceCount', 2);
      expect(serviceRepo.getServicesByTeamId).toHaveBeenCalledWith(mockPool, 'team-1');
    });
  });

  describe('getTeamById', () => {
    it('should return team with members', async () => {
      const mockTeam: DbTeam = {
        id: 'team-1',
        domain_id: 'domain-1',
        name: 'Backend',
        metadata: {},
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockMembers: DbMember[] = [
        {
          id: 'member-1',
          team_id: 'team-1',
          name: 'John Doe',
          role: 'Engineer',
          email: 'john@example.com',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      vi.mocked(teamRepo.getTeamById).mockResolvedValue(mockTeam);
      vi.mocked(memberRepo.getMembersByTeamId).mockResolvedValue(mockMembers);
      vi.mocked(serviceRepo.getServicesByTeamId).mockResolvedValue([]);

      const result = await getTeamById(mockPool, 'team-1');

      expect(result).toBeDefined();
      expect(result?.members).toHaveLength(1);
      expect(result?.serviceCount).toBe(0);
      expect(memberRepo.getMembersByTeamId).toHaveBeenCalledWith(mockPool, 'team-1');
    });

    it('should return null when team not found', async () => {
      vi.mocked(teamRepo.getTeamById).mockResolvedValue(null);

      const result = await getTeamById(mockPool, 'non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getServicesByTeam', () => {
    it('should call serviceRepository with correct teamId', async () => {
      const mockServices: DbService[] = [
        {
          id: 'service-1',
          team_id: 'team-1',
          name: 'API',
          type: 'REST',
          tier: 'T1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      vi.mocked(serviceRepo.getServicesByTeamId).mockResolvedValue(mockServices);
      vi.mocked(dependencyRepo.getUpstreamDependencyCount).mockResolvedValue(0);
      vi.mocked(dependencyRepo.getDownstreamDependencyCount).mockResolvedValue(0);

      const result = await getServicesByTeam(mockPool, 'team-1');

      expect(result).toHaveLength(1);
      expect(serviceRepo.getServicesByTeamId).toHaveBeenCalledWith(mockPool, 'team-1');
    });

    it('should include dependency counts for each service', async () => {
      const mockServices: DbService[] = [
        {
          id: 'service-1',
          team_id: 'team-1',
          name: 'API',
          type: 'REST',
          tier: 'T1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      vi.mocked(serviceRepo.getServicesByTeamId).mockResolvedValue(mockServices);
      vi.mocked(dependencyRepo.getUpstreamDependencyCount).mockResolvedValue(3);
      vi.mocked(dependencyRepo.getDownstreamDependencyCount).mockResolvedValue(5);

      const result = await getServicesByTeam(mockPool, 'team-1');

      expect(result[0]).toHaveProperty('upstreamCount', 3);
      expect(result[0]).toHaveProperty('downstreamCount', 5);
      expect(dependencyRepo.getUpstreamDependencyCount).toHaveBeenCalledWith(
        mockPool,
        'service-1'
      );
      expect(dependencyRepo.getDownstreamDependencyCount).toHaveBeenCalledWith(
        mockPool,
        'service-1'
      );
    });
  });

  describe('getServiceById', () => {
    it('should return service with dependency counts', async () => {
      const mockService: DbService = {
        id: 'service-1',
        team_id: 'team-1',
        name: 'API',
        type: 'REST',
        tier: 'T1',
        metadata: {},
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(serviceRepo.getServiceById).mockResolvedValue(mockService);
      vi.mocked(dependencyRepo.getUpstreamDependencyCount).mockResolvedValue(2);
      vi.mocked(dependencyRepo.getDownstreamDependencyCount).mockResolvedValue(4);

      const result = await getServiceById(mockPool, 'service-1');

      expect(result).toBeDefined();
      expect(result?.upstreamCount).toBe(2);
      expect(result?.downstreamCount).toBe(4);
      expect(dependencyRepo.getUpstreamDependencyCount).toHaveBeenCalledWith(
        mockPool,
        'service-1'
      );
    });

    it('should return null when service not found', async () => {
      vi.mocked(serviceRepo.getServiceById).mockResolvedValue(null);

      const result = await getServiceById(mockPool, 'non-existent');

      expect(result).toBeNull();
    });
  });
});
