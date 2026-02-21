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
 * Generates an L-shaped stepped path of 1×1 brick segments between start and end.
 *
 * Algorithm:
 * 1. Walk along the X axis from start.x → end.x in brickSize steps.
 * 2. Walk along the Z axis from start.z → end.z in brickSize steps.
 * This produces a blocky, axis-aligned path — no diagonal or curve interpolation.
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
  // Paths should be elevated above the ground plate for visibility
  // Ground plate is at y=0.2, so position path at y=0.8 (center of 0.8-height brick)
  const y = 0.8;

  const dx = end.x - start.x;
  const dz = end.z - start.z;

  // Use ceil so that even sub-brickSize distances produce at least one brick,
  // preventing gaps and ensuring the path always spans start→end.
  const stepsX = dx === 0 ? 0 : Math.ceil(Math.abs(dx) / brickSize);
  const stepsZ = dz === 0 ? 0 : Math.ceil(Math.abs(dz) / brickSize);

  const signX = dx >= 0 ? 1 : -1;
  const signZ = dz >= 0 ? 1 : -1;

  // Horizontal segment (along X)
  for (let i = 0; i < stepsX; i++) {
    const x = start.x + (i + 0.5) * signX * brickSize;
    segments.push({ position: [x, y, start.z] });
  }

  // Vertical segment (along Z) starting from the corner
  const cornerX = start.x + stepsX * signX * brickSize;
  for (let i = 0; i < stepsZ; i++) {
    const z = start.z + (i + 0.5) * signZ * brickSize;
    segments.push({ position: [cornerX, y, z] });
  }

  return segments;
}
