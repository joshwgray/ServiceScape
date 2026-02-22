import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePathAnimation } from '../usePathAnimation';

describe('usePathAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start with 0 visible bricks', () => {
    const { result } = renderHook(() => usePathAnimation(10));
    expect(result.current.visibleBricks).toBe(0);
  });

  it('should reveal bricks sequentially with delay', () => {
    const { result } = renderHook(() => usePathAnimation(10));

    expect(result.current.visibleBricks).toBe(0);

    // Advance 20ms — should reveal 1 brick
    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(result.current.visibleBricks).toBe(1);

    // Advance another 20ms — should reveal 2 bricks
    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(result.current.visibleBricks).toBe(2);

    // Advance another 20ms — should reveal 3 bricks
    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(result.current.visibleBricks).toBe(3);
  });

  it('should complete full path reveal', () => {
    const totalBricks = 5;
    const { result } = renderHook(() => usePathAnimation(totalBricks));

    // Advance enough time for all bricks
    act(() => {
      vi.advanceTimersByTime(20 * totalBricks + 50);
    });

    expect(result.current.visibleBricks).toBe(totalBricks);
  });

  it('should not exceed total bricks count', () => {
    const totalBricks = 3;
    const { result } = renderHook(() => usePathAnimation(totalBricks));

    // Advance way more time than needed
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(result.current.visibleBricks).toBe(totalBricks);
  });

  it('should return isComplete false initially', () => {
    const { result } = renderHook(() => usePathAnimation(5));
    expect(result.current.isComplete).toBe(false);
  });

  it('should return isComplete true when all bricks are visible', () => {
    const totalBricks = 3;
    const { result } = renderHook(() => usePathAnimation(totalBricks));

    expect(result.current.isComplete).toBe(false);

    act(() => {
      vi.advanceTimersByTime(20 * totalBricks + 50);
    });

    expect(result.current.isComplete).toBe(true);
  });

  it('should handle 0 total bricks gracefully', () => {
    const { result } = renderHook(() => usePathAnimation(0));
    expect(result.current.visibleBricks).toBe(0);
    expect(result.current.isComplete).toBe(true);
  });

  it('should clean up timer on unmount to prevent memory leaks', () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    const { unmount } = renderHook(() => usePathAnimation(10));
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  it('should reset visibleBricks to 0 when totalBricks changes mid-animation', () => {
    let totalBricks = 10;
    const { result, rerender } = renderHook(() => usePathAnimation(totalBricks));

    // Advance partway through the animation (5 bricks visible)
    act(() => {
      vi.advanceTimersByTime(20 * 5);
    });
    expect(result.current.visibleBricks).toBe(5);

    // Change totalBricks while animation is in progress
    totalBricks = 20;
    act(() => {
      rerender();
    });

    // visibleBricks must reset to 0 so the new path animates from the start
    expect(result.current.visibleBricks).toBe(0);
  });

  it('should reset animation when pathVersion changes even if totalBricks stays the same', () => {
    let pathVersion = 'v1';
    const totalBricks = 10;
    const { result, rerender } = renderHook(() =>
      usePathAnimation(totalBricks, pathVersion)
    );

    // Advance partway (5 bricks visible)
    act(() => {
      vi.advanceTimersByTime(20 * 5);
    });
    expect(result.current.visibleBricks).toBe(5);

    // Change pathVersion (same totalBricks — different start/end coords)
    pathVersion = 'v2';
    act(() => {
      rerender();
    });

    // Must reset to 0 so the re-routed path animates from scratch
    expect(result.current.visibleBricks).toBe(0);
  });
});
