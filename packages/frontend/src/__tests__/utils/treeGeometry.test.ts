import { describe, it, expect } from 'vitest';
import { getTreeVariant, getFoliageType } from '../../utils/treeGeometry.ts';

describe('treeGeometry', () => {
  describe('getTreeVariant', () => {
    it('returns a valid variant for various seeds', () => {
      const variants = ['small', 'medium', 'large'];
      const seeds = ['seed1', 'seed2', 'seed3', 'test-seed-A'];
      
      seeds.forEach(seed => {
        const variant = getTreeVariant(seed);
        expect(variants).toContain(variant);
      });
    });

    it('returns consistent result for same seed', () => {
      const seed = 'deterministic-seed';
      const result1 = getTreeVariant(seed);
      const result2 = getTreeVariant(seed);
      expect(result1).toBe(result2);
    });

    it('produces variety of variants across unlikely collisions', () => {
        // Check more seeds to ensure variety
        const seeds = ['seed-a', 'seed-b', 'seed-c', 'seed-d', 'seed-e', 'seed-f', 'seed-g', 'seed-h', 'seed-i', 'seed-j'];
        const unique = new Set(seeds.map(s => getTreeVariant(s)));
        expect(unique.size).toBeGreaterThan(1);
    });
  });

  describe('getFoliageType', () => {
    it('returns a valid foliage type for various seeds', () => {
      const types = ['cone', 'rounded'];
      const seeds = ['seed1', 'seed2', 'seed3'];
      
      seeds.forEach(seed => {
        const type = getFoliageType(seed);
        expect(types).toContain(type);
      });
    });

    it('returns deterministic result for same seed', () => {
      const seed = 'foliage-seed';
      const result1 = getFoliageType(seed);
      const result2 = getFoliageType(seed);
      expect(result1).toBe(result2);
    });
    
    it('distributes types reasonably', () => {
        const results = new Set();
        for (let i = 0; i < 20; i++) {
          results.add(getFoliageType(`seed-${i}`));
        }
        expect(results.size).toBeGreaterThan(1);
      });
  });
});
