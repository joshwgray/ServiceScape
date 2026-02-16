import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDatabaseConfig } from '../database.js';

describe('Database Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('should return config with correct defaults', () => {
    const config = getDatabaseConfig();

    expect(config).toBeDefined();
    expect(config.host).toBe('localhost');
    expect(config.port).toBe(5432);
    expect(config.database).toBe('servicescape');
    expect(config.user).toBe('servicescape_user');
    expect(config.password).toBe('servicescape_pass');
  });

  it('should use environment variables when set', () => {
    process.env.DB_HOST = 'db.example.com';
    process.env.DB_PORT = '5433';
    process.env.DB_NAME = 'test_db';
    process.env.DB_USER = 'test_user';
    process.env.DB_PASSWORD = 'test_pass';

    const config = getDatabaseConfig();

    expect(config.host).toBe('db.example.com');
    expect(config.port).toBe(5433);
    expect(config.database).toBe('test_db');
    expect(config.user).toBe('test_user');
    expect(config.password).toBe('test_pass');
  });

  it('should validate required fields', () => {
    const config = getDatabaseConfig();

    expect(config.host).toBeTruthy();
    expect(config.port).toBeGreaterThan(0);
    expect(config.database).toBeTruthy();
    expect(config.user).toBeTruthy();
    expect(config.password).toBeTruthy();
  });
});
