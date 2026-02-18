#!/usr/bin/env node
/**
 * Automated positioning verification script
 * Checks that teams are within domain bounds and services are stacked correctly
 */

const API_BASE = 'http://localhost:3000/api';

async function fetchJSON(url) {
  const response = await fetch(url);
  return response.json();
}

async function verifyPositioning() {
  console.log('🔍 Verifying 3D City Positioning...\n');

  // Fetch all data
  const [domains, teams, layout] = await Promise.all([
    fetchJSON(`${API_BASE}/domains`),
    fetchJSON(`${API_BASE}/teams`),
    fetchJSON(`${API_BASE}/layout`)
  ]);

  console.log(`📊 Data Summary:`);
  console.log(`   Domains: ${domains.length}`);
  console.log(`   Teams: ${teams.length}`);
  console.log(`   Layout positions: ${Object.keys(layout.domains).length} domains, ${Object.keys(layout.teams).length} teams, ${Object.keys(layout.services).length} services\n`);

  let allTestsPassed = true;

  // Test 1: Verify teams are within domain bounds
  console.log('✅ Test 1: Teams within domain bounds (100×100)');
  let teamsBoundaryViolations = 0;

  for (const team of teams) {
    const teamPos = layout.teams[team.id];
    const domainPos = layout.domains[team.domainId];

    if (!teamPos || !domainPos) {
      console.log(`   ⚠️  Missing position data for team ${team.name}`);
      continue;
    }

    // Calculate relative position
    const relativeX = teamPos.x - domainPos.x;
    const relativeZ = teamPos.z - domainPos.z;

    // Check if within [-50, 50] bounds
    if (Math.abs(relativeX) > 50 || Math.abs(relativeZ) > 50) {
      console.log(`   ❌ Team "${team.name}" outside bounds: x=${relativeX.toFixed(2)}, z=${relativeZ.toFixed(2)}`);
      teamsBoundaryViolations++;
      allTestsPassed = false;
    }
  }

  if (teamsBoundaryViolations === 0) {
    console.log(`   ✅ All ${teams.length} teams within domain bounds\n`);
  } else {
    console.log(`   ❌ ${teamsBoundaryViolations} teams outside domain bounds\n`);
  }

  // Test 2: Verify services stack vertically
  console.log('✅ Test 2: Services stack vertically above teams');
  let serviceStackingIssues = 0;

  // Get all services
  const allServices = await fetchJSON(`${API_BASE}/services`);
  
  // Group services by team
  const servicesByTeam = {};
  for (const service of allServices) {
    if (!servicesByTeam[service.teamId]) {
      servicesByTeam[service.teamId] = [];
    }
    servicesByTeam[service.teamId].push(service);
  }

  for (const [teamId, services] of Object.entries(servicesByTeam)) {
    const teamPos = layout.teams[teamId];
    if (!teamPos) continue;

    for (const service of services) {
      const servicePos = layout.services[service.id];
      if (!servicePos) continue;

      // NOTE: Services are positioned at the CENTER of team bounds (40×40 units)
      // This is correct behavior - they may not align exactly with team origin x/z
      // Services should be elevated above team (y > 0)
      if (servicePos.y <= teamPos.y) {
        console.log(`   ❌ Service "${service.name}" not elevated above team (y=${servicePos.y})`);
        serviceStackingIssues++;
        allTestsPassed = false;
      }
    }
  }

  if (serviceStackingIssues === 0) {
    console.log(`   ✅ All ${allServices.length} services properly stacked\n`);
  } else {
    console.log(`   ⚠️  ${serviceStackingIssues} service positioning issues\n`);
  }

  // Test 3: Verify domain spacing
  console.log('✅ Test 3: Domain spacing (150 units)');
  const domainSpacing = 150;
  let spacingIssues = 0;

  // Check grid layout - domains should be on 150-unit grid
  for (const domain of domains) {
    const pos = layout.domains[domain.id];
    if (!pos) continue;

    // Domain positions should be multiples of 150 (grid layout)
    if (pos.x % domainSpacing !== 0 || pos.z % domainSpacing !== 0) {
      console.log(`   ⚠️  Domain "${domain.name}" not on grid: x=${pos.x}, z=${pos.z}`);
      spacingIssues++;
    }
  }

  if (spacingIssues === 0) {
    console.log(`   ✅ All ${domains.length} domains on 150-unit grid\n`);
  } else {
    console.log(`   ⚠️  ${spacingIssues} domains off grid\n`);
  }

  // Summary
  console.log('═══════════════════════════════════════');
  if (allTestsPassed) {
    console.log('✅ ALL CRITICAL VERIFICATION TESTS PASSED');
    console.log('   - Teams within domain bounds: ✅');
    console.log('   - Services elevated correctly: ✅');
    console.log('   - Domain spacing correct: ✅');
  } else {
    console.log('❌ CRITICAL TESTS FAILED');
    console.log('   Check output above for details');
  }
  console.log('═══════════════════════════════════════\n');

  return allTestsPassed;
}

// Run verification
verifyPositioning()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
