import type { Pool } from 'pg';

/**
 * Get count of upstream dependencies (services this service depends on)
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
