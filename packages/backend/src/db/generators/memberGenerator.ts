import { randomUUID } from 'crypto';

interface GeneratedMember {
  id: string;
  team_id: string | null;
  name: string;
  role: string;
  email: string | null;
}

export interface TeamWithMetadata {
  id: string;
  metadata: {
    size: number;
  };
}

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn',
  'Sam', 'Jamie', 'Drew', 'Blake', 'Reese', 'Charlie', 'Dakota', 'Skylar',
  'Cameron', 'Emerson', 'Kai', 'River', 'Phoenix', 'Sage', 'Rowan', 'Ash'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Walker', 'Hall', 'Allen'
];

/**
 * Generate members for a team with realistic role distribution
 */
export function generateMembersForTeam(
  teamId: string,
  teamSize: number
): GeneratedMember[] {
  const members: GeneratedMember[] = [];
  const usedNames = new Set<string>();

  // Determine role distribution
  const hasManager = teamSize >= 8;
  const hasLead = teamSize >= 5;
  const qaCount = Math.max(1, Math.floor(teamSize * 0.15)); // ~15% QA
  const seniorCount = Math.floor(teamSize * 0.3); // ~30% senior engineers
  
  let rolesAssigned = 0;

  // Assign manager (if applicable)
  if (hasManager) {
    members.push(createMember(teamId, 'MANAGER', usedNames));
    rolesAssigned++;
  }

  // Assign lead (if applicable and no manager)
  if (hasLead && !hasManager) {
    members.push(createMember(teamId, 'LEAD', usedNames));
    rolesAssigned++;
  }

  // Assign QAs
  for (let i = 0; i < qaCount && rolesAssigned < teamSize; i++) {
    members.push(createMember(teamId, 'QA', usedNames));
    rolesAssigned++;
  }

  // Assign senior engineers
  for (let i = 0; i < seniorCount && rolesAssigned < teamSize; i++) {
    members.push(createMember(teamId, 'SENIOR_ENGINEER', usedNames));
    rolesAssigned++;
  }

  // Fill remaining with regular engineers
  while (rolesAssigned < teamSize) {
    members.push(createMember(teamId, 'ENGINEER', usedNames));
    rolesAssigned++;
  }

  return members;
}

/**
 * Generate members for all teams based on team metadata
 */
export function generateMembersForAllTeams(
  teams: TeamWithMetadata[]
): GeneratedMember[] {
  const allMembers: GeneratedMember[] = [];

  teams.forEach(team => {
    const teamSize = team.metadata.size || 8;
    const members = generateMembersForTeam(team.id, teamSize);
    allMembers.push(...members);
  });

  return allMembers;
}

/**
 * Create a single member with unique name and email
 */
function createMember(
  teamId: string,
  role: string,
  usedNames: Set<string>
): GeneratedMember {
  let name: string;
  let attempts = 0;
  
  // Generate unique name
  do {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    name = `${firstName} ${lastName}`;
    attempts++;
    
    // If we've tried too many times, add a number
    if (attempts > 50) {
      name = `${name} ${attempts}`;
    }
  } while (usedNames.has(name) && attempts < 100);
  
  usedNames.add(name);

  const email = `${name.toLowerCase().replace(/\s+/g, '.')}@company.com`;

  return {
    id: `member-${randomUUID()}`,
    team_id: teamId,
    name,
    role,
    email
  };
}
