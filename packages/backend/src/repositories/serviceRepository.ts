import type { Pool } from 'pg';
import type { DbService } from '../db/schema.js';

interface CreateServiceInput {
  id: string;
  team_id: string | null;
  name: string;
  type: string;
  tier: string;
  metadata: Record<string, any>;
}

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

/**
 * Create a new service
 */
export async function createService(pool: Pool, service: CreateServiceInput): Promise<DbService> {
  const result = await pool.query<DbService>(
    `INSERT INTO services (id, team_id, name, type, tier, metadata, created_at, updated_at) 
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
     RETURNING *`,
    [service.id, service.team_id, service.name, service.type, service.tier, JSON.stringify(service.metadata)]
  );
  return result.rows[0];
}
