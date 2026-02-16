import type { Pool } from 'pg';
import type { DbService } from '../db/schema.js';

/**
 * Get all services for a specific team
 */
export async function getServicesByTeamId(pool: Pool, teamId: string): Promise<DbService[]> {
  const result = await pool.query<DbService>(
    'SELECT * FROM services WHERE team_id = $1 ORDER BY name',
    [teamId]
  );
  return result.rows;
}

/**
 * Get a single service by ID
 */
export async function getServiceById(pool: Pool, id: string): Promise<DbService | null> {
  const result = await pool.query<DbService>('SELECT * FROM services WHERE id = $1', [id]);
  return result.rows[0] || null;
}

/**
 * Get all services
 */
export async function getAllServices(pool: Pool): Promise<DbService[]> {
  const result = await pool.query<DbService>('SELECT * FROM services ORDER BY name');
  return result.rows;
}
