import type { Pool } from 'pg';
import type { DbMember } from '../db/schema.js';

interface CreateMemberInput {
  id: string;
  team_id: string | null;
  name: string;
  role: string;
  email: string | null;
}

/**
 * Get all members for a specific team
 */
export async function getMembersByTeamId(pool: Pool, teamId: string): Promise<DbMember[]> {
  const result = await pool.query<DbMember>(
    'SELECT * FROM members WHERE team_id = $1 ORDER BY name',
    [teamId]
  );
  return result.rows;
}

/**
 * Create a new member
 */
export async function createMember(pool: Pool, member: CreateMemberInput): Promise<DbMember> {
  const result = await pool.query<DbMember>(
    `INSERT INTO members (id, team_id, name, role, email, created_at, updated_at) 
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     RETURNING *`,
    [member.id, member.team_id, member.name, member.role, member.email]
  );
  return result.rows[0];
}
