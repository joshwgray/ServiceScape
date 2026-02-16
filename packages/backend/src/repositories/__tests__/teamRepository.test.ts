import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Pool } from 'pg';
import { getTeamsByDomainId, getTeamById } from '../teamRepository.js';
import type { DbTeam } from '../../db/schema.js';

describe('Team Repository', () => {
  let mockPool: Pool;

  beforeEach(() => {
    mockPool = {
      query: vi.fn() as any,
    } as unknown as Pool;
  });

  describe('getTeamsByDomainId', () => {
    it('should return empty array when no teams exist', async () => {
      vi.mocked(mockPool.query).mockResolvedValue({
        rows: [],
        command: '',
        oid: 0,
        fields: [],
        rowCount: 0,
      });

      const result = await getTeamsByDomainId(mockPool, 'domain-1');

      expect(result).toEqual([]);
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM teams WHERE domain_id = $1 ORDER BY name',
        ['domain-1']
      );
    });

    it('should return teams for specific domain', async () => {
      const mockTeams: DbTeam[] = [
        {
          id: 'team-1',
          domain_id: 'domain-1',
          name: 'Backend Team',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'team-2',
          domain_id: 'domain-1',
          name: 'Frontend Team',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      vi.mocked(mockPool.query).mockResolvedValue({
        rows: mockTeams,
        command: '',
        oid: 0,
        fields: [],
        rowCount: 2,
      });

      const result = await getTeamsByDomainId(mockPool, 'domain-1');

      expect(result).toEqual(mockTeams);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Backend Team');
    });

    it('should filter correctly - only return teams for that domain', async () => {
      const mockTeams: DbTeam[] = [
        {
          id: 'team-1',
          domain_id: 'domain-1',
          name: 'Backend Team',
          metadata: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      vi.mocked(mockPool.query).mockResolvedValue({
        rows: mockTeams,
        command: '',
        oid: 0,
        fields: [],
        rowCount: 1,
      });

      const result = await getTeamsByDomainId(mockPool, 'domain-1');

      expect(result).toHaveLength(1);
      expect(result[0].domain_id).toBe('domain-1');
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM teams WHERE domain_id = $1 ORDER BY name',
        ['domain-1']
      );
    });
  });

  describe('getTeamById', () => {
    it('should return team when found', async () => {
      const mockTeam: DbTeam = {
        id: 'team-1',
        domain_id: 'domain-1',
        name: 'Backend Team',
        metadata: { description: 'Backend team' },
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(mockPool.query).mockResolvedValue({
        rows: [mockTeam],
        command: '',
        oid: 0,
        fields: [],
        rowCount: 1,
      });

      const result = await getTeamById(mockPool, 'team-1');

      expect(result).toEqual(mockTeam);
      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM teams WHERE id = $1', ['team-1']);
    });

    it('should return null when not found', async () => {
      vi.mocked(mockPool.query).mockResolvedValue({
        rows: [],
        command: '',
        oid: 0,
        fields: [],
        rowCount: 0,
      });

      const result = await getTeamById(mockPool, 'non-existent-id');

      expect(result).toBeNull();
      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM teams WHERE id = $1', [
        'non-existent-id',
      ]);
    });
  });
});
