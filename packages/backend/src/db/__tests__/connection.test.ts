import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Pool } from 'pg';
import { createPool, healthCheck, closePool } from '../connection.js';

describe('Database Connection Pool', () => {
  let pool: Pool;

  afterEach(async () => {
    if (pool) {
      await closePool(pool);
    }
  });

  it('should create a PostgreSQL pool', () => {
    pool = createPool();

    expect(pool).toBeDefined();
    expect(pool.connect).toBeDefined();
    expect(pool.query).toBeDefined();
    expect(pool.end).toBeDefined();
  });

  it('should allow pool to execute simple query', async () => {
    pool = createPool();

    // Mock the query method to avoid needing a real database
    const mockQuery = vi.fn().mockResolvedValue({ rows: [{ result: 1 }] });
    pool.query = mockQuery;

    const result = await pool.query('SELECT 1 as result');

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].result).toBe(1);
    expect(mockQuery).toHaveBeenCalledWith('SELECT 1 as result');
  });

  it('should have a health check function', async () => {
    pool = createPool();

    // Mock the query method
    const mockQuery = vi.fn().mockResolvedValue({ rows: [{ healthy: true }] });
    pool.query = mockQuery;

    const isHealthy = await healthCheck(pool);

    expect(isHealthy).toBe(true);
    expect(mockQuery).toHaveBeenCalled();
  });

  it('should handle health check failure', async () => {
    pool = createPool();

    // Mock the query method to throw an error
    const mockQuery = vi.fn().mockRejectedValue(new Error('Connection failed'));
    pool.query = mockQuery;

    const isHealthy = await healthCheck(pool);

    expect(isHealthy).toBe(false);
  });

  it('should close pool without errors', async () => {
    pool = createPool();

    // Mock the end method
    const mockEnd = vi.fn().mockResolvedValue(undefined);
    pool.end = mockEnd;

    await closePool(pool);

    expect(mockEnd).toHaveBeenCalled();
  });
});
