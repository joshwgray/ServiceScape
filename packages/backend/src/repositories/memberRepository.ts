import type { Pool } from 'pg';
import type { DbMember } from '../db/schema.js';

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
