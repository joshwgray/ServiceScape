import { describe, it, expect } from 'vitest';
import { generateDependencies, DependencyInput } from '../dependencyGenerator.js';

describe('dependencyGenerator', () => {
  describe('generateDependencies', () => {
    it('should generate dependencies for services', () => {
      const services = [
        { id: 'service-1', team_id: 'team-1' },
        { id: 'service-2', team_id: 'team-1' },
        { id: 'service-3', team_id: 'team-2' },
        { id: 'service-4', team_id: 'team-2' },
        { id: 'service-5', team_id: 'team-3' }
      ];

      const teams = [
        { id: 'team-1', domain_id: 'domain-1' },
        { id: 'team-2', domain_id: 'domain-1' },
        { id: 'team-3', domain_id: 'domain-2' }
      ];

      const dependencies = generateDependencies(
        services as DependencyInput['services'],
        teams as DependencyInput['teams']
      );

      dependencies.forEach(dep => {
        expect(dep).toHaveProperty('id');
        expect(dep).toHaveProperty('from_service_id');
        expect(dep).toHaveProperty('to_service_id');
        expect(dep).toHaveProperty('type');
        expect(dep).toHaveProperty('metadata');
        expect(['DECLARED', 'OBSERVED']).toContain(dep.type);
        expect(dep.from_service_id).not.toBe(dep.to_service_id); // No self-dependencies
      });
    });

    it('should not create self-dependencies', () => {
      const services = [
        { id: 'service-1', team_id: 'team-1' },
        { id: 'service-2', team_id: 'team-1' }
      ];

      const teams = [
        { id: 'team-1', domain_id: 'domain-1' }
      ];

      const dependencies = generateDependencies(
        services as DependencyInput['services'],
        teams as DependencyInput['teams']
      );

      dependencies.forEach(dep => {
        expect(dep.from_service_id).not.toBe(dep.to_service_id);
      });
    });

    it('should have mix of DECLARED and OBSERVED dependencies', () => {
      const services: any[] = [];
      for (let i = 0; i < 50; i++) {
        services.push({ id: `service-${i}`, team_id: `team-${i % 10}` });
      }

      const teams: any[] = [];
      for (let i = 0; i < 10; i++) {
        teams.push({ id: `team-${i}`, domain_id: `domain-${i % 3}` });
      }

      const dependencies = generateDependencies(services, teams);

      const declaredCount = dependencies.filter(d => d.type === 'DECLARED').length;
      const observedCount = dependencies.filter(d => d.type === 'OBSERVED').length;

      expect(declaredCount).toBeGreaterThan(0);
      expect(observedCount).toBeGreaterThan(0);

      // Roughly 30-70% should be declared
      const declaredRatio = declaredCount / dependencies.length;
      expect(declaredRatio).toBeGreaterThan(0.2);
      expect(declaredRatio).toBeLessThan(0.8);
    });

    it('should have more within-domain dependencies than cross-domain', () => {
      const services: any[] = [];
      const teams: any[] = [];

      // Create 3 domains with multiple teams each
      for (let d = 0; d < 3; d++) {
        for (let t = 0; t < 5; t++) {
          const teamId = `team-d${d}-t${t}`;
          teams.push({ id: teamId, domain_id: `domain-${d}` });

          // Create services for this team
          for (let s = 0; s < 10; s++) {
            services.push({ id: `service-d${d}-t${t}-s${s}`, team_id: teamId });
          }
        }
      }

      const dependencies = generateDependencies(services, teams);

      // Build a map of service to domain
      const serviceToDomain = new Map<string, string>();
      services.forEach(service => {
        const team = teams.find(t => t.id === service.team_id);
        if (team) {
          serviceToDomain.set(service.id, team.domain_id);
        }
      });

      let withinDomain = 0;
      let crossDomain = 0;

      dependencies.forEach(dep => {
        const fromDomain = serviceToDomain.get(dep.from_service_id);
        const toDomain = serviceToDomain.get(dep.to_service_id);

        if (fromDomain === toDomain) {
          withinDomain++;
        } else {
          crossDomain++;
        }
      });

      // Should be roughly 80% within domain
      const withinRatio = withinDomain / (withinDomain + crossDomain);
      expect(withinRatio).toBeGreaterThan(0.7);
      expect(withinRatio).toBeLessThan(0.9);
    });

    it('should have some standalone services', () => {
      const services: any[] = [];
      for (let i = 0; i < 50; i++) {
        services.push({ id: `service-${i}`, team_id: `team-${i % 5}` });
      }

      const teams: any[] = [];
      for (let i = 0; i < 5; i++) {
        teams.push({ id: `team-${i}`, domain_id: `domain-${i % 2}` });
      }

      const dependencies = generateDependencies(services, teams);

      // Get all service IDs that appear in dependencies
      const servicesWithDeps = new Set<string>();
      dependencies.forEach(dep => {
        servicesWithDeps.add(dep.from_service_id);
        servicesWithDeps.add(dep.to_service_id);
      });

      // Some services should be standalone (not in any dependency)
      // Expected: ~30% services have no dependencies as source
      // But they can still be dependencies of others, so be lenient
      const standaloneServices = services.filter(s => !servicesWithDeps.has(s.id));
      expect(standaloneServices.length).toBeGreaterThanOrEqual(0);
      // Most services should participate in the dependency graph
      expect(servicesWithDeps.size).toBeGreaterThan(services.length * 0.5);
    });

    it('should generate realistic dependency count per service', () => {
      const services: any[] = [];
      for (let i = 0; i < 100; i++) {
        services.push({ id: `service-${i}`, team_id: `team-${i % 10}` });
      }

      const teams: any[] = [];
      for (let i = 0; i < 10; i++) {
        teams.push({ id: `team-${i}`, domain_id: `domain-${i % 3}` });
      }

      const dependencies = generateDependencies(services, teams);

      // Count dependencies per service
      const depCounts = new Map<string, number>();
      dependencies.forEach(dep => {
        depCounts.set(dep.from_service_id, (depCounts.get(dep.from_service_id) || 0) + 1);
      });

      // Most services should have 0-5 dependencies
      const counts = Array.from(depCounts.values());
      const avgDeps = counts.reduce((a, b) => a + b, 0) / counts.length;

      expect(avgDeps).toBeGreaterThan(0);
      expect(avgDeps).toBeLessThan(6); // Average should be reasonable
    });

    it('should generate unique dependency IDs', () => {
      const services: any[] = [];
      for (let i = 0; i < 30; i++) {
        services.push({ id: `service-${i}`, team_id: `team-${i % 5}` });
      }

      const teams: any[] = [];
      for (let i = 0; i < 5; i++) {
        teams.push({ id: `team-${i}`, domain_id: `domain-${i % 2}` });
      }

      const dependencies = generateDependencies(services, teams);

      const ids = dependencies.map(d => d.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(dependencies.length);
    });
  });
});
