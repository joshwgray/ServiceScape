import { randomUUID } from 'crypto';

interface GeneratedDomain {
  id: string;
  name: string;
  metadata: Record<string, any>;
}

interface GeneratedTeam {
  id: string;
  domain_id: string | null;
  name: string;
  metadata: {
    size: number;
    timezone?: string;
  };
}

interface GeneratedService {
  id: string;
  team_id: string | null;
  name: string;
  type: string;
  tier: string;
  metadata: Record<string, any>;
}

interface Organization {
  domains: GeneratedDomain[];
  teams: GeneratedTeam[];
  services: GeneratedService[];
}

const DOMAIN_NAMES = [
  'Core Platform',
  'Customer Experience',
  'Data & Analytics',
  'Infrastructure',
  'Security & Compliance',
  'Payment Systems',
  'Content Management',
  'Marketing & Growth',
  'Internal Tools',
  'Mobile Applications',
  'API Gateway',
  'Notifications',
  'Search & Discovery',
  'Media Services',
  'Integration Hub'
];

const TEAM_PREFIXES = [
  'Platform', 'Backend', 'Frontend', 'Mobile', 'Data', 
  'Infrastructure', 'DevOps', 'Security', 'API', 'Services'
];

const SERVICE_TYPES = ['API', 'DATABASE', 'MESSAGING', 'FRONTEND', 'BACKEND', 'WORKER'];
const SERVICE_TIERS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const SERVICE_NAMES = [
  'Auth', 'User', 'Profile', 'Payment', 'Order', 'Inventory',
  'Notification', 'Email', 'SMS', 'Push', 'Search', 'Index',
  'Cache', 'Session', 'Config', 'Logger', 'Monitor', 'Metrics',
  'Analytics', 'Reporting', 'ETL', 'Warehouse', 'Gateway',
  'Router', 'Load Balancer', 'CDN', 'Storage', 'Media',
  'Transcoder', 'Thumbnail', 'Upload', 'Download'
];

/**
 * Generate a list of domains
 */
export function generateDomains(count: number = 15): GeneratedDomain[] {
  const domains: GeneratedDomain[] = [];
  const selectedNames = [...DOMAIN_NAMES]
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(count, DOMAIN_NAMES.length));

  for (let i = 0; i < count; i++) {
    const name = selectedNames[i] || `Domain ${i + 1}`;
    domains.push({
      id: randomUUID(),
      name,
      metadata: {
        description: `${name} domain services`,
        owner: `${name.toLowerCase().replace(/\s+/g, '-')}-lead@company.com`
      }
    });
  }

  return domains;
}

/**
 * Generate teams for a domain
 */
export function generateTeamsForDomain(
  domainId: string,
  count?: number
): GeneratedTeam[] {
  const teamCount = count ?? Math.floor(Math.random() * 4) + 2; // 2-5 teams
  const teams: GeneratedTeam[] = [];

  for (let i = 0; i < teamCount; i++) {
    const prefix = TEAM_PREFIXES[Math.floor(Math.random() * TEAM_PREFIXES.length)];
    const suffix = ['Alpha', 'Beta', 'Core', 'Pro', 'Plus'][i % 5];
    
    teams.push({
      id: randomUUID(),
      domain_id: domainId,
      name: `${prefix} ${suffix}`,
      metadata: {
        size: Math.floor(Math.random() * 15) + 5, // 5-20 people
        timezone: ['PST', 'EST', 'UTC', 'IST'][Math.floor(Math.random() * 4)]
      }
    });
  }

  return teams;
}

/**
 * Generate services for a team
 */
export function generateServicesForTeam(
  teamId: string,
  count?: number
): GeneratedService[] {
  const serviceCount = count ?? Math.floor(Math.random() * 7) + 4; // 4-10 services (avg ~7)
  const services: GeneratedService[] = [];

  for (let i = 0; i < serviceCount; i++) {
    const baseName = SERVICE_NAMES[Math.floor(Math.random() * SERVICE_NAMES.length)];
    const suffix = ['Service', 'API', 'Worker', 'Processor', 'Handler'][i % 5];
    
    services.push({
      id: randomUUID(),
      team_id: teamId,
      name: `${baseName} ${suffix}`,
      type: SERVICE_TYPES[Math.floor(Math.random() * SERVICE_TYPES.length)],
      tier: SERVICE_TIERS[Math.floor(Math.random() * SERVICE_TIERS.length)],
      metadata: {
        language: ['TypeScript', 'Python', 'Go', 'Java'][Math.floor(Math.random() * 4)],
        deploymentType: ['kubernetes', 'lambda', 'ecs'][Math.floor(Math.random() * 3)],
        version: `${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}.0`
      }
    });
  }

  return services;
}

export interface OrganizationOptions {
  domainCount?: number;
  teamCount?: number;
  serviceCount?: number;
}

/**
 * Generate complete organization structure
 * Target: ~15 domains, ~50 teams, ~350 services
 * 
 * When options are provided, generates exact counts by distributing evenly
 */
export function generateOrganization(options?: OrganizationOptions): Organization {
  const domainCount = options?.domainCount ?? 15;
  const teamCount = options?.teamCount ?? 50;
  const serviceCount = options?.serviceCount ?? 350;

  const domains = generateDomains(domainCount);
  const teams: GeneratedTeam[] = [];
  const services: GeneratedService[] = [];

  // Calculate distribution of teams across domains
  const teamsPerDomain = Math.floor(teamCount / domainCount);
  const extraTeams = teamCount % domainCount;

  // Generate teams for each domain with calculated counts
  domains.forEach((domain, index) => {
    const count = teamsPerDomain + (index < extraTeams ? 1 : 0);
    const domainTeams = generateTeamsForDomain(domain.id, count);
    teams.push(...domainTeams);
  });

  // Calculate distribution of services across teams
  const servicesPerTeam = Math.floor(serviceCount / teamCount);
  const extraServices = serviceCount % teamCount;

  // Generate services for each team with calculated counts
  teams.forEach((team, index) => {
    const count = servicesPerTeam + (index < extraServices ? 1 : 0);
    const teamServices = generateServicesForTeam(team.id, count);
    services.push(...teamServices);
  });

  return {
    domains,
    teams,
    services
  };
}
