import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Pool } from 'pg';
import {
  getDependenciesByServiceId,
  getUpstreamDependencies,
  getDownstreamDependencies,
  getDependenciesByType,
  createDependency,
} from '../dependencyRepository.js';
import type { DbDependency } from '../../db/schema.js';

describe('Dependency Repository', () => {
  let mockPool: Pool;
  let mockQuery: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockQuery = vi.fn();
    mockPool = {
      query: mockQuery,
    } as unknown as Pool;
  });

  describe('getDependenciesByServiceId', () => {
    it('should return empty array when no dependencies exist', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        command: '',
        oid: 0,
        fields: [],
        rowCount: 0,
      });

      const result = await getDependenciesByServiceId(mockPool, 'service-1');

      expect(result).toEqual([]);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM dependencies'),
        ['service-1']
      );
    });

    it('should return both upstream and downstream dependencies', async () => {
      const mockDeps: DbDependency[] = [
        {
          id: 'dep-1',
          from_service_id: 'service-1',
          to_service_id: 'service-2',
          type: 'DECLARED',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
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

      mockQuery.mockResolvedValue({
        rows: mockDeps,
        command: '',
        oid: 0,
        fields: [],
        rowCount: 2,
      });

      const result = await getDependenciesByServiceId(mockPool, 'service-1');

      expect(result).toHaveLength(2);
      expect(result).toEqual(mockDeps);
    });
  });

  describe('getUpstreamDependencies', () => {
    it('should return only dependencies where service is the source (services this service depends on)', async () => {
      const mockDeps: DbDependency[] = [
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

      mockQuery.mockResolvedValue({
        rows: mockDeps,
        command: '',
        oid: 0,
        fields: [],
        rowCount: 1,
      });

      const result = await getUpstreamDependencies(mockPool, 'service-1');

      expect(result).toHaveLength(1);
      expect(result[0].from_service_id).toBe('service-1');
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('from_service_id = $1'),
        ['service-1']
      );
    });

    it('should filter by type when provided', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        command: '',
        oid: 0,
        fields: [],
        rowCount: 0,
      });

      await getUpstreamDependencies(mockPool, 'service-1', 'DECLARED');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('type = $2'),
        ['service-1', 'DECLARED']
      );
    });
  });

  describe('getDownstreamDependencies', () => {
    it('should return only dependencies where service is the target (services that depend on this service)', async () => {
      const mockDeps: DbDependency[] = [
        {
          id: 'dep-1',
          from_service_id: 'service-2',
          to_service_id: 'service-1',
          type: 'OBSERVED',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockQuery.mockResolvedValue({
        rows: mockDeps,
        command: '',
        oid: 0,
        fields: [],
        rowCount: 1,
      });

      const result = await getDownstreamDependencies(mockPool, 'service-1');

      expect(result).toHaveLength(1);
      expect(result[0].to_service_id).toBe('service-1');
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('to_service_id = $1'),
        ['service-1']
      );
    });

    it('should filter by type when provided', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        command: '',
        oid: 0,
        fields: [],
        rowCount: 0,
      });

      await getDownstreamDependencies(mockPool, 'service-1', 'OBSERVED');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('type = $2'),
        ['service-1', 'OBSERVED']
      );
    });
  });

  describe('getDependenciesByType', () => {
    it('should return only declared dependencies', async () => {
      const mockDeps: DbDependency[] = [
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

      mockQuery.mockResolvedValue({
        rows: mockDeps,
        command: '',
        oid: 0,
        fields: [],
        rowCount: 1,
      });

      const result = await getDependenciesByType(mockPool, 'DECLARED');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('DECLARED');
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('type = $1'),
        ['DECLARED']
      );
    });

    it('should return only observed dependencies', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        command: '',
        oid: 0,
        fields: [],
        rowCount: 0,
      });

      await getDependenciesByType(mockPool, 'OBSERVED');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('type = $1'),
        ['OBSERVED']
      );
    });
  });

  describe('createDependency', () => {
    it('should create and return new dependency', async () => {
      const newDependency = {
        id: 'dep-123',
        from_service_id: 'service-1',
        to_service_id: 'service-2',
        type: 'DECLARED' as const,
        metadata: { strength: 'high' }
      };

      const createdDependency: DbDependency = {
        ...newDependency,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValue({
        rows: [createdDependency],
        command: 'INSERT',
        oid: 0,
        fields: [],
        rowCount: 1,
      });

      const result = await createDependency(mockPool, newDependency);

      expect(result).toEqual(createdDependency);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO dependencies'),
        [newDependency.id, newDependency.from_service_id, newDependency.to_service_id, newDependency.type, JSON.stringify(newDependency.metadata)]
      );
    });
  });
});
