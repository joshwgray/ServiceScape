import { useState, useEffect } from 'react';

/** Delay between each brick reveal in milliseconds */
const BRICK_DELAY_MS = 20;

export interface PathAnimationResult {
  /** How many bricks are currently visible */
  visibleBricks: number;
  /** True once all bricks have been revealed */
  isComplete: boolean;
}

/**
 * Manages a brick-by-brick reveal animation for a LEGO dependency path.
 *
 * Starting from 0, it increments `visibleBricks` by 1 every `BRICK_DELAY_MS`
 * milliseconds until all `totalBricks` are revealed.
 *
 * @param totalBricks Total number of bricks in the path
 * @param pathVersion Opaque string derived from start/end coordinates. When it
 *   changes the animation resets even if `totalBricks` stays the same (e.g. when
 *   the path is re-routed between two different pairs of buildings with the same
 *   number of segments).
 * @returns { visibleBricks, isComplete }
 */
export function usePathAnimation(totalBricks: number, pathVersion?: string): PathAnimationResult {
  const [visibleBricks, setVisibleBricks] = useState(0);

  useEffect(() => {
    // Reset whenever the path length OR path signature changes so the new path
    // always animates from 0.
    setVisibleBricks(0);

    // Nothing to animate
    if (totalBricks === 0) return;

    let current = 0;

    const interval = setInterval(() => {
      current += 1;
      setVisibleBricks(current);

      if (current >= totalBricks) {
        clearInterval(interval);
      }
    }, BRICK_DELAY_MS);

    return () => {
      clearInterval(interval);
    };
  }, [totalBricks, pathVersion]);

  return {
    visibleBricks,
    isComplete: totalBricks === 0 || visibleBricks >= totalBricks,
  };
}
