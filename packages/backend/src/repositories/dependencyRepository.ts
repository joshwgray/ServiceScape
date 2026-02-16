import type { Pool } from 'pg';
import type { DbDependency, DependencyType } from '../db/schema.js';

/**
 * Get count of upstream dependencies (services this service depends on)
 * Upstream = dependencies where this service is the source (from_service_id)
 * Semantic: from_service_id depends on to_service_id
 */
export async function getUpstreamDependencyCount(
  pool: Pool,
  serviceId: string
): Promise<number> {
  const result = await pool.query<{ count: string }>(
    'SELECT COUNT(*) as count FROM dependencies WHERE from_service_id = $1',
    [serviceId]
  );
  return parseInt(result.rows[0]?.count || '0', 10);
}

/**
 * Get count of downstream dependencies (services that depend on this service)
 * Downstream = dependencies where this service is the target (to_service_id)
 * Semantic: from_service_id depends on to_service_id
 */
export async function getDownstreamDependencyCount(
  pool: Pool,
  serviceId: string
): Promise<number> {
  const result = await pool.query<{ count: string }>(
    'SELECT COUNT(*) as count FROM dependencies WHERE to_service_id = $1',
    [serviceId]
  );
  return parseInt(result.rows[0]?.count || '0', 10);
}

/**
 * Get all dependencies for a service (both upstream and downstream)
 */
export async function getDependenciesByServiceId(
  pool: Pool,
  serviceId: string
): Promise<DbDependency[]> {
  const result = await pool.query<DbDependency>(
    'SELECT * FROM dependencies WHERE from_service_id = $1 OR to_service_id = $1',
    [serviceId]
  );
  return result.rows;
}

/**
 * Get upstream dependencies (services that this service depends on)
 * Semantic: from_service_id depends on to_service_id
 * Returns rows where this service is the source (from_service_id)
 */
export async function getUpstreamDependencies(
  pool: Pool,
  serviceId: string,
  type?: DependencyType
): Promise<DbDependency[]> {
  if (type) {
    const result = await pool.query<DbDependency>(
      'SELECT * FROM dependencies WHERE from_service_id = $1 AND type = $2',
      [serviceId, type]
    );
    return result.rows;
  }
  
  const result = await pool.query<DbDependency>(
    'SELECT * FROM dependencies WHERE from_service_id = $1',
    [serviceId]
  );
  return result.rows;
}

/**
 * Get downstream dependencies (services that depend on this service)
 * Semantic: from_service_id depends on to_service_id
 * Returns rows where this service is the target (to_service_id)
 */
export async function getDownstreamDependencies(
  pool: Pool,
  serviceId: string,
  type?: DependencyType
): Promise<DbDependency[]> {
  if (type) {
    const result = await pool.query<DbDependency>(
      'SELECT * FROM dependencies WHERE to_service_id = $1 AND type = $2',
      [serviceId, type]
    );
    return result.rows;
  }
  
  const result = await pool.query<DbDependency>(
    'SELECT * FROM dependencies WHERE to_service_id = $1',
    [serviceId]
  );
  return result.rows;
}

/**
 * Get all dependencies of a specific type
 */
export async function getDependenciesByType(
  pool: Pool,
  type: DependencyType
): Promise<DbDependency[]> {
  const result = await pool.query<DbDependency>(
    'SELECT * FROM dependencies WHERE type = $1',
    [type]
  );
  return result.rows;
}
