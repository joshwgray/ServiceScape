import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Pool } from 'pg';
import { getMembersByTeamId, createMember } from '../memberRepository.js';
import type { DbMember } from '../../db/schema.js';

describe('Member Repository', () => {
  let mockPool: Pool;
  let mockQuery: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockQuery = vi.fn();
    mockPool = {
      query: mockQuery,
    } as unknown as Pool;
  });

  describe('getMembersByTeamId', () => {
    it('should return empty array when no members exist', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        command: '',
        oid: 0,
        fields: [],
        rowCount: 0,
      });

      const result = await getMembersByTeamId(mockPool, 'team-1');

      expect(result).toEqual([]);
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM members WHERE team_id = $1 ORDER BY name',
        ['team-1']
      );
    });

    it('should return members for specific team', async () => {
      const mockMembers: DbMember[] = [
        {
          id: 'member-1',
          team_id: 'team-1',
          name: 'Alice Smith',
          role: 'ENGINEER',
          email: 'alice@example.com',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'member-2',
          team_id: 'team-1',
          name: 'Bob Jones',
          role: 'LEAD',
          email: 'bob@example.com',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockQuery.mockResolvedValue({
        rows: mockMembers,
        command: '',
        oid: 0,
        fields: [],
        rowCount: 2,
      });

      const result = await getMembersByTeamId(mockPool, 'team-1');

      expect(result).toEqual(mockMembers);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Alice Smith');
    });
  });

  describe('createMember', () => {
    it('should create and return new member', async () => {
      const newMember = {
        id: 'member-123',
        team_id: 'team-1',
        name: 'Charlie Brown',
        role: 'ENGINEER',
        email: 'charlie@example.com'
      };

      const createdMember: DbMember = {
        ...newMember,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValue({
        rows: [createdMember],
        command: 'INSERT',
        oid: 0,
        fields: [],
        rowCount: 1,
      });

      const result = await createMember(mockPool, newMember);

      expect(result).toEqual(createdMember);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO members'),
        [newMember.id, newMember.team_id, newMember.name, newMember.role, newMember.email]
      );
    });
  });
});
