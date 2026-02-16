import { describe, it, expect } from 'vitest';

describe('Backend Package', () => {
  it('should have a working test environment', () => {
    expect(true).toBe(true);
  });

  it('should be able to import shared types', async () => {
    const { Domain, Team, Service } = await import('@servicescape/shared');
    
    const domain: Domain = { id: 'test', name: 'Test Domain' };
    const team: Team = { id: 'team-1', domainId: domain.id, name: 'Test Team' };
    const service: Service = { id: 'svc-1', teamId: team.id, name: 'Test Service' };
    
    expect(domain.id).toBe('test');
    expect(team.domainId).toBe(domain.id);
    expect(service.teamId).toBe(team.id);
  });
});
