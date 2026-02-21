/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnimatedOpacity } from '../useAnimatedOpacity';

// Module-level store for captured frame callback (object reference survives vi.mock hoisting)
const frameStore: { callback: ((state: any, delta: number) => void) | null } = { callback: null };

vi.mock('@react-three/fiber', () => ({
  useFrame: (callback: (state: any, delta: number) => void) => {
    frameStore.callback = callback;
  },
}));

/** Helper: simulate one animation frame and flush React state updates */
async function simulateFrame(delta = 0.016): Promise<void> {
  await act(async () => {
    frameStore.callback?.({}, delta);
  });
}

describe('useAnimatedOpacity', () => {
  beforeEach(() => {
    frameStore.callback = null;
  });

  it('should return initial opacity when target matches', () => {
    const { result } = renderHook(() => useAnimatedOpacity(1.0));
    expect(result.current).toBe(1.0);
  });

  it('should smoothly lerp from current to target opacity', async () => {
    const { result, rerender } = renderHook(
      ({ target }) => useAnimatedOpacity(target),
      { initialProps: { target: 1.0 } }
    );

    // Initial should be 1.0
    expect(result.current).toBe(1.0);

    // Change target to 0.15
    rerender({ target: 0.15 });

    // Simulate a couple of frames
    await simulateFrame(0.016);
    await simulateFrame(0.016);

    // Opacity should be moving toward target but not yet arrived
    expect(result.current).toBeLessThan(1.0);
    expect(result.current).toBeGreaterThan(0.15);
  });

  it('should complete transition in approximately 200ms (12 frames at 60fps)', async () => {
    const { result, rerender } = renderHook(
      ({ target }) => useAnimatedOpacity(target),
      { initialProps: { target: 1.0 } }
    );

    // Change target to 0.15
    rerender({ target: 0.15 });

    // Simulate 200ms of animation at 60fps (~12 frames)
    for (let i = 0; i < 12; i++) {
      await simulateFrame(0.016);
    }

    // After ~200ms, should be at least 90% of the way to the target.
    // With lerpFactor = delta * 14, after 12 frames at 60fps:
    //   remaining = (1 - 0.016*14)^12 = 0.776^12 ≈ 0.057  → ~94% done
    // So opacity should be <= 0.15 + 0.10 * (1.0 - 0.15) = 0.235
    expect(result.current).toBeLessThanOrEqual(0.235);
    expect(result.current).toBeGreaterThanOrEqual(0.15);
  });

  it('should handle rapid target changes without crashing', async () => {
    const { result, rerender } = renderHook(
      ({ target }) => useAnimatedOpacity(target),
      { initialProps: { target: 1.0 } }
    );

    // Rapidly change targets
    rerender({ target: 0.15 });
    rerender({ target: 0.5 });
    rerender({ target: 1.0 });

    await simulateFrame(0.016);

    // Should not crash and should return a valid opacity value
    expect(result.current).toBeGreaterThanOrEqual(0);
    expect(result.current).toBeLessThanOrEqual(1);
  });

  it('should clamp opacity between 0 and 1 for out-of-range inputs', async () => {
    const { result } = renderHook(() => useAnimatedOpacity(1.5));

    await simulateFrame(0.016);

    expect(result.current).toBeGreaterThanOrEqual(0);
    expect(result.current).toBeLessThanOrEqual(1);
  });

  it('should stop animating once target is reached within epsilon', async () => {
    const { result, rerender } = renderHook(
      ({ target }) => useAnimatedOpacity(target),
      { initialProps: { target: 1.0 } }
    );

    // Animate many frames to fully converge
    rerender({ target: 0.15 });
    for (let i = 0; i < 60; i++) {
      await simulateFrame(0.016);
    }

    // After convergence opacity should equal target exactly
    expect(result.current).toBeCloseTo(0.15, 2);
  });
});
