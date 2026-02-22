import { describe, it, expect } from 'vitest';
import { isServiceInDependencyChain } from '../dependencyHelpers';
import type { Dependency } from '@servicescape/shared';

describe('isServiceInDependencyChain', () => {
  const dependencies: Dependency[] = [
    { id: 'd1', fromServiceId: 'selected', toServiceId: 'dep-downstream', type: 'DECLARED' },
    { id: 'd2', fromServiceId: 'dep-upstream', toServiceId: 'selected', type: 'DECLARED' },
    { id: 'd3', fromServiceId: 'other1', toServiceId: 'other2', type: 'DECLARED' },
  ];

  it('should return true for direct dependencies (downstream: selected → service)', () => {
    expect(isServiceInDependencyChain('dep-downstream', 'selected', dependencies)).toBe(true);
  });

  it('should return true for direct dependencies (upstream: service → selected)', () => {
    expect(isServiceInDependencyChain('dep-upstream', 'selected', dependencies)).toBe(true);
  });

  it('should return false for unrelated services', () => {
    expect(isServiceInDependencyChain('other1', 'selected', dependencies)).toBe(false);
  });

  it('should return false when the service is the selected service itself', () => {
    // The selected service is handled separately; this just checks chain lookup
    expect(isServiceInDependencyChain('selected', 'selected', dependencies)).toBe(false);
  });

  it('should return false when dependencies array is empty', () => {
    expect(isServiceInDependencyChain('dep-downstream', 'selected', [])).toBe(false);
  });
});
