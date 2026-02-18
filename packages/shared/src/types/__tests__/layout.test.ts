import { describe, it, expect } from 'vitest';
import type { Position3D, BoundingBox, LayoutItem } from '../layout';

describe('Layout Types', () => {
  describe('Position3D', () => {
    it('should have x, y, z coordinates', () => {
      const position: Position3D = {
        x: 10,
        y: 20,
        z: 30,
      };

      expect(position.x).toBe(10);
      expect(position.y).toBe(20);
      expect(position.z).toBe(30);
    });

    it('should support zero coordinates', () => {
      const position: Position3D = {
        x: 0,
        y: 0,
        z: 0,
      };

      expect(position.x).toBe(0);
      expect(position.y).toBe(0);
      expect(position.z).toBe(0);
    });

    it('should support negative coordinates', () => {
      const position: Position3D = {
        x: -10,
        y: -20,
        z: -30,
      };

      expect(position.x).toBe(-10);
      expect(position.y).toBe(-20);
      expect(position.z).toBe(-30);
    });
  });

  describe('BoundingBox', () => {
    it('should extend Position3D with dimensions', () => {
      const box: BoundingBox = {
        x: 0,
        y: 0,
        z: 0,
        width: 100,
        height: 50,
        depth: 75,
      };

      expect(box.x).toBe(0);
      expect(box.y).toBe(0);
      expect(box.z).toBe(0);
      expect(box.width).toBe(100);
      expect(box.height).toBe(50);
      expect(box.depth).toBe(75);
    });
  });

  describe('LayoutItem', () => {
    it('should have required id and name', () => {
      const item: LayoutItem = {
        id: 'item-1',
        name: 'Item 1',
      };

      expect(item.id).toBe('item-1');
      expect(item.name).toBe('Item 1');
    });

    it('should support optional size and tier', () => {
      const item: LayoutItem = {
        id: 'item-1',
        name: 'Item 1',
        size: 50,
        tier: 'T1',
      };

      expect(item.size).toBe(50);
      expect(item.tier).toBe('T1');
    });
  });
});
