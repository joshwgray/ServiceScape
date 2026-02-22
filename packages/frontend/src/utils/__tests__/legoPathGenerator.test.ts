import { describe, it, expect } from 'vitest';
import { generateLegoPath, PathSegment } from '../legoPathGenerator';

describe('legoPathGenerator', () => {
  it('should create path segments between two points', () => {
    const start = { x: 0, y: 0.5, z: 0 };
    const end = { x: 10, y: 0.5, z: 0 };
    const segments = generateLegoPath(start, end);
    expect(segments.length).toBeGreaterThan(0);
  });

  it('should use stepped/blocky path instead of smooth curves', () => {
    const start = { x: 0, y: 0.8, z: 0 };
    const end = { x: 10, y: 0.8, z: 10 };
    const brickSize = 1.0;
    const segments = generateLegoPath(start, end, brickSize);

    // All horizontal segments should be at start Y position
    // (vertical segments would be added if end.y differs from start.y)
    const horizontalSegments = segments.filter((s: PathSegment) => s.position[1] === start.y);
    expect(horizontalSegments.length).toBe(segments.length); // All at same height since start.y === end.y

    // Blocky path: each brick center should lie on a brickSize/2-offset grid.
    // This proves positions are discrete, grid-aligned (no bezier interpolation).
    // Centers are at: start + (n + 0.5) * brickSize → remainder of (pos - start) / brickSize == 0.5
    segments.forEach((seg: PathSegment) => {
      const xRel = seg.position[0] - start.x;
      const zRel = seg.position[2] - start.z;
      // Ensure x and z relative positions are multiples of 0.5 (half-brick grid)
      const xOnGrid = Math.abs((Math.abs(xRel) % brickSize) - brickSize / 2) < 0.001
        || Math.abs(Math.abs(xRel) % brickSize) < 0.001;
      const zOnGrid = Math.abs((Math.abs(zRel) % brickSize) - brickSize / 2) < 0.001
        || Math.abs(Math.abs(zRel) % brickSize) < 0.001;
      expect(xOnGrid).toBe(true);
      expect(zOnGrid).toBe(true);
    });

    // L-shaped structure: the first half of the path should have constant Z,
    // and the second half should have constant X (after the corner).
    // The first 10 bricks are along X (z == start.z), next 10 are along Z (x == cornerX).
    const xBricks = segments.filter((s: PathSegment) => Math.abs(s.position[2] - start.z) < 0.001);
    const zBricks = segments.filter((s: PathSegment) => Math.abs(s.position[2] - start.z) >= 0.001);
    // Should have bricks in both axis directions
    expect(xBricks.length).toBeGreaterThan(0);
    expect(zBricks.length).toBeGreaterThan(0);
  });

  it('should create correct number of segments for a straight horizontal path', () => {
    const start = { x: 0, y: 0.5, z: 0 };
    const end = { x: 5, y: 0.5, z: 0 };
    const segments = generateLegoPath(start, end, 1.0);
    // 5 units / 1.0 brick = 5 bricks
    expect(segments.length).toBe(5);
  });

  it('should generate L-shaped path for diagonal connections', () => {
    const start = { x: 0, y: 0.5, z: 0 };
    const end = { x: 4, y: 0.5, z: 4 };
    const segments = generateLegoPath(start, end, 1.0);
    // 4 bricks along X + 4 bricks along Z = 8 bricks
    expect(segments.length).toBe(8);
  });

  it('should handle negative direction paths', () => {
    const start = { x: 10, y: 0.5, z: 10 };
    const end = { x: 5, y: 0.5, z: 5 };
    const segments = generateLegoPath(start, end, 1.0);
    // 5 bricks along -X + 5 bricks along -Z = 10 bricks
    expect(segments.length).toBe(10);
  });

  it('should return empty array for identical start and end positions', () => {
    const start = { x: 5, y: 0.5, z: 5 };
    const end = { x: 5, y: 0.5, z: 5 };
    const segments = generateLegoPath(start, end);
    expect(segments.length).toBe(0);
  });

  it('should respect custom brickSize', () => {
    const start = { x: 0, y: 0.5, z: 0 };
    const end = { x: 6, y: 0.5, z: 0 };
    const segments = generateLegoPath(start, end, 2.0);
    // 6 units / 2.0 brick = 3 bricks
    expect(segments.length).toBe(3);
  });

  // Phase 4: 3D Manhattan Routing Tests (X→Z→Y pattern)

  it('generateLegoPath creates horizontal-then-vertical path pattern (X→Z→Y)', () => {
    const start = { x: 0, y: 0.8, z: 0 };
    const end = { x: 3, y: 2.4, z: 2 };
    const segments = generateLegoPath(start, end, 1.0);

    // Expected: 3 bricks along X, 2 bricks along Z, 2 bricks along Y
    // Total: 3 + 2 + 2 = 7 bricks
    expect(segments.length).toBe(7);

    // Verify X→Z→Y pattern:
    // First 3 bricks: X changes, Z and Y constant
    for (let i = 0; i < 3; i++) {
      expect(segments[i].position[2]).toBe(start.z); // Z constant
      expect(segments[i].position[1]).toBe(0.8); // Y constant at elevated position
    }

    // Next 2 bricks: Z changes, X constant (at cornerX), Y constant
    const cornerX = start.x + 3 * 1.0;
    for (let i = 3; i < 5; i++) {
      expect(segments[i].position[0]).toBe(cornerX); // X constant
      expect(segments[i].position[1]).toBe(0.8); // Y still constant
    }

    // Last 2 bricks: Y changes (vertical), X and Z constant
    const cornerZ = start.z + 2 * 1.0;
    for (let i = 5; i < 7; i++) {
      expect(segments[i].position[0]).toBe(cornerX); // X constant
      expect(segments[i].position[2]).toBe(cornerZ); // Z constant
      expect(segments[i].position[1]).toBeGreaterThan(0.8); // Y increasing
    }
  });

  it('generateLegoPath handles start higher than end', () => {
    const start = { x: 0, y: 2.4, z: 0 };
    const end = { x: 2, y: 0.8, z: 2 };
    const segments = generateLegoPath(start, end, 1.0);

    // Expected: 2 bricks along X, 2 bricks along Z, 2 bricks along Y (stepping down)
    // Total: 2 + 2 + 2 = 6 bricks
    expect(segments.length).toBe(6);

    // Last 2 bricks should have decreasing Y values (stepping down)
    expect(segments[5].position[1]).toBeLessThan(segments[4].position[1]);
  });

  it('generateLegoPath handles start lower than end (step up)', () => {
    const start = { x: 0, y: 0.8, z: 0 };
    const end = { x: 2, y: 1.6, z: 2 };
    const segments = generateLegoPath(start, end, 1.0);

    // Expected: 2 bricks along X, 2 bricks along Z, 1 brick along Y (stepping up)
    // Total: 2 + 2 + 1 = 5 bricks
    expect(segments.length).toBe(5);

    // Last brick should be higher than the horizontal segments
    const lastBrick = segments[segments.length - 1];
    const firstBrick = segments[0];
    expect(lastBrick.position[1]).toBeGreaterThan(firstBrick.position[1]);
  });

  it('generateLegoPath uses correct brick size for Y stepping', () => {
    const start = { x: 0, y: 0.8, z: 0 };
    const end = { x: 0, y: 2.4, z: 0 };
    const brickSize = 0.8;
    const segments = generateLegoPath(start, end, brickSize);

    // Expected: Only vertical movement: (2.4 - 0.8) / 0.8 = 2 bricks
    expect(segments.length).toBe(2);

    // All segments should have same X and Z (no horizontal movement)
    segments.forEach((seg: PathSegment) => {
      expect(seg.position[0]).toBe(start.x);
      expect(seg.position[2]).toBe(start.z);
    });

    // Y values should increment by brickSize
    expect(segments[0].position[1]).toBeCloseTo(0.8 + brickSize / 2);
    expect(segments[1].position[1]).toBeCloseTo(0.8 + 1.5 * brickSize);
  });
});
