import type { Pool } from 'pg';
import type { DbTeam } from '../db/schema.js';

interface CreateTeamInput {
  id: string;
  domain_id: string | null;
  name: string;
  metadata: Record<string, any>;
}

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
 * Get all teams
 */
export async function getAllTeams(pool: Pool): Promise<DbTeam[]> {
  const result = await pool.query<DbTeam>('SELECT * FROM teams ORDER BY name');
  return result.rows;
}

/**
 * Get a single team by ID
 */
export async function getTeamById(pool: Pool, id: string): Promise<DbTeam | null> {
  const result = await pool.query<DbTeam>('SELECT * FROM teams WHERE id = $1', [id]);
  return result.rows[0] || null;
}

/**
 * Create a new team
 */
export async function createTeam(pool: Pool, team: CreateTeamInput): Promise<DbTeam> {
  const result = await pool.query<DbTeam>(
    `INSERT INTO teams (id, domain_id, name, metadata, created_at, updated_at) 
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     RETURNING *`,
    [team.id, team.domain_id, team.name, JSON.stringify(team.metadata)]
  );
  return result.rows[0];
}
