import { describe, it, expect } from 'vitest';
import { calculateDoorPosition, SERVICE_WIDTH } from '../servicePositionCalculator';

describe('servicePositionCalculator', () => {
  describe('calculateDoorPosition', () => {
    it('returns the center position when no target is provided', () => {
      const center: [number, number, number] = [10, 0, 10];
      const result = calculateDoorPosition(center);
      
      expect(result).toEqual(center);
    });

    it('calculates door position offset toward target service', () => {
      const center: [number, number, number] = [0, 0, 0];
      const target: [number, number, number] = [10, 0, 0];
      
      // Should be shifted towards positive X
      const result = calculateDoorPosition(center, target);
      
      expect(result[0]).toBeGreaterThan(center[0]);
      expect(result[1]).toBe(center[1]); // Y should stay same (usually)
      expect(result[2]).toBe(center[2]); // Z stays same as target is pure X move
      
      // Door placement should land on the service boundary facing the target.
      expect(result[0]).toBeCloseTo(SERVICE_WIDTH / 2, 1);
    });

    it('calculates door position correctly for diagonal targets', () => {
        const center: [number, number, number] = [0, 0, 0];
        const target: [number, number, number] = [10, 0, 10]; // 45 degrees
        
        const result = calculateDoorPosition(center, target);
        
        // Should be positive X and positive Z
        expect(result[0]).toBeGreaterThan(0);
        expect(result[2]).toBeGreaterThan(0);
        
        // Should be equal offsets for 45 degrees
        expect(result[0]).toBeCloseTo(result[2]);
    });

    it('handles vertical differences if needed (optional based on requirements)', () => {
        // If the service logic ignores Y for door placement on the floor plan
        const center: [number, number, number] = [0, 0, 0];
        const target: [number, number, number] = [10, 5, 0];
        
        const result = calculateDoorPosition(center, target);
        
        // X should offset
        expect(result[0]).toBeGreaterThan(0);
        // Y might or might not change depending on implementation. 
        // Usually doors are at the service's Y level.
        expect(result[1]).toBe(0);
    });
  });
});
