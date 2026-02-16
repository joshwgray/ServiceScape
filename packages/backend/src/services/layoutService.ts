import type { Pool } from 'pg';
import type { DbLayoutCache, DbDomain, DbTeam, DbService } from '../db/schema.js';
import {
  calculateDomainGrid,
  calculateTeamTreemap,
  calculateServiceStack,
  type Position3D,
  type BoundingBox,
} from '../utils/layoutAlgorithms.js';

export interface LayoutPositions {
  domains: Record<string, Position3D>;
  teams: Record<string, Position3D>;
  services: Record<string, Position3D>;
}

const CACHE_KEY = 'layout_all';
const CACHE_DURATION_MS = 3600000; // 1 hour

/**
 * Get layout positions, using cache if available
 */
export async function getLayout(pool: Pool): Promise<LayoutPositions> {
  // Try to get from cache
  const cacheResult = await pool.query<DbLayoutCache>(
    'SELECT * FROM layout_cache WHERE cache_key = $1',
    [CACHE_KEY]
  );

  const cachedLayout = cacheResult.rows[0];

  // Check if cache is valid
  if (cachedLayout && cachedLayout.expires_at) {
    if (new Date(cachedLayout.expires_at) > new Date()) {
      return cachedLayout.positions as LayoutPositions;
    }
  }

  // Cache miss or expired - compute new layout
  return computeLayout(pool);
}

/**
 * Compute layout positions for all domains, teams, and services
 */
export async function computeLayout(pool: Pool): Promise<LayoutPositions> {
  // Get all entities
  const domainsResult = await pool.query<DbDomain>('SELECT * FROM domains ORDER BY name');
  const domains = domainsResult.rows;

  const positions: LayoutPositions = {
    domains: {},
    teams: {},
    services: {},
  };

  // Calculate domain positions
  const domainItems = domains.map((d) => ({ id: d.id, name: d.name, size: 100 }));
  const domainPositions = calculateDomainGrid(domainItems, 150);

  domains.forEach((domain, index) => {
    positions.domains[domain.id] = domainPositions[index];
  });

  // Calculate team positions for each domain
  for (const domain of domains) {
    const teamsResult = await pool.query<DbTeam>(
      'SELECT * FROM teams WHERE domain_id = $1 ORDER BY name',
      [domain.id]
    );
    const teams = teamsResult.rows;

    if (teams.length > 0) {
      const domainPos = positions.domains[domain.id];
      const domainBounds: BoundingBox = {
        x: domainPos.x,
        y: domainPos.y,
        z: domainPos.z,
        width: 100,
        height: 100,
        depth: 50,
      };

      const teamItems = teams.map((t) => ({ id: t.id, name: t.name, size: 40 }));
      const teamPositions = calculateTeamTreemap(teamItems, domainBounds);

      teams.forEach((team, index) => {
        positions.teams[team.id] = teamPositions[index];
      });

      // Calculate service positions for each team
      for (const team of teams) {
        const servicesResult = await pool.query<DbService>(
          'SELECT * FROM services WHERE team_id = $1 ORDER BY name',
          [team.id]
        );
        const services = servicesResult.rows;

        if (services.length > 0) {
          const teamPos = positions.teams[team.id];
          const teamBounds: BoundingBox = {
            x: teamPos.x,
            y: teamPos.y,
            z: teamPos.z,
            width: 40,
            height: 40,
            depth: 50,
          };

          const serviceItems = services.map((s) => ({
            id: s.id,
            name: s.name,
            tier: s.tier || 'T1',
          }));
          const servicePositions = calculateServiceStack(serviceItems, teamBounds, 10);

          services.forEach((service, index) => {
            positions.services[service.id] = servicePositions[index];
          });
        }
      }
    }
  }

  // Save to cache
  await saveLayoutCache(pool, positions);

  return positions;
}

/**
 * Save layout to cache
 */
async function saveLayoutCache(pool: Pool, positions: LayoutPositions): Promise<void> {
  const expiresAt = new Date(Date.now() + CACHE_DURATION_MS);

  await pool.query(
    `INSERT INTO layout_cache (cache_key, layout_type, positions, expires_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (cache_key)
     DO UPDATE SET positions = $3, expires_at = $4, updated_at = CURRENT_TIMESTAMP`,
    [CACHE_KEY, 'DOMAIN_GRID', JSON.stringify(positions), expiresAt]
  );
}

/**
 * Invalidate layout cache
 */
export async function invalidateLayoutCache(pool: Pool): Promise<void> {
  await pool.query('DELETE FROM layout_cache WHERE cache_key = $1', [CACHE_KEY]);
}
