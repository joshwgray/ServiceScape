import { create } from 'zustand';
import { Vector3 } from 'three';

interface ScreenPosition {
  x: number;
  y: number;
}

interface BubblePositionState {
  anchorPosition: Vector3 | null;
  screenPosition: ScreenPosition | null;
  isVisible: boolean;
  setAnchor: (position: Vector3) => void;
  clearAnchor: () => void;
  setScreenPosition: (position: ScreenPosition | null) => void;
  setVisibility: (visible: boolean) => void;
}

export const useBubblePositionStore = create<BubblePositionState>((set) => ({
  anchorPosition: null,
  screenPosition: null,
  isVisible: false,
  setAnchor: (position) => set({ anchorPosition: position.clone() }),
  clearAnchor: () =>
    set({ anchorPosition: null, screenPosition: null, isVisible: false }),
  setScreenPosition: (position) => set({ screenPosition: position }),
  setVisibility: (visible) => set({ isVisible: visible }),
}));
