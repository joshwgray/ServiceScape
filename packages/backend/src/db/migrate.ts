import { Pool } from 'pg';
import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface MigrationResult {
  executed: number;
  skipped: number;
  migrations: string[];
}

async function ensureMigrationsTable(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getExecutedMigrations(pool: Pool): Promise<Set<string>> {
  const result = await pool.query('SELECT name FROM migrations');
  return new Set(result.rows.map(row => row.name));
}

async function getMigrationFiles(): Promise<string[]> {
  const migrationsDir = join(__dirname, 'migrations');
  const files = await readdir(migrationsDir);
  
  // Filter for .sql files and sort them
  return files
    .filter(f => f.endsWith('.sql'))
    .sort();
}

export async function runMigrations(pool: Pool): Promise<MigrationResult> {
  const result: MigrationResult = {
    executed: 0,
    skipped: 0,
    migrations: [],
  };

  // Ensure migrations tracking table exists
  await ensureMigrationsTable(pool);

  // Get list of already executed migrations
  const executedMigrations = await getExecutedMigrations(pool);

  // Get all migration files
  const migrationFiles = await getMigrationFiles();

  // Execute each migration that hasn't been run yet
  for (const filename of migrationFiles) {
    if (executedMigrations.has(filename)) {
      console.log(`Skipping migration: ${filename} (already executed)`);
      result.skipped++;
      continue;
    }

    console.log(`Executing migration: ${filename}`);

    try {
      // Read the migration file
      const migrationsDir = join(__dirname, 'migrations');
      const filepath = join(migrationsDir, filename);
      const sql = await readFile(filepath, 'utf-8');

      // Execute migration in a transaction
      await pool.query('BEGIN');

      try {
        // Run the migration SQL
        await pool.query(sql);

        // Record the migration
        await pool.query({
          text: 'INSERT INTO migrations (name) VALUES ($1)',
          values: [filename],
        });

        await pool.query('COMMIT');

        result.executed++;
        result.migrations.push(filename);
        console.log(`Successfully executed migration: ${filename}`);
      } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error(`Failed to execute migration: ${filename}`, error);
      throw new Error(`Migration failed: ${filename}`);
    }
  }

  return result;
}
