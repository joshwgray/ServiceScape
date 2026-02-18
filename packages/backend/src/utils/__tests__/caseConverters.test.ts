import { describe, it, expect } from 'vitest';
import {
  convertDomainResponse,
  convertTeamResponse,
  convertServiceResponse,
  convertMemberResponse,
  convertDependencyResponse,
} from '../caseConverters';
import type { DbDomain, DbTeam, DbService, DbMember, DbDependency } from '../../db/schema';

describe('caseConverters', () => {
  describe('convertDomainResponse', () => {
    it('should convert DbDomain to Domain with camelCase fields', () => {
      const dbDomain: DbDomain = {
        id: 'domain-1',
        name: 'Engineering',
        metadata: { color: 'blue', size: 'large' },
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-02T00:00:00Z'),
      };

      const result = convertDomainResponse(dbDomain);

      expect(result).toEqual({
        id: 'domain-1',
        name: 'Engineering',
        metadata: { color: 'blue', size: 'large' },
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
      });
    });

    it('should preserve metadata keys as-is (not convert them)', () => {
      const dbDomain: DbDomain = {
        id: 'domain-1',
        name: 'Engineering',
        metadata: { user_preference: 'dark', team_count: 5 },
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-02T00:00:00Z'),
      };

      const result = convertDomainResponse(dbDomain);

      expect(result.metadata).toEqual({
        user_preference: 'dark',
        team_count: 5,
      });
    });

    it('should handle empty metadata', () => {
      const dbDomain: DbDomain = {
        id: 'domain-1',
        name: 'Engineering',
        metadata: {},
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-02T00:00:00Z'),
      };

      const result = convertDomainResponse(dbDomain);

      expect(result.metadata).toEqual({});
    });
  });

  describe('convertTeamResponse', () => {
    it('should convert DbTeam to Team with camelCase fields', () => {
      const dbTeam: DbTeam = {
        id: 'team-1',
        domain_id: 'domain-1',
        name: 'Platform Team',
        metadata: { location: 'Building A' },
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-02T00:00:00Z'),
      };

      const result = convertTeamResponse(dbTeam);

      expect(result).toEqual({
        id: 'team-1',
        domainId: 'domain-1',
        name: 'Platform Team',
        metadata: { location: 'Building A' },
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
      });
    });

    it('should handle null domain_id', () => {
      const dbTeam: DbTeam = {
        id: 'team-1',
        domain_id: null,
        name: 'Platform Team',
        metadata: {},
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-02T00:00:00Z'),
      };

      const result = convertTeamResponse(dbTeam);

      expect(result).toEqual({
        id: 'team-1',
        domainId: null,
        name: 'Platform Team',
        metadata: {},
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
      });
    });

    it('should preserve metadata keys as-is', () => {
      const dbTeam: DbTeam = {
        id: 'team-1',
        domain_id: 'domain-1',
        name: 'Platform Team',
        metadata: { team_size: 10, is_active: true },
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-02T00:00:00Z'),
      };

      const result = convertTeamResponse(dbTeam);

      expect(result.metadata).toEqual({
        team_size: 10,
        is_active: true,
      });
    });
  });

  describe('convertServiceResponse', () => {
    it('should convert DbService to Service with camelCase fields', () => {
      const dbService: DbService = {
        id: 'service-1',
        team_id: 'team-1',
        name: 'Auth Service',
        type: 'API',
        tier: 'Tier 1',
        metadata: { version: '1.0.0' },
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-02T00:00:00Z'),
      };

      const result = convertServiceResponse(dbService);

      expect(result).toEqual({
        id: 'service-1',
        teamId: 'team-1',
        name: 'Auth Service',
        type: 'API',
        tier: 'Tier 1',
        metadata: { version: '1.0.0' },
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
      });
    });

    it('should handle null team_id', () => {
      const dbService: DbService = {
        id: 'service-1',
        team_id: null,
        name: 'Auth Service',
        type: null,
        tier: null,
        metadata: {},
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-02T00:00:00Z'),
      };

      const result = convertServiceResponse(dbService);

      expect(result).toEqual({
        id: 'service-1',
        teamId: null,
        name: 'Auth Service',
        type: null,
        tier: null,
        metadata: {},
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
      });
    });

    it('should preserve metadata keys as-is', () => {
      const dbService: DbService = {
        id: 'service-1',
        team_id: 'team-1',
        name: 'Auth Service',
        type: 'API',
        tier: 'Tier 1',
        metadata: { service_url: 'https://api.example.com', max_connections: 100 },
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-02T00:00:00Z'),
      };

      const result = convertServiceResponse(dbService);

      expect(result.metadata).toEqual({
        service_url: 'https://api.example.com',
        max_connections: 100,
      });
    });
  });

  describe('convertMemberResponse', () => {
    it('should convert DbMember to Member with camelCase fields', () => {
      const dbMember: DbMember = {
        id: 'member-1',
        team_id: 'team-1',
        name: 'John Doe',
        role: 'Senior Engineer',
        email: 'john@example.com',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-02T00:00:00Z'),
      };

      const result = convertMemberResponse(dbMember);

      expect(result).toEqual({
        id: 'member-1',
        teamId: 'team-1',
        name: 'John Doe',
        role: 'Senior Engineer',
        email: 'john@example.com',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
      });
    });

    it('should handle null team_id', () => {
      const dbMember: DbMember = {
        id: 'member-1',
        team_id: null,
        name: 'John Doe',
        role: 'Senior Engineer',
        email: 'john@example.com',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-02T00:00:00Z'),
      };

      const result = convertMemberResponse(dbMember);

      expect(result).toEqual({
        id: 'member-1',
        teamId: null,
        name: 'John Doe',
        role: 'Senior Engineer',
        email: 'john@example.com',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
      });
    });

    it('should handle null email', () => {
      const dbMember: DbMember = {
        id: 'member-1',
        team_id: 'team-1',
        name: 'John Doe',
        role: 'Senior Engineer',
        email: null,
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-02T00:00:00Z'),
      };

      const result = convertMemberResponse(dbMember);

      expect(result).toEqual({
        id: 'member-1',
        teamId: 'team-1',
        name: 'John Doe',
        role: 'Senior Engineer',
        email: null,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
      });
    });
  });

  describe('convertDependencyResponse', () => {
    it('should convert DbDependency to Dependency with camelCase fields', () => {
      const dbDependency: DbDependency = {
        id: 'dep-1',
        from_service_id: 'service-1',
        to_service_id: 'service-2',
        type: 'DECLARED',
        metadata: { protocol: 'HTTP', version: '1.1' },
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-02T00:00:00Z'),
      };

      const result = convertDependencyResponse(dbDependency);

      expect(result).toEqual({
        id: 'dep-1',
        fromServiceId: 'service-1',
        toServiceId: 'service-2',
        type: 'DECLARED',
        metadata: { protocol: 'HTTP', version: '1.1' },
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
      });
    });

    it('should handle OBSERVED dependency type', () => {
      const dbDependency: DbDependency = {
        id: 'dep-1',
        from_service_id: 'service-1',
        to_service_id: 'service-2',
        type: 'OBSERVED',
        metadata: {},
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-02T00:00:00Z'),
      };

      const result = convertDependencyResponse(dbDependency);

      expect(result.type).toBe('OBSERVED');
    });

    it('should preserve metadata keys as-is', () => {
      const dbDependency: DbDependency = {
        id: 'dep-1',
        from_service_id: 'service-1',
        to_service_id: 'service-2',
        type: 'DECLARED',
        metadata: { connection_pool: 10, retry_count: 3 },
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-02T00:00:00Z'),
      };

      const result = convertDependencyResponse(dbDependency);

      expect(result.metadata).toEqual({
        connection_pool: 10,
        retry_count: 3,
      });
    });

    it('should correctly convert multi-word snake_case fields', () => {
      const dbDependency: DbDependency = {
        id: 'dep-1',
        from_service_id: 'service-abc-123',
        to_service_id: 'service-xyz-789',
        type: 'DECLARED',
        metadata: {},
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-02T00:00:00Z'),
      };

      const result = convertDependencyResponse(dbDependency);

      expect(result.fromServiceId).toBe('service-abc-123');
      expect(result.toServiceId).toBe('service-xyz-789');
      expect(result).not.toHaveProperty('from_service_id');
      expect(result).not.toHaveProperty('to_service_id');
    });
  });
});
