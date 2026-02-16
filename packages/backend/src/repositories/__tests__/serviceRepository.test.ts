import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Pool } from 'pg';
import {
  getServicesByTeamId,
  getServiceById,
  getAllServices,
} from '../serviceRepository.js';
import type { DbService } from '../../db/schema.js';

describe('Service Repository', () => {
  let mockPool: Pool;

  beforeEach(() => {
    mockPool = {
      query: vi.fn() as any,
    } as unknown as Pool;
  });

  describe('getServicesByTeamId', () => {
    it('should return empty array when no services exist', async () => {
      vi.mocked(mockPool.query).mockResolvedValue({
        rows: [],
        command: '',
        oid: 0,
        fields: [],
        rowCount: 0,
      });

      const result = await getServicesByTeamId(mockPool, 'team-1');

      expect(result).toEqual([]);
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM services WHERE team_id = $1 ORDER BY name',
        ['team-1']
      );
    });

    it('should return services for specific team', async () => {
      const mockServices: DbService[] = [
        {
          id: 'service-1',
          team_id: 'team-1',
          name: 'API Service',
          type: 'REST',
          tier: 'T1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'service-2',
          team_id: 'team-1',
          name: 'Database Service',
          type: 'Database',
          tier: 'T1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      vi.mocked(mockPool.query).mockResolvedValue({
        rows: mockServices,
        command: '',
        oid: 0,
        fields: [],
        rowCount: 2,
      });

      const result = await getServicesByTeamId(mockPool, 'team-1');

      expect(result).toEqual(mockServices);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('API Service');
    });

    it('should filter correctly - only return services for that team', async () => {
      const mockServices: DbService[] = [
        {
          id: 'service-1',
          team_id: 'team-1',
          name: 'API Service',
          type: 'REST',
          tier: 'T1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      vi.mocked(mockPool.query).mockResolvedValue({
        rows: mockServices,
        command: '',
        oid: 0,
        fields: [],
        rowCount: 1,
      });

      const result = await getServicesByTeamId(mockPool, 'team-1');

      expect(result).toHaveLength(1);
      expect(result[0].team_id).toBe('team-1');
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM services WHERE team_id = $1 ORDER BY name',
        ['team-1']
      );
    });
  });

  describe('getServiceById', () => {
    it('should return service when found', async () => {
      const mockService: DbService = {
        id: 'service-1',
        team_id: 'team-1',
        name: 'API Service',
        type: 'REST',
        tier: 'T1',
        metadata: { description: 'API service' },
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(mockPool.query).mockResolvedValue({
        rows: [mockService],
        command: '',
        oid: 0,
        fields: [],
        rowCount: 1,
      });

      const result = await getServiceById(mockPool, 'service-1');

      expect(result).toEqual(mockService);
      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM services WHERE id = $1', [
        'service-1',
      ]);
    });

    it('should return null when not found', async () => {
      vi.mocked(mockPool.query).mockResolvedValue({
        rows: [],
        command: '',
        oid: 0,
        fields: [],
        rowCount: 0,
      });

      const result = await getServiceById(mockPool, 'non-existent-id');

      expect(result).toBeNull();
      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM services WHERE id = $1', [
        'non-existent-id',
      ]);
    });
  });

  describe('getAllServices', () => {
    it('should return all services', async () => {
      const mockServices: DbService[] = [
        {
          id: 'service-1',
          team_id: 'team-1',
          name: 'API Service',
          type: 'REST',
          tier: 'T1',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'service-2',
          team_id: 'team-2',
          name: 'Auth Service',
          type: 'gRPC',
          tier: 'T2',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      vi.mocked(mockPool.query).mockResolvedValue({
        rows: mockServices,
        command: '',
        oid: 0,
        fields: [],
        rowCount: 2,
      });

      const result = await getAllServices(mockPool);

      expect(result).toEqual(mockServices);
      expect(result).toHaveLength(2);
      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM services ORDER BY name');
    });

    it('should return empty array when no services exist', async () => {
      vi.mocked(mockPool.query).mockResolvedValue({
        rows: [],
        command: '',
        oid: 0,
        fields: [],
        rowCount: 0,
      });

      const result = await getAllServices(mockPool);

      expect(result).toEqual([]);
    });
  });
});
