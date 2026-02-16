#!/usr/bin/env tsx

/**
 * Script to seed the database with mock organization data
 * Run with: npm run seed
 */

import { createPool, closePool } from '../db/connection.js';
import { seedDatabase, clearDatabase } from '../db/seed.js';

async function main() {
  const pool = createPool();

  try {
    console.log('Starting database seed...\n');

    // Ask for confirmation to clear existing data
    console.log('WARNING: This will delete all existing data in the database.');
    console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('Clearing existing data...');
    await clearDatabase(pool);

    console.log('\nSeeding database with mock data...');
    await seedDatabase(pool);

    console.log('\n✅ Database seeding completed successfully!');
    process.exitCode = 0;
  } catch (error) {
    console.error('\n❌ Database seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await closePool(pool);
  }
}

main();
