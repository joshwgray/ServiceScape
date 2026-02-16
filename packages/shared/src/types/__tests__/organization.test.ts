import { describe, it, expect } from 'vitest';
import type { Domain, Team, Service, Member, EngineeringManager } from '../organization';

describe('Organization Types', () => {
  describe('Domain', () => {
    it('should require id and name properties', () => {
      const domain: Domain = {
        id: 'domain-1',
        name: 'Platform Engineering',
      };
      
      expect(domain.id).toBe('domain-1');
      expect(domain.name).toBe('Platform Engineering');
    });

    it('should allow optional metadata', () => {
      const domain: Domain = {
        id: 'domain-1',
        name: 'Platform Engineering',
        metadata: { color: '#FF5733', budget: 1000000 },
      };
      
      expect(domain.metadata).toBeDefined();
      expect(domain.metadata?.color).toBe('#FF5733');
    });
  });

  describe('Team', () => {
    it('should require id, domainId, and name properties', () => {
      const team: Team = {
        id: 'team-1',
        domainId: 'domain-1',
        name: 'Infrastructure Team',
      };
      
      expect(team.id).toBe('team-1');
      expect(team.domainId).toBe('domain-1');
      expect(team.name).toBe('Infrastructure Team');
    });

    it('should allow optional managerId', () => {
      const team: Team = {
        id: 'team-1',
        domainId: 'domain-1',
        name: 'Infrastructure Team',
        managerId: 'manager-1',
      };
      
      expect(team.managerId).toBe('manager-1');
    });
  });

  describe('Service', () => {
    it('should require id, teamId, and name properties', () => {
      const service: Service = {
        id: 'service-1',
        teamId: 'team-1',
        name: 'API Gateway',
      };
      
      expect(service.id).toBe('service-1');
      expect(service.teamId).toBe('team-1');
      expect(service.name).toBe('API Gateway');
    });

    it('should allow optional description and metadata', () => {
      const service: Service = {
        id: 'service-1',
        teamId: 'team-1',
        name: 'API Gateway',
        description: 'Main entry point for all API requests',
        metadata: { version: '2.1.0', status: 'active' },
      };
      
      expect(service.description).toBe('Main entry point for all API requests');
      expect(service.metadata?.version).toBe('2.1.0');
    });
  });

  describe('Member', () => {
    it('should require id, name, and role properties', () => {
      const member: Member = {
        id: 'member-1',
        name: 'John Doe',
        role: 'Software Engineer',
      };
      
      expect(member.id).toBe('member-1');
      expect(member.name).toBe('John Doe');
      expect(member.role).toBe('Software Engineer');
    });

    it('should allow optional teamId', () => {
      const member: Member = {
        id: 'member-1',
        name: 'John Doe',
        role: 'Software Engineer',
        teamId: 'team-1',
      };
      
      expect(member.teamId).toBe('team-1');
    });
  });

  describe('EngineeringManager', () => {
    it('should require id, name, and teamIds properties', () => {
      const manager: EngineeringManager = {
        id: 'manager-1',
        name: 'Jane Smith',
        teamIds: ['team-1', 'team-2'],
      };
      
      expect(manager.id).toBe('manager-1');
      expect(manager.name).toBe('Jane Smith');
      expect(manager.teamIds).toHaveLength(2);
      expect(manager.teamIds).toContain('team-1');
    });

    it('should allow empty teamIds array', () => {
      const manager: EngineeringManager = {
        id: 'manager-1',
        name: 'Jane Smith',
        teamIds: [],
      };
      
      expect(manager.teamIds).toHaveLength(0);
    });
  });

  describe('Type Structure Validation', () => {
    it('should create valid domain structure', () => {
      const domain: Domain = {
        id: 'test-domain',
        name: 'Test Domain',
      };
      
      // TypeScript compilation itself validates the structure
      expect(typeof domain.id).toBe('string');
      expect(typeof domain.name).toBe('string');
    });

    it('should create valid nested organization structure', () => {
      const domain: Domain = { id: 'domain-1', name: 'Engineering' };
      const team: Team = { id: 'team-1', domainId: domain.id, name: 'Backend' };
      const service: Service = { id: 'service-1', teamId: team.id, name: 'Auth Service' };
      const member: Member = { id: 'member-1', name: 'Developer', role: 'Engineer', teamId: team.id };
      
      expect(team.domainId).toBe(domain.id);
      expect(service.teamId).toBe(team.id);
      expect(member.teamId).toBe(team.id);
    });
  });
});
