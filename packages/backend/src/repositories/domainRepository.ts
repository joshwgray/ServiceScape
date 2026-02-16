import type { Pool } from 'pg';
import type { DbDomain } from '../db/schema.js';

/**
 * Get all domains from the database
 */
export async function getAllDomains(pool: Pool): Promise<DbDomain[]> {
  const result = await pool.query<DbDomain>('SELECT * FROM domains ORDER BY name');
  return result.rows;
}

/**
 * Get a single domain by ID
 */
export async function getDomainById(pool: Pool, id: string): Promise<DbDomain | null> {
  const result = await pool.query<DbDomain>('SELECT * FROM domains WHERE id = $1', [id]);
  return result.rows[0] || null;
}
