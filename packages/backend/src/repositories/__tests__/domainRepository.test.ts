import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Pool } from 'pg';
import { getAllDomains, getDomainById, createDomain } from '../domainRepository.js';
import type { DbDomain } from '../../db/schema.js';

describe('Domain Repository', () => {
  let mockPool: Pool;
  let mockQuery: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockQuery = vi.fn();
    mockPool = {
      query: mockQuery,
    } as unknown as Pool;
  });

  describe('getAllDomains', () => {
    it('should return empty array when no domains exist', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        command: '',
        oid: 0,
        fields: [],
        rowCount: 0,
      });

      const result = await getAllDomains(mockPool);

      expect(result).toEqual([]);
      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM domains ORDER BY name');
    });

    it('should return all domains from database', async () => {
      const mockDomains: DbDomain[] = [
        {
          id: '1',
          name: 'Engineering',
          metadata: { description: 'Engineering domain' },
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '2',
          name: 'Product',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockQuery.mockResolvedValue({
        rows: mockDomains,
        command: '',
        oid: 0,
        fields: [],
        rowCount: 2,
      });

      const result = await getAllDomains(mockPool);

      expect(result).toEqual(mockDomains);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Engineering');
    });
  });

  describe('getDomainById', () => {
    it('should return domain when found', async () => {
      const mockDomain: DbDomain = {
        id: '1',
        name: 'Engineering',
        metadata: { description: 'Engineering domain' },
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValue({
        rows: [mockDomain],
        command: '',
        oid: 0,
        fields: [],
        rowCount: 1,
      });

      const result = await getDomainById(mockPool, '1');

      expect(result).toEqual(mockDomain);
      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM domains WHERE id = $1', ['1']);
    });

    it('should return null when not found', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        command: '',
        oid: 0,
        fields: [],
        rowCount: 0,
      });

      const result = await getDomainById(mockPool, 'non-existent-id');

      expect(result).toBeNull();
      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM domains WHERE id = $1', [
        'non-existent-id',
      ]);
    });
  });

  describe('createDomain', () => {
    it('should create and return new domain', async () => {
      const newDomain = {
        id: 'domain-123',
        name: 'New Domain',
        metadata: { description: 'New domain description' }
      };

      const createdDomain: DbDomain = {
        ...newDomain,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValue({
        rows: [createdDomain],
        command: 'INSERT',
        oid: 0,
        fields: [],
        rowCount: 1,
      });

      const result = await createDomain(mockPool, newDomain);

      expect(result).toEqual(createdDomain);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO domains'),
        [newDomain.id, newDomain.name, JSON.stringify(newDomain.metadata)]
      );
    });
  });
});
