/**
 * Layout algorithms for 3D positioning of domains, teams, and services
 * Uses Three.js coordinate convention: x/z ground plane, y vertical
 */

import type { Position3D, BoundingBox, LayoutItem } from '@servicescape/shared';

// Re-export types for convenience
export type { Position3D, BoundingBox, LayoutItem };

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
 * Places domains on the x/z ground plane (y=0) in a grid pattern
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
      y: 0,  // Ground plane is y=0 (Three.js convention)
      z: row * spacing,  // Use z for depth/rows
    });
  });
  
  return positions;
}

/**
 * Calculate team positions using treemap packing algorithm
 * Places teams within domain bounds on x/z plane (y=0)
 */
export function calculateTeamTreemap(
  teams: LayoutItem[],
  domainBounds: BoundingBox
): Position3D[] {
  const positions: Position3D[] = [];
  
  // Sort teams by size (largest first) for better packing
  const sortedTeams = [...teams].sort((a, b) => (b.size || 50) - (a.size || 50));
  
  // Create a map to safely track position assignments
  const positionMap = new Map<string, Position3D>();
  
  // Simple row-based packing on x/z plane
  const border = 3; // 3-stud border on domain plate edges
  const padding = 2; // studs between teams
  let currentX = domainBounds.x + border;
  let currentZ = domainBounds.z + border;
  let rowDepth = 0;
  
  sortedTeams.forEach((team) => {
    const teamSize = team.size || 50;
    
    // Check if we need to move to next row (along z-axis)
    if (currentX + teamSize > domainBounds.x + domainBounds.width - border) {
      currentX = domainBounds.x + border;
      currentZ += rowDepth + padding;
      rowDepth = 0;
    }
    
    // Store position in map using team ID
    positionMap.set(team.id, {
      x: currentX,
      y: 0,  // Teams at ground level
      z: currentZ,
    });
    
    currentX += teamSize + padding;
    rowDepth = Math.max(rowDepth, teamSize);
  });
  
  // Build positions array in original order, using map for safe lookups
  teams.forEach((team) => {
    const position = positionMap.get(team.id);
    if (position) {
      positions.push(position);
    } else {
      // Fallback position if ID is missing (shouldn't happen but defensive)
      positions.push({ x: domainBounds.x, y: 0, z: domainBounds.z });
    }
  });
  
  return positions;
}

/**
 * Calculate service positions in a vertical stack
 * Places services vertically (y-axis) within team bounds
 */
export function calculateServiceStack(
  services: LayoutItem[],
  teamBounds: BoundingBox,
  spacing: number
): Position3D[] {
  const positions: Position3D[] = [];
  
  // Center position on x/z plane
  const centerX = teamBounds.x + teamBounds.width / 2;
  const centerZ = teamBounds.z + teamBounds.depth / 2;
  
  const FLOOR_HEIGHT = 0.5;
  let currentY = teamBounds.y + FLOOR_HEIGHT / 2; // Start with first floor centered at half its height (bottom at ground level)
  
  services.forEach((_service) => {
    positions.push({
      x: centerX,
      y: currentY,  // Stack vertically on y-axis
      z: centerZ,
    });
    
    currentY += spacing;  // Increment y for vertical stacking
  });
  
  return positions;
}
