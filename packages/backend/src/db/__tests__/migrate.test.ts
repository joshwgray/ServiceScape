import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runMigrations, MigrationResult } from '../migrate.js';
import type { Pool } from 'pg';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock the file system
vi.mock('fs/promises');

describe('Database Migrations', () => {
  let mockPool: Pool;

  beforeEach(() => {
    // Create a mock pool
    mockPool = {
      query: vi.fn(),
      connect: vi.fn(),
      end: vi.fn(),
      on: vi.fn(),
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should read SQL migration files', async () => {
    // Mock file system to return migration files
    vi.mocked(fs.readdir).mockResolvedValue([
      '001_initial_schema.sql',
      '002_add_indexes.sql',
    ] as any);

    vi.mocked(fs.readFile).mockImplementation((filePath: any) => {
      if (filePath.includes('001_initial_schema.sql')) {
        return Promise.resolve('CREATE TABLE test1;');
      }
      if (filePath.includes('002_add_indexes.sql')) {
        return Promise.resolve('CREATE INDEX test_idx;');
      }
      return Promise.resolve('');
    });

    // Mock pool.query for migrations table check and creation
    vi.mocked(mockPool.query).mockResolvedValue({ rows: [], command: '', oid: 0, fields: [], rowCount: 0 });

    const result = await runMigrations(mockPool);

    expect(fs.readdir).toHaveBeenCalled();
    expect(result.executed).toBeGreaterThan(0);
  });

  it('should execute migrations in transaction', async () => {
    vi.mocked(fs.readdir).mockResolvedValue(['001_initial_schema.sql'] as any);
    vi.mocked(fs.readFile).mockResolvedValue('CREATE TABLE test;');

    // Mock pool.query to track transaction commands
    const queryCalls: string[] = [];
    vi.mocked(mockPool.query).mockImplementation((sql: any) => {
      queryCalls.push(typeof sql === 'string' ? sql : sql.text || '');
      return Promise.resolve({ rows: [], command: '', oid: 0, fields: [], rowCount: 0 });
    });

    await runMigrations(mockPool);

    // Should have BEGIN, migration SQL, INSERT into migrations table, and COMMIT
    expect(queryCalls).toContain('BEGIN');
    expect(queryCalls).toContain('COMMIT');
  });

  it('should track executed migrations', async () => {
    vi.mocked(fs.readdir).mockResolvedValue(['001_initial_schema.sql'] as any);
    vi.mocked(fs.readFile).mockResolvedValue('CREATE TABLE test;');

    const insertCalls: any[] = [];
    vi.mocked(mockPool.query).mockImplementation((sql: any) => {
      if (typeof sql === 'object' && sql.text && sql.text.includes('INSERT INTO migrations')) {
        insertCalls.push(sql);
      }
      return Promise.resolve({ rows: [], command: '', oid: 0, fields: [], rowCount: 0 });
    });

    await runMigrations(mockPool);

    // Should insert migration record
    expect(insertCalls.length).toBeGreaterThan(0);
  });

  it('should not re-run completed migrations', async () => {
    vi.mocked(fs.readdir).mockResolvedValue(['001_initial_schema.sql'] as any);
    vi.mocked(fs.readFile).mockResolvedValue('CREATE TABLE test;');

    // Mock that migration already exists
    let queryCount = 0;
    vi.mocked(mockPool.query).mockImplementation((sql: any) => {
      const sqlText = typeof sql === 'string' ? sql : sql.text || '';
      
      // First query checks for existing migrations
      if (sqlText.includes('SELECT name FROM migrations') && queryCount === 0) {
        queryCount++;
        return Promise.resolve({ 
          rows: [{ name: '001_initial_schema.sql' }], 
          command: '', 
          oid: 0, 
          fields: [], 
          rowCount: 1 
        });
      }
      
      return Promise.resolve({ rows: [], command: '', oid: 0, fields: [], rowCount: 0 });
    });

    const result = await runMigrations(mockPool);

    // Should not execute any migrations since they're already completed
    expect(result.executed).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it('should handle migration errors', async () => {
    vi.mocked(fs.readdir).mockResolvedValue(['001_bad_migration.sql'] as any);
    vi.mocked(fs.readFile).mockResolvedValue('INVALID SQL;');

    // Mock query to fail on the migration SQL
    let shouldFail = false;
    vi.mocked(mockPool.query).mockImplementation((sql: any) => {
      const sqlText = typeof sql === 'string' ? sql : sql.text || '';
      
      if (sqlText.includes('INVALID SQL')) {
        shouldFail = true;
        return Promise.reject(new Error('Syntax error'));
      }
      
      if (shouldFail && sqlText === 'ROLLBACK') {
        return Promise.resolve({ rows: [], command: '', oid: 0, fields: [], rowCount: 0 });
      }
      
      return Promise.resolve({ rows: [], command: '', oid: 0, fields: [], rowCount: 0 });
    });

    await expect(runMigrations(mockPool)).rejects.toThrow();
  });
});
