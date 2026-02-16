import type { Pool } from 'pg';
import type { DbDomain } from '../db/schema.js';

interface CreateDomainInput {
  id: string;
  name: string;
  metadata: Record<string, any>;
}

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

/**
 * Create a new domain
 */
export async function createDomain(pool: Pool, domain: CreateDomainInput): Promise<DbDomain> {
  const result = await pool.query<DbDomain>(
    `INSERT INTO domains (id, name, metadata, created_at, updated_at) 
     VALUES ($1, $2, $3, NOW(), NOW())
     RETURNING *`,
    [domain.id, domain.name, JSON.stringify(domain.metadata)]
  );
  return result.rows[0];
}
