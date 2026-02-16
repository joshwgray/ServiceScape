import type { Pool } from 'pg';
import { generateOrganization } from './generators/organizationGenerator.js';
import { generateMembersForAllTeams } from './generators/memberGenerator.js';
import { generateDependencies } from './generators/dependencyGenerator.js';
import { createDomain } from '../repositories/domainRepository.js';
import { createTeam } from '../repositories/teamRepository.js';
import { createService } from '../repositories/serviceRepository.js';
import { createMember } from '../repositories/memberRepository.js';
import { createDependency } from '../repositories/dependencyRepository.js';

/**
 * Clear all data from the database
 */
export async function clearDatabase(pool: Pool): Promise<void> {
  await pool.query('DELETE FROM dependencies');
  await pool.query('DELETE FROM members');
  await pool.query('DELETE FROM services');
  await pool.query('DELETE FROM teams');
  await pool.query('DELETE FROM domains');
  await pool.query('DELETE FROM layout_cache');
}

/**
 * Seed the database with mock organization data
 */
export async function seedDatabase(pool: Pool): Promise<void> {
  console.log('Generating organization data...');
  
  // Generate organization structure with deterministic counts
  const { domains, teams, services } = generateOrganization({
    domainCount: 15,
    teamCount: 50,
    serviceCount: 350
  });
  
  console.log(`Generated ${domains.length} domains`);
  console.log(`Generated ${teams.length} teams`);
  console.log(`Generated ${services.length} services`);

  // Generate members for teams
  console.log('Generating team members...');
  const members = generateMembersForAllTeams(teams);
  console.log(`Generated ${members.length} members`);

  // Generate dependencies
  console.log('Generating dependencies...');
  const dependencies = generateDependencies(services, teams);
  console.log(`Generated ${dependencies.length} dependencies`);

  // Insert data using repositories
  console.log('Inserting domains...');
  for (const domain of domains) {
    await createDomain(pool, {
      id: domain.id,
      name: domain.name,
      metadata: domain.metadata
    });
  }

  console.log('Inserting teams...');
  for (const team of teams) {
    await createTeam(pool, {
      id: team.id,
      domain_id: team.domain_id,
      name: team.name,
      metadata: team.metadata
    });
  }

  console.log('Inserting services...');
  for (const service of services) {
    await createService(pool, {
      id: service.id,
      team_id: service.team_id,
      name: service.name,
      type: service.type,
      tier: service.tier,
      metadata: service.metadata
    });
  }

  console.log('Inserting members...');
  for (const member of members) {
    await createMember(pool, {
      id: member.id,
      team_id: member.team_id,
      name: member.name,
      role: member.role,
      email: member.email
    });
  }

  console.log('Inserting dependencies...');
  for (const dependency of dependencies) {
    await createDependency(pool, {
      id: dependency.id,
      from_service_id: dependency.from_service_id,
      to_service_id: dependency.to_service_id,
      type: dependency.type,
      metadata: dependency.metadata
    });
  }

  console.log('Database seeding complete!');
  console.log('Summary:');
  console.log(`  - Domains: ${domains.length}`);
  console.log(`  - Teams: ${teams.length}`);
  console.log(`  - Services: ${services.length}`);
  console.log(`  - Members: ${members.length}`);
  console.log(`  - Dependencies: ${dependencies.length}`);
}
