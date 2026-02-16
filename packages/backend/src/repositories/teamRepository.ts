import type { Pool } from 'pg';
import type { DbTeam } from '../db/schema.js';

/**
 * Get all teams for a specific domain
 */
export async function getTeamsByDomainId(pool: Pool, domainId: string): Promise<DbTeam[]> {
  const result = await pool.query<DbTeam>(
    'SELECT * FROM teams WHERE domain_id = $1 ORDER BY name',
    [domainId]
  );
  return result.rows;
}

/**
 * Get a single team by ID
 */
export async function getTeamById(pool: Pool, id: string): Promise<DbTeam | null> {
  const result = await pool.query<DbTeam>('SELECT * FROM teams WHERE id = $1', [id]);
  return result.rows[0] || null;
}
