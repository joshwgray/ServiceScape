import { describe, it, expect } from 'vitest';
import {
  LEGO_BRICK_COLORS,
  LEGO_PLATE_COLORS,
  getLegoColor,
  getLegoPlateColor,
} from '../../utils/legoColors';

describe('LEGO_BRICK_COLORS', () => {
  it('is a non-empty array of hex strings', () => {
    expect(LEGO_BRICK_COLORS.length).toBeGreaterThan(0);
    for (const color of LEGO_BRICK_COLORS) {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe('LEGO_PLATE_COLORS', () => {
  it('is a non-empty array of hex strings', () => {
    expect(LEGO_PLATE_COLORS.length).toBeGreaterThan(0);
    for (const color of LEGO_PLATE_COLORS) {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe('getLegoColor', () => {
  it('returns a string starting with #', () => {
    expect(getLegoColor('my-service')).toMatch(/^#/);
  });

  it('is deterministic — same ID returns same color on multiple calls', () => {
    const id = 'service-alpha';
    const first = getLegoColor(id);
    const second = getLegoColor(id);
    const third = getLegoColor(id);
    expect(first).toBe(second);
    expect(second).toBe(third);
  });

  it('returns only colors from LEGO_BRICK_COLORS palette', () => {
    const ids = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa'];
    for (const id of ids) {
      expect(LEGO_BRICK_COLORS).toContain(getLegoColor(id));
    }
  });

  it('returns different colors for IDs with different hashes', () => {
    const ids = ['service-1', 'service-2', 'service-3', 'team-alpha', 'team-beta'];
    const results = new Set(ids.map(getLegoColor));
    expect(results.size).toBeGreaterThan(1);
  });

  it('hash distribution sanity: 100 different IDs do not all return the same color', () => {
    const results = new Set(
      Array.from({ length: 100 }, (_, i) => getLegoColor(`service-${i}`))
    );
    expect(results.size).toBeGreaterThan(1);
  });
});

describe('getLegoPlateColor', () => {
  it('is deterministic — same ID returns same color on multiple calls', () => {
    const id = 'domain-core';
    const first = getLegoPlateColor(id);
    const second = getLegoPlateColor(id);
    expect(first).toBe(second);
  });

  it('returns only colors from LEGO_PLATE_COLORS palette', () => {
    const ids = ['domain-a', 'domain-b', 'domain-c', 'domain-d', 'domain-e'];
    for (const id of ids) {
      expect(LEGO_PLATE_COLORS).toContain(getLegoPlateColor(id));
    }
  });

  it('returns different colors for different IDs', () => {
    const ids = ['domain-1', 'domain-2', 'domain-3', 'team-x', 'team-y'];
    const results = new Set(ids.map(getLegoPlateColor));
    expect(results.size).toBeGreaterThan(1);
  });
});
