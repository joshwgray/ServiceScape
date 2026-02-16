import { describe, it, expect } from 'vitest';
import {
  generateOrganization,
  generateDomains,
  generateTeamsForDomain,
  generateServicesForTeam
} from '../organizationGenerator.js';

describe('organizationGenerator', () => {
  describe('generateDomains', () => {
    it('should generate domains with valid structure', () => {
      const domains = generateDomains();
      
      expect(domains.length).toBeGreaterThanOrEqual(10);
      expect(domains.length).toBeLessThanOrEqual(20);
      
      domains.forEach(domain => {
        expect(domain).toHaveProperty('id');
        expect(domain).toHaveProperty('name');
        expect(domain).toHaveProperty('metadata');
        expect(typeof domain.id).toBe('string');
        expect(typeof domain.name).toBe('string');
        expect(domain.name.length).toBeGreaterThan(0);
        expect(typeof domain.metadata).toBe('object');
      });
    });

    it('should generate unique domain IDs', () => {
      const domains = generateDomains();
      const ids = domains.map(d => d.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(domains.length);
    });

    it('should generate unique domain names', () => {
      const domains = generateDomains();
      const names = domains.map(d => d.name);
      const uniqueNames = new Set(names);
      
      expect(uniqueNames.size).toBe(domains.length);
    });
  });

  describe('generateTeamsForDomain', () => {
    it('should generate teams for a domain', () => {
      const domainId = 'test-domain-id';
      const teams = generateTeamsForDomain(domainId);
      
      expect(teams.length).toBeGreaterThanOrEqual(2);
      expect(teams.length).toBeLessThanOrEqual(5);
      
      teams.forEach(team => {
        expect(team).toHaveProperty('id');
        expect(team).toHaveProperty('domain_id');
        expect(team).toHaveProperty('name');
        expect(team).toHaveProperty('metadata');
        expect(team.domain_id).toBe(domainId);
        expect(typeof team.id).toBe('string');
        expect(typeof team.name).toBe('string');
        expect(team.name.length).toBeGreaterThan(0);
      });
    });

    it('should generate unique team IDs', () => {
      const teams = generateTeamsForDomain('domain-1');
      const ids = teams.map(t => t.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(teams.length);
    });
  });

  describe('generateServicesForTeam', () => {
    it('should generate services for a team', () => {
      const teamId = 'test-team-id';
      const services = generateServicesForTeam(teamId);
      
      expect(services.length).toBeGreaterThanOrEqual(3);
      expect(services.length).toBeLessThanOrEqual(12);
      
      services.forEach(service => {
        expect(service).toHaveProperty('id');
        expect(service).toHaveProperty('team_id');
        expect(service).toHaveProperty('name');
        expect(service).toHaveProperty('type');
        expect(service).toHaveProperty('tier');
        expect(service).toHaveProperty('metadata');
        expect(service.team_id).toBe(teamId);
        expect(typeof service.id).toBe('string');
        expect(typeof service.name).toBe('string');
        expect(['API', 'DATABASE', 'MESSAGING', 'FRONTEND', 'BACKEND', 'WORKER']).toContain(service.type);
        expect(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).toContain(service.tier);
      });
    });

    it('should generate unique service IDs', () => {
      const services = generateServicesForTeam('team-1');
      const ids = services.map(s => s.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(services.length);
    });

    it('should generate varied service types and tiers', () => {
      const services = generateServicesForTeam('team-1', 10);
      const types = new Set(services.map(s => s.type));
      const tiers = new Set(services.map(s => s.tier));
      
      // With 10 services, we expect some variety
      expect(types.size).toBeGreaterThan(1);
      expect(tiers.size).toBeGreaterThan(1);
    });
  });

  describe('generateOrganization', () => {
    it('should generate complete organization structure', () => {
      const org = generateOrganization();
      
      expect(org).toHaveProperty('domains');
      expect(org).toHaveProperty('teams');
      expect(org).toHaveProperty('services');
      
      expect(org.domains.length).toBeGreaterThanOrEqual(10);
      expect(org.teams.length).toBeGreaterThanOrEqual(30);
      expect(org.services.length).toBeGreaterThanOrEqual(300);
      expect(org.services.length).toBeLessThanOrEqual(400);
    });

    it('should have teams linked to domains', () => {
      const org = generateOrganization();
      const domainIds = new Set(org.domains.map(d => d.id));
      
      org.teams.forEach(team => {
        expect(domainIds.has(team.domain_id!)).toBe(true);
      });
    });

    it('should have services linked to teams', () => {
      const org = generateOrganization();
      const teamIds = new Set(org.teams.map(t => t.id));
      
      org.services.forEach(service => {
        expect(teamIds.has(service.team_id!)).toBe(true);
      });
    });

    it('should generate target of ~350 services', () => {
      const org = generateOrganization();
      
      // Allow variance for randomization - should be in reasonable range
      expect(org.services.length).toBeGreaterThanOrEqual(280);
      expect(org.services.length).toBeLessThanOrEqual(450);
    });

    it('should generate exact counts when passed targets', () => {
      const org = generateOrganization({
        domainCount: 10,
        teamCount: 40,
        serviceCount: 320
      });
      
      expect(org.domains.length).toBe(10);
      expect(org.teams.length).toBe(40);
      expect(org.services.length).toBe(320);
    });

    it('should generate deterministic organization with consistent count', () => {
      // Run multiple times to ensure consistent counts
      for (let i = 0; i < 5; i++) {
        const org = generateOrganization({
          domainCount: 15,
          teamCount: 50,
          serviceCount: 350
        });
        
        expect(org.domains.length).toBe(15);
        expect(org.teams.length).toBe(50);
        expect(org.services.length).toBe(350);
      }
    });
  });

  describe('generateTeamsForDomain with count parameter', () => {
    it('should generate exact team count when specified', () => {
      const teams = generateTeamsForDomain('domain-1', 5);
      expect(teams.length).toBe(5);
    });
  });

  describe('generateServicesForTeam with count parameter', () => {
    it('should generate exact service count when specified', () => {
      const services = generateServicesForTeam('team-1', 8);
      expect(services.length).toBe(8);
    });
  });
});
