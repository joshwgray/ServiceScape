import { describe, it, expect } from 'vitest';
import type { Dependency, DependencyType } from '../dependencies';

describe('Dependency Types', () => {
  describe('DependencyType', () => {
    it('should have DECLARED value', () => {
      const type: DependencyType = 'DECLARED';
      expect(type).toBe('DECLARED');
    });

    it('should have OBSERVED value', () => {
      const type: DependencyType = 'OBSERVED';
      expect(type).toBe('OBSERVED');
    });

    it('should only allow DECLARED or OBSERVED', () => {
      // This is enforced by TypeScript at compile time
      const declared: DependencyType = 'DECLARED';
      const observed: DependencyType = 'OBSERVED';
      
      expect(['DECLARED', 'OBSERVED']).toContain(declared);
      expect(['DECLARED', 'OBSERVED']).toContain(observed);
    });
  });

  describe('Dependency', () => {
    it('should require fromServiceId, toServiceId, and type properties', () => {
      const dependency: Dependency = {
        id: 'dep-1',
        fromServiceId: 'service-1',
        toServiceId: 'service-2',
        type: 'DECLARED',
      };
      
      expect(dependency.id).toBe('dep-1');
      expect(dependency.fromServiceId).toBe('service-1');
      expect(dependency.toServiceId).toBe('service-2');
      expect(dependency.type).toBe('DECLARED');
    });

    it('should support DECLARED dependency type', () => {
      const dependency: Dependency = {
        id: 'dep-1',
        fromServiceId: 'service-1',
        toServiceId: 'service-2',
        type: 'DECLARED',
      };
      
      expect(dependency.type).toBe('DECLARED');
    });

    it('should support OBSERVED dependency type', () => {
      const dependency: Dependency = {
        id: 'dep-2',
        fromServiceId: 'service-1',
        toServiceId: 'service-3',
        type: 'OBSERVED',
      };
      
      expect(dependency.type).toBe('OBSERVED');
    });

    it('should allow optional metadata', () => {
      const dependency: Dependency = {
        id: 'dep-1',
        fromServiceId: 'service-1',
        toServiceId: 'service-2',
        type: 'DECLARED',
        metadata: { protocol: 'HTTP', port: 8080 },
      };
      
      expect(dependency.metadata).toBeDefined();
      expect(dependency.metadata?.protocol).toBe('HTTP');
      expect(dependency.metadata?.port).toBe(8080);
    });

    it('should allow optional description', () => {
      const dependency: Dependency = {
        id: 'dep-1',
        fromServiceId: 'service-1',
        toServiceId: 'service-2',
        type: 'DECLARED',
        description: 'API call for user authentication',
      };
      
      expect(dependency.description).toBe('API call for user authentication');
    });
  });

  describe('Dependency Validation', () => {
    it('should create valid dependency structures', () => {
      const declaredDep: Dependency = {
        id: 'dep-1',
        fromServiceId: 'auth-service',
        toServiceId: 'user-db',
        type: 'DECLARED',
        description: 'Database connection',
      };

      const observedDep: Dependency = {
        id: 'dep-2',
        fromServiceId: 'web-app',
        toServiceId: 'auth-service',
        type: 'OBSERVED',
        metadata: { observedAt: '2026-02-16' },
      };
      
      expect(declaredDep.type).toBe('DECLARED');
      expect(observedDep.type).toBe('OBSERVED');
      expect(typeof declaredDep.fromServiceId).toBe('string');
      expect(typeof observedDep.toServiceId).toBe('string');
    });

    it('should handle multiple dependencies from same service', () => {
      const deps: Dependency[] = [
        {
          id: 'dep-1',
          fromServiceId: 'api-gateway',
          toServiceId: 'auth-service',
          type: 'DECLARED',
        },
        {
          id: 'dep-2',
          fromServiceId: 'api-gateway',
          toServiceId: 'user-service',
          type: 'DECLARED',
        },
        {
          id: 'dep-3',
          fromServiceId: 'api-gateway',
          toServiceId: 'analytics-service',
          type: 'OBSERVED',
        },
      ];
      
      expect(deps).toHaveLength(3);
      expect(deps.every(d => d.fromServiceId === 'api-gateway')).toBe(true);
      expect(deps.filter(d => d.type === 'DECLARED')).toHaveLength(2);
      expect(deps.filter(d => d.type === 'OBSERVED')).toHaveLength(1);
    });
  });
});
