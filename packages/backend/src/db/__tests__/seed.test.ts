import { describe, it, expect, beforeEach, vi } from 'vitest';
import { seedDatabase, clearDatabase } from '../seed.js';
import type { Pool } from 'pg';

describe('seed', () => {
  let mockPool: Pool;
  let queryCalls: Array<{ query: string; params?: any[] }>;

  beforeEach(() => {
    queryCalls = [];
    
    mockPool = {
      query: vi.fn((query: string, params?: any[]) => {
        queryCalls.push({ query, params });
        
        // Return appropriate data for SELECT queries
        if (query.includes('SELECT COUNT(*)')) {
          // Different counts based on which table
          if (query.includes('domains')) {
            return Promise.resolve({ rows: [{ count: '15' }] });
          } else if (query.includes('teams')) {
            return Promise.resolve({ rows: [{ count: '50' }] });
          } else if (query.includes('services')) {
            return Promise.resolve({ rows: [{ count: '350' }] });
          } else if (query.includes('members')) {
            return Promise.resolve({ rows: [{ count: '400' }] });
          } else if (query.includes('dependencies')) {
            return Promise.resolve({ rows: [{ count: '200' }] });
          }
        } else if (query.includes('SELECT DISTINCT type')) {
          return Promise.resolve({
            rows: [
              { type: 'API' },
              { type: 'DATABASE' },
              { type: 'MESSAGING' },
              { type: 'FRONTEND' }
            ]
          });
        } else if (query.includes('SELECT DISTINCT tier')) {
          return Promise.resolve({
            rows: [
              { tier: 'CRITICAL' },
              { tier: 'HIGH' },
              { tier: 'MEDIUM' }
            ]
          });
        } else if (query.includes('LEFT JOIN')) {
          // Foreign key validation queries - return 0 for no invalid relationships
          return Promise.resolve({ rows: [{ count: '0' }] });
        }
        
        return Promise.resolve({ rows: [], command: '', oid: 0, fields: [], rowCount: 0 });
      }),
      connect: vi.fn(),
      end: vi.fn(),
      on: vi.fn(),
    } as any;
  });

  describe('clearDatabase', () => {
    it('should delete from all tables in correct order', async () => {
      await clearDatabase(mockPool);

      const deleteQueries = queryCalls.filter(c => c.query.includes('DELETE'));
      
      expect(deleteQueries.length).toBe(6);
      expect(deleteQueries[0].query).toContain('DELETE FROM dependencies');
      expect(deleteQueries[1].query).toContain('DELETE FROM members');
      expect(deleteQueries[2].query).toContain('DELETE FROM services');
      expect(deleteQueries[3].query).toContain('DELETE FROM teams');
      expect(deleteQueries[4].query).toContain('DELETE FROM domains');
      expect(deleteQueries[5].query).toContain('DELETE FROM layout_cache');
    });
  });

  describe('seedDatabase', () => {
    it('should insert domains, teams, and services', async () => {
      await seedDatabase(mockPool);

      const insertQueries = queryCalls.filter(c => c.query.includes('INSERT'));
      
      // Should have inserts for domains, teams, services, members, and dependencies
      const domainInserts = insertQueries.filter(c => c.query.includes('INSERT INTO domains'));
      const teamInserts = insertQueries.filter(c => c.query.includes('INSERT INTO teams'));
      const serviceInserts = insertQueries.filter(c => c.query.includes('INSERT INTO services'));
      const memberInserts = insertQueries.filter(c => c.query.includes('INSERT INTO members'));
      const dependencyInserts = insertQueries.filter(c => c.query.includes('INSERT INTO dependencies'));

      expect(domainInserts.length).toBeGreaterThanOrEqual(10);
      expect(teamInserts.length).toBeGreaterThanOrEqual(30);
      expect(serviceInserts.length).toBeGreaterThanOrEqual(300);
      expect(memberInserts.length).toBeGreaterThan(0);
      expect(dependencyInserts.length).toBeGreaterThan(0);
    });

    it('should insert members for all teams', async () => {
      await seedDatabase(mockPool);

      const memberInserts = queryCalls.filter(c => c.query.includes('INSERT INTO members'));
      
      // Should have many members
      expect(memberInserts.length).toBeGreaterThan(100);
    });

    it('should insert dependencies between services', async () => {
      await seedDatabase(mockPool);

      const dependencyInserts = queryCalls.filter(c => c.query.includes('INSERT INTO dependencies'));
      
      expect(dependencyInserts.length).toBeGreaterThan(0);
    });

    it('should insert valid data with correct foreign keys', async () => {
      await seedDatabase(mockPool);

      // Get all inserts
      const domainInserts = queryCalls.filter(c => c.query.includes('INSERT INTO domains'));
      const teamInserts = queryCalls.filter(c => c.query.includes('INSERT INTO teams'));
      const serviceInserts = queryCalls.filter(c => c.query.includes('INSERT INTO services'));

      // Verify domains have IDs
      expect(domainInserts.length).toBeGreaterThan(0);
      domainInserts.forEach(insert => {
        expect(insert.params).toBeDefined();
        expect(insert.params![0]).toMatch(/^domain-/); // ID starts with 'domain-'
        expect(typeof insert.params![1]).toBe('string'); // name
      });

      // Verify teams reference domain IDs
      expect(teamInserts.length).toBeGreaterThan(0);
      teamInserts.forEach(insert => {
        expect(insert.params).toBeDefined();
        expect(insert.params![0]).toMatch(/^team-/); // ID starts with 'team-'
        expect(insert.params![1]).toMatch(/^domain-/); // domain_id starts with 'domain-'
      });

      // Verify services reference team IDs
      expect(serviceInserts.length).toBeGreaterThan(0);
      serviceInserts.forEach(insert => {
        expect(insert.params).toBeDefined();
        expect(insert.params![0]).toMatch(/^service-/); // ID starts with 'service-'
        expect(insert.params![1]).toMatch(/^team-/); // team_id starts with 'team-'
      });
    });

    it('should insert approximately 350 services', async () => {
      await seedDatabase(mockPool);

      const serviceInserts = queryCalls.filter(c => c.query.includes('INSERT INTO services'));
      
      // Should be within reasonable range due to randomization (300-400)
      expect(serviceInserts.length).toBeGreaterThanOrEqual(300);
      expect(serviceInserts.length).toBeLessThanOrEqual(420);
    });

    it('should insert services with varied types and tiers', async () => {
      await seedDatabase(mockPool);

      const serviceInserts = queryCalls.filter(c => c.query.includes('INSERT INTO services'));
      
      const types = new Set<string>();
      const tiers = new Set<string>();

      serviceInserts.forEach(insert => {
        if (insert.params) {
          types.add(insert.params[3]); // type is 4th param
          tiers.add(insert.params[4]); // tier is 5th param
        }
      });

      expect(types.size).toBeGreaterThan(3);
      expect(tiers.size).toBeGreaterThan(2);
    });
  });
});
