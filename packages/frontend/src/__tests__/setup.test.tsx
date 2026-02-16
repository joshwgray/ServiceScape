import { describe, it, expect } from 'vitest';

describe('Frontend Package', () => {
  it('should have a working test environment', () => {
    expect(true).toBe(true);
  });

  it('should be able to import shared types', async () => {
    const { Domain, Service, DependencyType } = await import('@servicescape/shared');
    
    const domain: Domain = { id: 'test', name: 'Test Domain' };
    const depType: DependencyType = 'DECLARED';
    
    expect(domain.name).toBe('Test Domain');
    expect(depType).toBe('DECLARED');
  });
});
