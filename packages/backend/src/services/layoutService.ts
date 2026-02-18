import type { Pool } from 'pg';
import type { DbLayoutCache, DbDomain, DbTeam, DbService } from '../db/schema.js';
import type { Position3D, BoundingBox } from '@servicescape/shared';
import {
  calculateDomainGrid,
  calculateTeamTreemap,
  calculateServiceStack,
} from '../utils/layoutAlgorithms.js';

export interface LayoutPositions {
  domains: Record<string, Position3D>;
  teams: Record<string, Position3D>;
  services: Record<string, Position3D>;
}

const CACHE_KEY = 'layout_all';
const CACHE_DURATION_MS = 3600000; // 1 hour
const CACHE_VERSION = 5; // Increment when layout structure changes

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

  // Check if cache is valid (not expired AND correct version)
  if (cachedLayout && cachedLayout.expires_at) {
    const isNotExpired = new Date(cachedLayout.expires_at) > new Date();
    const hasCorrectVersion = cachedLayout.metadata?.version === CACHE_VERSION;
    
    if (isNotExpired && hasCorrectVersion) {
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
  const domainItems = domains.map((d) => ({ id: d.id, name: d.name, size: 20 }));
  const domainPositions = calculateDomainGrid(domainItems, 24);

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
        width: 20,   // x-axis extent
        height: 50,   // y-axis extent (vertical)
        depth: 20,   // z-axis extent
      };

      const teamItems = teams.map((t) => ({ id: t.id, name: t.name, size: 3 }));
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
            width: 3,   // x-axis extent
            height: 50,  // y-axis extent (vertical)
            depth: 3,   // z-axis extent
          };

          const serviceItems = services.map((s) => ({
            id: s.id,
            name: s.name,
            tier: s.tier || 'T1',
          }));
          const servicePositions = calculateServiceStack(serviceItems, teamBounds, 0.6);

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
  const metadata = { version: CACHE_VERSION };

  await pool.query(
    `INSERT INTO layout_cache (cache_key, layout_type, positions, metadata, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (cache_key)
     DO UPDATE SET positions = $3, metadata = $4, expires_at = $5, updated_at = CURRENT_TIMESTAMP`,
    [CACHE_KEY, 'DOMAIN_GRID', JSON.stringify(positions), JSON.stringify(metadata), expiresAt]
  );
}

/**
 * Invalidate layout cache
 */
export async function invalidateLayoutCache(pool: Pool): Promise<void> {
  await pool.query('DELETE FROM layout_cache WHERE cache_key = $1', [CACHE_KEY]);
}
