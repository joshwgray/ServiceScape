#!/usr/bin/env node
import { config } from 'dotenv';
import { createPool, closePool } from '../db/connection.js';
import { runMigrations } from '../db/migrate.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from packages/backend/.env
config({ path: join(__dirname, '../../.env') });

async function main() {
  console.log('🔄 Running database migrations...');

  const pool = createPool();

  try {
    const result = await runMigrations(pool);

    console.log('✅ Migrations completed successfully!');
    console.log(`  - Executed: ${result.executed}`);
    console.log(`  - Skipped: ${result.skipped}`);
    
    if (result.migrations.length > 0) {
      console.log('\n  New migrations applied:');
      result.migrations.forEach((m: string) => console.log(`    - ${m}`));
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await closePool(pool);
  }
}

main();
