/**
 * Generates LEGO-style stepped/blocky path segments between two 3D points.
 * Uses an L-shaped (horizontal then vertical) routing instead of smooth curves
 * to maintain the blocky LEGO aesthetic.
 */

export interface PathSegment {
  /** Center position of the brick [x, y, z] */
  position: [number, number, number];
}

/**
 * Generates a 3D Manhattan-routed stepped path of 1×1 brick segments between start and end.
 *
 * Algorithm (X→Z→Y pattern):
 * 1. Walk along the X axis from start.x → end.x in brickSize steps.
 * 2. Walk along the Z axis from start.z → end.z in brickSize steps.
 * 3. Walk along the Y axis from start.y → end.y in brickSize steps (vertical stepping).
 * This produces a blocky, axis-aligned 3D path — no diagonal or curve interpolation.
 *
 * @param start  Starting 3D position {x, y, z}
 * @param end    Ending 3D position {x, y, z}
 * @param brickSize  Side length of each path brick (default 1.0 world units)
 * @returns Array of PathSegment objects, each with a center position.
 */
export function generateLegoPath(
  start: { x: number; y: number; z: number },
  end: { x: number; y: number; z: number },
  brickSize: number = 1.0
): PathSegment[] {
  const segments: PathSegment[] = [];
  
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const dy = end.y - start.y;

  // Use ceil so that even sub-brickSize distances produce at least one brick,
  // preventing gaps and ensuring the path always spans start→end.
  const stepsX = dx === 0 ? 0 : Math.ceil(Math.abs(dx) / brickSize);
  const stepsZ = dz === 0 ? 0 : Math.ceil(Math.abs(dz) / brickSize);
  const stepsY = dy === 0 ? 0 : Math.ceil(Math.abs(dy) / brickSize);

  const signX = dx >= 0 ? 1 : -1;
  const signZ = dz >= 0 ? 1 : -1;
  const signY = dy >= 0 ? 1 : -1;

  // Paths should be elevated above the ground plate for visibility
  // Ground plate is at y=0.2, so position path at y=0.8 (center of 0.8-height brick)
  // For horizontal segments, use the elevated y position (0.8) or start.y if already elevated
  const horizontalY = start.y;

  // Phase 1: Horizontal segment (along X)
  for (let i = 0; i < stepsX; i++) {
    const x = start.x + (i + 0.5) * signX * brickSize;
    segments.push({ position: [x, horizontalY, start.z] });
  }

  // Phase 2: Horizontal segment (along Z) starting from the corner
  const cornerX = start.x + stepsX * signX * brickSize;
  for (let i = 0; i < stepsZ; i++) {
    const z = start.z + (i + 0.5) * signZ * brickSize;
    segments.push({ position: [cornerX, horizontalY, z] });
  }

  // Phase 3: Vertical segment (along Y) starting from the horizontal corner
  const cornerZ = start.z + stepsZ * signZ * brickSize;
  for (let i = 0; i < stepsY; i++) {
    const y = start.y + (i + 0.5) * signY * brickSize;
    segments.push({ position: [cornerX, y, cornerZ] });
  }

  return segments;
}
