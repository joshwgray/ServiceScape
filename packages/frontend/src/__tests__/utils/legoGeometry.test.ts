import { describe, it, expect } from 'vitest';
import {
  LEGO_STUD_RADIUS,
  LEGO_STUD_HEIGHT,
  LEGO_STUD_SPACING,
  getStudVariant,
  getStudPositions,
  type StudVariant,
} from '../../utils/legoGeometry';

describe('legoGeometry constants', () => {
  it('exports LEGO_STUD_RADIUS of 0.24', () => {
    expect(LEGO_STUD_RADIUS).toBe(0.24);
  });

  it('exports LEGO_STUD_HEIGHT of 0.18', () => {
    expect(LEGO_STUD_HEIGHT).toBe(0.18);
  });

  it('exports LEGO_STUD_SPACING of 0.6', () => {
    expect(LEGO_STUD_SPACING).toBe(0.6);
  });
});

describe('getStudVariant', () => {
  const validVariants: StudVariant[] = ['2x2', '3x2', '4x2'];

  it('returns a valid variant for any string', () => {
    const ids = ['abc', '123', 'service-alpha', '', 'test-id-999'];
    for (const id of ids) {
      const variant = getStudVariant(id);
      expect(validVariants).toContain(variant);
    }
  });

  it('is deterministic — same ID always returns the same variant', () => {
    const id = 'service-42';
    const first = getStudVariant(id);
    const second = getStudVariant(id);
    const third = getStudVariant(id);
    expect(first).toBe(second);
    expect(second).toBe(third);
  });

  it('returns different variants for IDs with different hashes', () => {
    // We expect at least 2 different variants across a spread of IDs
    const results = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'].map(getStudVariant));
    expect(results.size).toBeGreaterThan(1);
  });

  it('correctly returns 2x2 for an ID where charCodeSum % 3 === 0', () => {
    // Find an ID whose charCode sum % 3 === 0
    // charCode of 'a' = 97, 97 % 3 = 1; 'b'=98, 98%3=2; 'c'=99, 99%3=0
    expect(getStudVariant('c')).toBe('2x2');
  });

  it('correctly returns 3x2 for an ID where charCodeSum % 3 === 1', () => {
    // 'a' = 97, 97 % 3 = 1
    expect(getStudVariant('a')).toBe('3x2');
  });

  it('correctly returns 4x2 for an ID where charCodeSum % 3 === 2', () => {
    // 'b' = 98, 98 % 3 = 2
    expect(getStudVariant('b')).toBe('4x2');
  });
});

describe('getStudPositions', () => {
  it('returns 4 positions for 2x2 variant', () => {
    const positions = getStudPositions('2x2', 1.8, 1.8);
    expect(positions).toHaveLength(4);
  });

  it('returns 6 positions for 3x2 variant', () => {
    const positions = getStudPositions('3x2', 1.8, 1.8);
    expect(positions).toHaveLength(6);
  });

  it('returns 8 positions for 4x2 variant', () => {
    const positions = getStudPositions('4x2', 1.8, 1.8);
    expect(positions).toHaveLength(8);
  });

  it('all positions have y === 0', () => {
    for (const variant of ['2x2', '3x2', '4x2'] as StudVariant[]) {
      const positions = getStudPositions(variant, 1.8, 1.8);
      for (const [, y] of positions) {
        expect(y).toBe(0);
      }
    }
  });

  it('each position is a tuple of 3 numbers', () => {
    const positions = getStudPositions('2x2', 1.8, 1.8);
    for (const pos of positions) {
      expect(pos).toHaveLength(3);
      expect(typeof pos[0]).toBe('number');
      expect(typeof pos[1]).toBe('number');
      expect(typeof pos[2]).toBe('number');
    }
  });

  it('positions are centered on the brick (x and z approximately centered)', () => {
    const positions = getStudPositions('2x2', 1.8, 1.8);
    const sumX = positions.reduce((s, [x]) => s + x, 0);
    const sumZ = positions.reduce((s, [, , z]) => s + z, 0);
    expect(sumX).toBeCloseTo(0);
    expect(sumZ).toBeCloseTo(0);
  });
});
