import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Pool } from 'pg';
import {
  getLayout,
  computeLayout,
  invalidateLayoutCache,
} from '../layoutService.js';
import type { DbLayoutCache, DbDomain, DbTeam, DbService } from '../../db/schema.js';

describe('Layout Service', () => {
  let mockPool: Pool;
  let mockQuery: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockQuery = vi.fn();
    mockPool = {
      query: mockQuery,
    } as unknown as Pool;
  });

  describe('getLayout', () => {
    it('should return cached layout if available and not expired with correct version', async () => {
      const mockCache: DbLayoutCache = {
        id: 'cache-1',
        cache_key: 'layout_all',
        layout_type: 'DOMAIN_GRID',
        positions: {
          domains: { 'domain-1': { x: 0, y: 0, z: 0 } },
          teams: {},
          services: {},
        },
        metadata: { version: 3 }, // Correct version (updated for floor cohesion)
        created_at: new Date(),
        updated_at: new Date(),
        expires_at: new Date(Date.now() + 3600000), // 1 hour from now
      };

      mockQuery.mockResolvedValueOnce({
        rows: [mockCache],
        command: '',
        oid: 0,
        fields: [],
        rowCount: 1,
      });

      const result = await getLayout(mockPool);

      expect(result).toEqual(mockCache.positions);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM layout_cache'),
        expect.any(Array)
      );
    });

    it('should reject cached layout with wrong version', async () => {
      const mockCacheWrongVersion: DbLayoutCache = {
        id: 'cache-1',
        cache_key: 'layout_all',
        layout_type: 'DOMAIN_GRID',
        positions: {
          domains: { 'domain-1': { x: 0, y: 0, z: 0 } },
          teams: {},
          services: {},
        },
        metadata: { version: 0 }, // Wrong/old version
        created_at: new Date(),
        updated_at: new Date(),
        expires_at: new Date(Date.now() + 3600000), // Not expired
      };

      const mockDomains: DbDomain[] = [
        {
          id: 'domain-1',
          name: 'Domain 1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockQuery
        .mockResolvedValueOnce({ rows: [mockCacheWrongVersion], command: '', oid: 0, fields: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: mockDomains, command: '', oid: 0, fields: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], command: '', oid: 0, fields: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], command: '', oid: 0, fields: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], command: '', oid: 0, fields: [], rowCount: 0 });

      const result = await getLayout(mockPool);

      // Should compute new layout, not return cached
      expect(result).toBeDefined();
      expect(result.domains).toBeDefined();
    });

    it('should reject cached layout with missing version', async () => {
      const mockCacheNoVersion: DbLayoutCache = {
        id: 'cache-1',
        cache_key: 'layout_all',
        layout_type: 'DOMAIN_GRID',
        positions: { 'domain-1': { x: 0, y: 0, z: 0 } },
        metadata: {}, // No version field
        created_at: new Date(),
        updated_at: new Date(),
        expires_at: new Date(Date.now() + 3600000), // Not expired
      };

      const mockDomains: DbDomain[] = [
        {
          id: 'domain-1',
          name: 'Domain 1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockQuery
        .mockResolvedValueOnce({ rows: [mockCacheNoVersion], command: '', oid: 0, fields: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: mockDomains, command: '', oid: 0, fields: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], command: '', oid: 0, fields: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], command: '', oid: 0, fields: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], command: '', oid: 0, fields: [], rowCount: 0 });

      const result = await getLayout(mockPool);

      // Should compute new layout, not return cached
      expect(result).toBeDefined();
      expect(result.domains).toBeDefined();
    });

    it('should compute new layout if cache is expired', async () => {
      const expiredCache: DbLayoutCache = {
        id: 'cache-1',
        cache_key: 'layout_all',
        layout_type: 'DOMAIN_GRID',
        positions: { 'domain-1': { x: 0, y: 0, z: 0 } },
        metadata: {},
        created_at: new Date(),
        updated_at: new Date(),
        expires_at: new Date(Date.now() - 3600000), // 1 hour ago
      };

      const mockDomains: DbDomain[] = [
        {
          id: 'domain-1',
          name: 'Domain 1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockQuery
        .mockResolvedValueOnce({ rows: [expiredCache], command: '', oid: 0, fields: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: mockDomains, command: '', oid: 0, fields: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], command: '', oid: 0, fields: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], command: '', oid: 0, fields: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], command: '', oid: 0, fields: [], rowCount: 0 });

      const result = await getLayout(mockPool);

      expect(result).toBeDefined();
      expect(result.domains).toBeDefined();
    });

    it('should compute new layout if no cache exists', async () => {
      const mockDomains: DbDomain[] = [
        {
          id: 'domain-1',
          name: 'Domain 1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockQuery
        .mockResolvedValueOnce({ rows: [], command: '', oid: 0, fields: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: mockDomains, command: '', oid: 0, fields: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], command: '', oid: 0, fields: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], command: '', oid: 0, fields: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], command: '', oid: 0, fields: [], rowCount: 0 });

      const result = await getLayout(mockPool);

      expect(result).toBeDefined();
      expect(result.domains).toBeDefined();
    });
  });

  describe('computeLayout', () => {
    it('should compute positions for domains, teams, and services', async () => {
      const mockDomains: DbDomain[] = [
        {
          id: 'domain-1',
          name: 'Domain 1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

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

      mockQuery
        .mockResolvedValueOnce({ rows: mockDomains, command: '', oid: 0, fields: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: mockTeams, command: '', oid: 0, fields: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: mockServices, command: '', oid: 0, fields: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], command: '', oid: 0, fields: [], rowCount: 0 });

      const result = await computeLayout(mockPool);

      expect(result.domains).toHaveProperty('domain-1');
      expect(result.teams).toHaveProperty('team-1');
      expect(result.services).toHaveProperty('service-1');

      expect(result.domains['domain-1']).toHaveProperty('x');
      expect(result.domains['domain-1']).toHaveProperty('y');
      expect(result.domains['domain-1']).toHaveProperty('z');
    });

    it('should save computed layout to cache', async () => {
      const mockDomains: DbDomain[] = [
        {
          id: 'domain-1',
          name: 'Domain 1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockQuery
        .mockResolvedValueOnce({ rows: mockDomains, command: '', oid: 0, fields: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], command: '', oid: 0, fields: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], command: '', oid: 0, fields: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], command: '', oid: 0, fields: [], rowCount: 0 });

      await computeLayout(mockPool);

      // Check that INSERT was called
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO layout_cache'),
        expect.any(Array)
      );
    });
  });

  describe('invalidateLayoutCache', () => {
    it('should delete cache entries', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        command: '',
        oid: 0,
        fields: [],
        rowCount: 1,
      });

      await invalidateLayoutCache(mockPool);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM layout_cache'),
        expect.any(Array)
      );
    });
  });
});
