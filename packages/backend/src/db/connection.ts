import { Pool, PoolConfig } from 'pg';
import { getDatabaseConfig } from '../config/database.js';

export function createPool(config?: PoolConfig): Pool {
  const dbConfig = getDatabaseConfig();

  const poolConfig: PoolConfig = config || {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    password: dbConfig.password,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
  };

  return new Pool(poolConfig);
}

export async function healthCheck(pool: Pool): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

export async function closePool(pool: Pool): Promise<void> {
  try {
    await pool.end();
  } catch (error) {
    console.error('Error closing pool:', error);
    throw error;
  }
}
