import { describe, it, expect, vi, afterEach } from 'vitest';
import { Vector3, Camera } from 'three';
import {
  projectToScreen,
  isNdcZClipped,
  clampToViewport,
} from '../projection.ts';

// Stub Three.js Vector3.prototype.project so tests don't depend on real
// camera matrices. The stub sets the vector to the requested NDC values.
function stubVectorProject(ndcResult: { x: number; y: number; z: number }) {
  return vi
    .spyOn(Vector3.prototype, 'project')
    .mockImplementation(function (this: Vector3) {
      this.set(ndcResult.x, ndcResult.y, ndcResult.z);
      return this;
    });
}

// A minimal camera stub — the actual matrices are never read because
// Vector3.prototype.project is mocked above.
const dummyCamera = {} as Camera;

describe('projection utility', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('projectToScreen', () => {
    it('should convert NDC coordinates to pixel screen coordinates', () => {
      // NDC (0,0) → centre of a 800×600 viewport
      stubVectorProject({ x: 0, y: 0, z: 0.5 });
      const worldPos = new Vector3(0, 0, 0);
      const result = projectToScreen(worldPos, dummyCamera, 800, 600);

      expect(result.x).toBe(400);
      expect(result.y).toBe(300);
      expect(result.visible).toBe(true);
    });

    it('should map NDC (-1,-1) to top-left corner of the viewport', () => {
      // NDC x = -1 → x = 0 (left edge)
      // NDC y = +1 → y = 0 (top edge) because Y is flipped
      stubVectorProject({ x: -1, y: 1, z: 0.5 });
      const worldPos = new Vector3(-10, 10, 0);
      const result = projectToScreen(worldPos, dummyCamera, 800, 600);

      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
      expect(result.visible).toBe(true);
    });

    it('should map NDC (1,1) to bottom-right corner of the viewport', () => {
      // NDC x = +1 → x = width (right edge)
      // NDC y = -1 → y = height (bottom edge) because Y is flipped
      stubVectorProject({ x: 1, y: -1, z: 0.5 });
      const worldPos = new Vector3(10, -10, 0);
      const result = projectToScreen(worldPos, dummyCamera, 800, 600);

      expect(result.x).toBe(800);
      expect(result.y).toBe(600);
      expect(result.visible).toBe(true);
    });

    it('should mark result as not visible when point is behind the camera (NDC z > 1)', () => {
      stubVectorProject({ x: 0, y: 0, z: 1.5 });
      const worldPos = new Vector3(0, 0, 10);
      const result = projectToScreen(worldPos, dummyCamera, 800, 600);

      expect(result.visible).toBe(false);
    });

    it('should mark result as not visible when NDC z < -1 (before near plane)', () => {
      stubVectorProject({ x: 0, y: 0, z: -1.5 });
      const worldPos = new Vector3(0, 0, -100);
      const result = projectToScreen(worldPos, dummyCamera, 800, 600);

      expect(result.visible).toBe(false);
    });

    it('should return a ProjectionResult with x, y, and visible properties', () => {
      stubVectorProject({ x: 0.5, y: -0.5, z: 0.5 });
      const worldPos = new Vector3(5, -5, 0);
      const result = projectToScreen(worldPos, dummyCamera, 1024, 768);

      expect(result).toHaveProperty('x');
      expect(result).toHaveProperty('y');
      expect(result).toHaveProperty('visible');
    });

    it('should not mutate the input worldPosition vector', () => {
      stubVectorProject({ x: 0.2, y: 0.3, z: 0.5 });
      const worldPos = new Vector3(7, 8, 9);
      const originalX = worldPos.x;
      const originalY = worldPos.y;
      const originalZ = worldPos.z;

      projectToScreen(worldPos, dummyCamera, 800, 600);

      expect(worldPos.x).toBe(originalX);
      expect(worldPos.y).toBe(originalY);
      expect(worldPos.z).toBe(originalZ);
    });
  });

  describe('isNdcZClipped', () => {
    it('should return true when NDC z > 1 (beyond far plane)', () => {
      expect(isNdcZClipped(1.001)).toBe(true);
    });

    it('should return true when NDC z < -1 (before near plane)', () => {
      expect(isNdcZClipped(-1.001)).toBe(true);
    });

    it('should return false when NDC z is within [-1, 1]', () => {
      expect(isNdcZClipped(0)).toBe(false);
      expect(isNdcZClipped(0.999)).toBe(false);
      expect(isNdcZClipped(-0.999)).toBe(false);
      expect(isNdcZClipped(1)).toBe(false);
      expect(isNdcZClipped(-1)).toBe(false);
    });
  });

  describe('clampToViewport', () => {
    it('should not alter coordinates already inside the viewport', () => {
      const margin = 10;
      const result = clampToViewport({ x: 400, y: 300 }, 800, 600, margin);
      expect(result.x).toBe(400);
      expect(result.y).toBe(300);
    });

    it('should clamp x to the left margin', () => {
      const result = clampToViewport({ x: -50, y: 300 }, 800, 600, 10);
      expect(result.x).toBe(10);
    });

    it('should clamp x to the right margin', () => {
      const result = clampToViewport({ x: 850, y: 300 }, 800, 600, 10);
      expect(result.x).toBe(790);
    });

    it('should clamp y to the top margin', () => {
      const result = clampToViewport({ x: 400, y: -20 }, 800, 600, 10);
      expect(result.y).toBe(10);
    });

    it('should clamp y to the bottom margin', () => {
      const result = clampToViewport({ x: 400, y: 700 }, 800, 600, 10);
      expect(result.y).toBe(590);
    });

    it('should use a default margin of 0 when not provided', () => {
      const result = clampToViewport({ x: -5, y: 650 }, 800, 600);
      expect(result.x).toBe(0);
      expect(result.y).toBe(600);
    });
  });
});
