
import { describe, it, expect } from 'vitest';
import { calculateFloorY } from '../floorLayout';

describe('calculateFloorY', () => {
  it('should calculate Y position for ground floor (index 0)', () => {
    // floorHeight = 1, spacing = 0.5
    // expected Y = 0 (base) + (0 * (1 + 0.5)) + 1/2 = 0.5 (center of the box)
    // Actually typically boxes are centered.
    // Let's assume the base of the building starts at Y=0.
    // If the floor has height H, its center is at Y = baseY + (index * (H + spacing)) + H/2
    const y = calculateFloorY(0, 1, 0.5, 0);
    expect(y).toBe(0.5);
  });

  it('should calculate Y position for first floor (index 1)', () => {
    // Y = 0 + (1 * (1 + 0.5)) + 0.5 = 1.5 + 0.5 = 2.0
    const y = calculateFloorY(1, 1, 0.5, 0);
    expect(y).toBe(2.0);
  });

  it('should handle different base Y', () => {
    // Base Y = 10
    // Index 0: 10 + 0 + 0.5 = 10.5
    const y = calculateFloorY(0, 1, 0.5, 10);
    expect(y).toBe(10.5);
  });
});
