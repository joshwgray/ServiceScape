export type TreeVariant = 'small' | 'medium' | 'large';
export type FoliageType = 'cone' | 'rounded';

export interface TreeDimensions {
  trunkHeight: number;
  trunkWidth: number; // width/depth of trunk base
  foliageHeight: number; // For cone
  foliageRadius: number; // base radius for cone, radius for sphere
}

export const TREE_DIMENSIONS: Record<TreeVariant, TreeDimensions> = {
  small: {
    trunkHeight: 1.2, // ~4 bricks high (0.3 * 4)
    trunkWidth: 0.6,
    foliageHeight: 1.5,
    foliageRadius: 0.8
  },
  medium: {
    trunkHeight: 1.8, // ~6 bricks
    trunkWidth: 0.8,
    foliageHeight: 2.5,
    foliageRadius: 1.2
  },
  large: {
    trunkHeight: 2.4, // ~8 bricks
    trunkWidth: 1.0,
    foliageHeight: 3.5,
    foliageRadius: 1.6
  }
};

/**
 * Simple deterministic hash from string to integer
 */
function getHash(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function getTreeVariant(seed: string): TreeVariant {
  const hash = getHash(seed);
  const variants: TreeVariant[] = ['small', 'medium', 'large'];
  return variants[hash % variants.length];
}

export function getFoliageType(seed: string): FoliageType {
  // Salt the seed differently to decouple from variant
  const hash = getHash(seed + '_foliage');
  return hash % 2 === 0 ? 'cone' : 'rounded';
}
