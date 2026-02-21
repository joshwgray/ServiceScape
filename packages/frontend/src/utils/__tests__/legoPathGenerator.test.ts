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
    const start = { x: 0, y: 0.5, z: 0 };
    const end = { x: 10, y: 0.5, z: 10 };
    const brickSize = 1.0;
    const segments = generateLegoPath(start, end, brickSize);

    // All segments should be at the same Y (flat path)
    segments.forEach((seg: PathSegment) => {
      expect(seg.position[1]).toBe(0.5);
    });

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
});
