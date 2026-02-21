import { describe, it, expect, beforeEach } from 'vitest';
import { Vector3 } from 'three';
import { useBubblePositionStore } from '../bubblePositionStore.ts';

describe('bubblePositionStore', () => {
  beforeEach(() => {
    useBubblePositionStore.getState().clearAnchor();
  });

  it('should initialize with null anchorPosition, null screenPosition, and isVisible false', () => {
    const state = useBubblePositionStore.getState();
    expect(state.anchorPosition).toBeNull();
    expect(state.screenPosition).toBeNull();
    expect(state.isVisible).toBe(false);
  });

  it('should set anchor position', () => {
    const { setAnchor } = useBubblePositionStore.getState();
    const position = new Vector3(1, 2, 3);
    setAnchor(position);
    const state = useBubblePositionStore.getState();
    expect(state.anchorPosition).toBeDefined();
    expect(state.anchorPosition?.x).toBe(1);
    expect(state.anchorPosition?.y).toBe(2);
    expect(state.anchorPosition?.z).toBe(3);
  });

  it('should clear anchor position and reset derived state', () => {
    const { setAnchor, clearAnchor } = useBubblePositionStore.getState();
    setAnchor(new Vector3(5, 10, 15));
    clearAnchor();
    const state = useBubblePositionStore.getState();
    expect(state.anchorPosition).toBeNull();
    expect(state.screenPosition).toBeNull();
    expect(state.isVisible).toBe(false);
  });

  it('should set screen position', () => {
    const { setScreenPosition } = useBubblePositionStore.getState();
    setScreenPosition({ x: 100, y: 200 });
    const state = useBubblePositionStore.getState();
    expect(state.screenPosition).toEqual({ x: 100, y: 200 });
  });

  it('should update screen position when called multiple times', () => {
    const { setScreenPosition } = useBubblePositionStore.getState();
    setScreenPosition({ x: 100, y: 200 });
    setScreenPosition({ x: 350, y: 480 });
    const state = useBubblePositionStore.getState();
    expect(state.screenPosition).toEqual({ x: 350, y: 480 });
  });

  it('should set screen position to null', () => {
    const { setScreenPosition } = useBubblePositionStore.getState();
    setScreenPosition({ x: 100, y: 200 });
    setScreenPosition(null);
    const state = useBubblePositionStore.getState();
    expect(state.screenPosition).toBeNull();
  });

  it('should set visibility to true', () => {
    const { setVisibility } = useBubblePositionStore.getState();
    setVisibility(true);
    expect(useBubblePositionStore.getState().isVisible).toBe(true);
  });

  it('should set visibility to false', () => {
    const { setVisibility } = useBubblePositionStore.getState();
    setVisibility(true);
    setVisibility(false);
    expect(useBubblePositionStore.getState().isVisible).toBe(false);
  });

  it('clearAnchor should reset visibility to false', () => {
    const { setAnchor, setVisibility, clearAnchor } = useBubblePositionStore.getState();
    setAnchor(new Vector3(1, 1, 1));
    setVisibility(true);
    clearAnchor();
    expect(useBubblePositionStore.getState().isVisible).toBe(false);
  });

  it('setAnchor should clone the vector so mutating the original does not affect the store', () => {
    const { setAnchor } = useBubblePositionStore.getState();
    const original = new Vector3(1, 2, 3);
    setAnchor(original);

    // Mutate the original vector after storing it
    original.set(99, 99, 99);

    const stored = useBubblePositionStore.getState().anchorPosition;
    expect(stored?.x).toBe(1);
    expect(stored?.y).toBe(2);
    expect(stored?.z).toBe(3);
  });
});
