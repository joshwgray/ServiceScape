import { describe, it, expect } from 'vitest';
import { calculateTreePositions } from '../../utils/treePlacement.ts';

// Mock Position3D interface just in case shared types approach isn't working as expected in tests
// but ideally we should import. I will use a local type for the test if needed.
type DomainLayout = Record<string, { x: number; y: number; z: number }>;

describe('treePlacement', () => {
  const mockDomains: DomainLayout = {
    'domain-1': { x: 0, y: 0, z: 0 },
    'domain-2': { x: 50, y: 0, z: 50 },
  };
  const groundSize = 600;

  it('generates tree positions', () => {
    const trees = calculateTreePositions(mockDomains, groundSize);
    expect(trees.length).toBeGreaterThan(0);
    expect(trees[0]).toHaveProperty('position');
    expect(trees[0]).toHaveProperty('seed');
  });

  it('places trees within domain boundaries only', () => {
    // Trees should now be INSIDE domain areas, not outside
    const trees = calculateTreePositions(mockDomains, groundSize, 12345);
    
    trees.forEach(tree => {
      const [tx, , tz] = tree.position;
      
      // Check if tree is within domain-1 (0,0) to (20,20) OR domain-2 (50,50) to (70,70)
      const inDomain1 = tx >= 0 && tx <= 20 && tz >= 0 && tz <= 20;
      const inDomain2 = tx >= 50 && tx <= 70 && tz >= 50 && tz <= 70;
      
      // Tree MUST be in one of the domains
      expect(inDomain1 || inDomain2).toBe(true);
    });
  });

  it('generates multiple trees per domain', () => {
    const trees = calculateTreePositions(mockDomains, groundSize, 999);
    
    // Count trees in each domain
    let domain1Count = 0;
    let domain2Count = 0;
    
    trees.forEach(tree => {
      const [x, , z] = tree.position;
      
      if (x >= 0 && x <= 20 && z >= 0 && z <= 20) {
        domain1Count++;
      } else if (x >= 50 && x <= 70 && z >= 50 && z <= 70) {
        domain2Count++;
      }
    });

    // Each domain should have several trees (3-6 per domain)
    expect(domain1Count).toBeGreaterThan(0);
    expect(domain1Count).toBeLessThanOrEqual(6);
    expect(domain2Count).toBeGreaterThan(0);
    expect(domain2Count).toBeLessThanOrEqual(6);
  });

  it('generates deterministic results with same seed', () => {
    const trees1 = calculateTreePositions(mockDomains, groundSize, 42);
    const trees2 = calculateTreePositions(mockDomains, groundSize, 42);
    
    expect(trees1).toEqual(trees2);
  });

  it('generates different results with different seeds', () => {
    const trees1 = calculateTreePositions(mockDomains, groundSize, 42);
    const trees2 = calculateTreePositions(mockDomains, groundSize, 43);
    
    expect(trees1).not.toEqual(trees2);
  });
  
  it('respects minimum spacing between trees within domains', () => {
     const trees = calculateTreePositions(mockDomains, groundSize, 100);
     
     // Check that trees within each domain maintain minimum spacing
     trees.forEach((tree1, i) => {
       trees.forEach((tree2, j) => {
         if (i >= j) return; // Skip self and already-checked pairs
         
         const [x1, , z1] = tree1.position;
         const [x2, , z2] = tree2.position;
         
         // Only check spacing if both trees are in the same domain
         const inDomain1_1 = x1 >= 0 && x1 <= 20 && z1 >= 0 && z1 <= 20;
         const inDomain1_2 = x2 >= 0 && x2 <= 20 && z2 >= 0 && z2 <= 20;
         const inDomain2_1 = x1 >= 50 && x1 <= 70 && z1 >= 50 && z1 <= 70;
         const inDomain2_2 = x2 >= 50 && x2 <= 70 && z2 >= 50 && z2 <= 70;
         
         const sameDomain = (inDomain1_1 && inDomain1_2) || (inDomain2_1 && inDomain2_2);
         
         if (sameDomain) {
           const distance = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
           expect(distance).toBeGreaterThanOrEqual(2); // MIN_TREE_SPACING = 2
         }
       });
     });
  });
});
