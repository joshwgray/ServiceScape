
export interface TreePlacement {
  position: [number, number, number];
  seed: string;
}

/**
 * Calculate tree positions within domain boundaries only
 * Trees are randomly placed within each domain's 20x20 area
 * Maintains 2-stud distance from buildings and domain edges
 */
export function calculateTreePositions(
  domainLayout: Record<string, { x: number; y: number; z: number }>,
  _groundSize: number, // Unused but kept for API compatibility
  seed: number = 12345
): TreePlacement[] {
  const trees: TreePlacement[] = [];
  
  // Use a simple LCG for seeding consistency
  let state = seed;
  const random = () => {
      // Linear Congruential Generator
      state = (state * 1103515245 + 12345) & 0x7fffffff;
      return (state / 0x7fffffff);
  };

  // Place trees within each domain
  for (const [domainId, domainPos] of Object.entries(domainLayout)) {
    const DOMAIN_SIZE = 20;
    const TREES_PER_DOMAIN = 3 + Math.floor(random() * 4); // 3-6 trees per domain
    const MIN_TREE_SPACING = 2; // Minimum distance between trees
    const EDGE_MARGIN = 2; // 2-stud distance from domain edges
    
    const domainTrees: { x: number; z: number }[] = [];
    
    // Try to place trees within this domain
    const maxAttempts = 50;
    for (let i = 0; i < TREES_PER_DOMAIN; i++) {
      let placed = false;
      
      for (let attempt = 0; attempt < maxAttempts && !placed; attempt++) {
        // Random position within domain bounds
        // Maintain 2-stud margin from edges
        const x = domainPos.x + EDGE_MARGIN + random() * (DOMAIN_SIZE - 2 * EDGE_MARGIN);
        const z = domainPos.z + EDGE_MARGIN + random() * (DOMAIN_SIZE - 2 * EDGE_MARGIN);
        
        // Check spacing from other trees in this domain
        let tooClose = false;
        for (const other of domainTrees) {
          const dx = x - other.x;
          const dz = z - other.z;
          const distance = Math.sqrt(dx * dx + dz * dz);
          if (distance < MIN_TREE_SPACING) {
            tooClose = true;
            break;
          }
        }
        
        if (!tooClose) {
          domainTrees.push({ x, z });
          trees.push({
            position: [x, 0, z],
            seed: `tree-${domainId}-${i}`
          });
          placed = true;
        }
      }
    }
  }

  return trees;
}
