import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Pool } from 'pg';
import { getAllDomains, getDomainById } from '../domainRepository.js';
import type { DbDomain } from '../../db/schema.js';

describe('Domain Repository', () => {
  let mockPool: Pool;

  beforeEach(() => {
    mockPool = {
      query: vi.fn(),
    } as unknown as Pool;
  });

  describe('getAllDomains', () => {
    it('should return empty array when no domains exist', async () => {
      vi.mocked(mockPool.query).mockResolvedValue({
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

      vi.mocked(mockPool.query).mockResolvedValue({
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

      vi.mocked(mockPool.query).mockResolvedValue({
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
      vi.mocked(mockPool.query).mockResolvedValue({
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
});
