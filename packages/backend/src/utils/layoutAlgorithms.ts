/**
 * Layout algorithms for 3D positioning of domains, teams, and services
 */

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox extends Position3D {
  width: number;
  height: number;
  depth: number;
}

export interface LayoutItem {
  id: string;
  name: string;
  size?: number;
  tier?: string;
}

/**
 * Check if two bounding boxes collide
 */
export function checkCollision(box1: BoundingBox, box2: BoundingBox): boolean {
  return (
    box1.x <= box2.x + box2.width &&
    box1.x + box1.width >= box2.x &&
    box1.y <= box2.y + box2.height &&
    box1.y + box1.height >= box2.y &&
    box1.z <= box2.z + box2.depth &&
    box1.z + box1.depth >= box2.z
  );
}

/**
 * Calculate domain positions in a grid layout
 * Places domains on the ground plane (z=0) in a grid pattern
 */
export function calculateDomainGrid(
  domains: LayoutItem[],
  spacing: number
): Position3D[] {
  const positions: Position3D[] = [];
  
  // Calculate grid dimensions
  const gridSize = Math.ceil(Math.sqrt(domains.length));
  
  domains.forEach((_domain, index) => {
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    
    positions.push({
      x: col * spacing,
      y: row * spacing,
      z: 0,
    });
  });
  
  return positions;
}

/**
 * Calculate team positions using treemap packing algorithm
 * Places teams within domain bounds using a simple bin packing approach
 */
export function calculateTeamTreemap(
  teams: LayoutItem[],
  domainBounds: BoundingBox
): Position3D[] {
  const positions: Position3D[] = [];
  
  // Sort teams by size (largest first) for better packing
  const sortedTeams = [...teams].sort((a, b) => (b.size || 50) - (a.size || 50));
  
  // Simple row-based packing
  let currentX = domainBounds.x;
  let currentY = domainBounds.y;
  let rowHeight = 0;
  
  sortedTeams.forEach((team) => {
    const teamSize = team.size || 50;
    const padding = 5;
    
    // Check if we need to move to next row
    if (currentX + teamSize > domainBounds.x + domainBounds.width) {
      currentX = domainBounds.x;
      currentY += rowHeight + padding;
      rowHeight = 0;
    }
    
    // Find the original index to maintain order
    const originalIndex = teams.findIndex((t) => t.id === team.id);
    
    // Place team
    positions[originalIndex] = {
      x: currentX,
      y: currentY,
      z: domainBounds.z + 5, // Slightly above domain floor
    };
    
    currentX += teamSize + padding;
    rowHeight = Math.max(rowHeight, teamSize);
  });
  
  return positions;
}

/**
 * Calculate service positions in a vertical stack
 * Places services vertically within team bounds
 */
export function calculateServiceStack(
  services: LayoutItem[],
  teamBounds: BoundingBox,
  spacing: number
): Position3D[] {
  const positions: Position3D[] = [];
  
  // Center position within team bounds
  const centerX = teamBounds.x + teamBounds.width / 2;
  const centerY = teamBounds.y + teamBounds.height / 2;
  
  let currentZ = teamBounds.z + 10; // Start above team floor
  
  services.forEach((_service) => {
    positions.push({
      x: centerX,
      y: centerY,
      z: currentZ,
    });
    
    currentZ += spacing;
  });
  
  return positions;
}
