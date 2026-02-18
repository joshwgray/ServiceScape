import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Vector3 } from 'three';
import { useCameraFocus, getTargetPosition } from '../../hooks/useCameraFocus';
import type { LayoutPositions } from '../../services/apiClient';

// Mock @react-three/fiber
vi.mock('@react-three/fiber', () => ({
  useThree: vi.fn(),
  useFrame: vi.fn(),
}));

// Mock selection store
vi.mock('../../stores/selectionStore', () => ({
  useSelectionStore: vi.fn(),
}));

import { useThree, useFrame } from '@react-three/fiber';
import { useSelectionStore } from '../../stores/selectionStore';

describe('Integration: Camera Focus', () => {
  const mockControls = {
    target: new Vector3(0, 0, 0),
    update: vi.fn(),
  };

  let frameCb: ((state: any, delta: number) => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    frameCb = null;
    
    vi.mocked(useThree).mockReturnValue({
      controls: mockControls,
      camera: {} as any,
    } as any);

    // Capture the useFrame callback
    vi.mocked(useFrame).mockImplementation((callback: any) => {
      frameCb = callback;
      return null;
    });
  });

  it('should get target position from layout for selected service', () => {
    const layout: LayoutPositions = {
      domains: { 'domain-1': { x: 10, y: 0, z: 10 } },
      teams: { 'team-1': { x: 15, y: 0, z: 15 } },
      services: { 'service-1': { x: 20, y: 5, z: 25 } },
    };

    const position = getTargetPosition('service-1', layout);
    expect(position).toEqual(new Vector3(20, 5, 25));
  });

  it('should get target position for team when selected', () => {
    const layout: LayoutPositions = {
      domains: {},
      teams: { 'team-1': { x: 15, y: 0, z: 15 } },
      services: {},
    };

    const position = getTargetPosition('team-1', layout);
    expect(position).toEqual(new Vector3(15, 0, 15));
  });

  it('should get target position for domain when selected', () => {
    const layout: LayoutPositions = {
      domains: { 'domain-1': { x: 10, y: 0, z: 10 } },
      teams: {},
      services: {},
    };

    const position = getTargetPosition('domain-1', layout);
    expect(position).toEqual(new Vector3(10, 0, 10));
  });

  it('should return null if entity not found in layout', () => {
    const layout: LayoutPositions = {
      domains: {},
      teams: {},
      services: {},
    };

    const position = getTargetPosition('non-existent', layout);
    expect(position).toBeNull();
  });

  it('should animate camera to selected service position', async () => {
    const layout: LayoutPositions = {
      domains: {},
      teams: {},
      services: { 'service-1': { x: 20, y: 5, z: 25 } },
    };

    // Mock store to return selected service
    vi.mocked(useSelectionStore).mockImplementation((selector: any) => {
      const state = { selectedServiceId: 'service-1' };
      return selector ? selector(state) : state;
    });

    renderHook(() => useCameraFocus(layout));

    // Verify useFrame was called to set up animation
    expect(useFrame).toHaveBeenCalled();
    
    // Simulate frame updates
    if (frameCb) {
      const initialTarget = new Vector3(0, 0, 0);
      mockControls.target = initialTarget.clone();

      // Run 200 frames to ensure lerping completes (lerp alpha is 0.05, so ~200 frames needed)
      for (let i = 0; i < 200; i++) {
        frameCb({} as any, 0.016); // ~60fps
      }

      // Camera target should have reached the service position
      expect(mockControls.target.x).toBeCloseTo(20, 1);
      expect(mockControls.target.y).toBeCloseTo(5, 1);
      expect(mockControls.target.z).toBeCloseTo(25, 1);
      
      // Verify controls.update was called
      expect(mockControls.update).toHaveBeenCalled();
    }
  });

  it('should handle no selection gracefully', () => {
    const layout: LayoutPositions = {
      domains: {},
      teams: {},
      services: { 'service-1': { x: 20, y: 5, z: 25 } },
    };

    // Mock store with no selection
    vi.mocked(useSelectionStore).mockImplementation((selector: any) => {
      const state = { selectedServiceId: null };
      return selector ? selector(state) : state;
    });

    renderHook(() => useCameraFocus(layout));

    expect(useFrame).toHaveBeenCalled();
    
    // Camera should not move when no selection
    if (frameCb) {
      const initialTarget = new Vector3(0, 0, 0);
      mockControls.target = initialTarget.clone();
      const initialX = mockControls.target.x;
      const initialY = mockControls.target.y;
      const initialZ = mockControls.target.z;

      // Run frames
      for (let i = 0; i < 10; i++) {
        frameCb({} as any, 0.016);
      }

      // Camera should remain at initial position
      expect(mockControls.target.x).toBe(initialX);
      expect(mockControls.target.y).toBe(initialY);
      expect(mockControls.target.z).toBe(initialZ);
    }
  });

  it('should update target when selection changes', () => {
    const layout: LayoutPositions = {
      domains: {},
      teams: {},
      services: {
        'service-1': { x: 20, y: 5, z: 25 },
        'service-2': { x: 30, y: 5, z: 35 },
      },
    };

    // Start with service-1 selected
    vi.mocked(useSelectionStore).mockImplementation((selector: any) => {
      const state = { selectedServiceId: 'service-1' };
      return selector ? selector(state) : state;
    });

    const { rerender } = renderHook(() => useCameraFocus(layout));

    // Change selection to service-2
    vi.mocked(useSelectionStore).mockImplementation((selector: any) => {
      const state = { selectedServiceId: 'service-2' };
      return selector ? selector(state) : state;
    });

    rerender();

    // Verify hook was called again
    expect(useSelectionStore).toHaveBeenCalled();
  });

  it('should handle empty layout gracefully', () => {
    const emptyLayout: LayoutPositions = {
      domains: {},
      teams: {},
      services: {},
    };

    vi.mocked(useSelectionStore).mockImplementation((selector: any) => {
      const state = { selectedServiceId: 'service-1' };
      return selector ? selector(state) : state;
    });

    renderHook(() => useCameraFocus(emptyLayout));

    // Should not crash with empty layout
    expect(useFrame).toHaveBeenCalled();
    
    // getTargetPosition should return null for missing entity
    const position = getTargetPosition('service-1', emptyLayout);
    expect(position).toBeNull();
  });

  it('should handle null layout', () => {
    vi.mocked(useSelectionStore).mockImplementation((selector: any) => {
      const state = { selectedServiceId: 'service-1' };
      return selector ? selector(state) : state;
    });

    renderHook(() => useCameraFocus(null));

    // Should not crash with null layout
    expect(useFrame).toHaveBeenCalled();
  });

  it('should handle partial layout data', () => {
    const partialLayout: LayoutPositions = {
      domains: { 'domain-1': { x: 10, y: 0, z: 10 } },
      teams: {},
      services: {}, // Services missing
    };

    vi.mocked(useSelectionStore).mockImplementation((selector: any) => {
      const state = { selectedServiceId: 'service-1' };
      return selector ? selector(state) : state;
    });

    renderHook(() => useCameraFocus(partialLayout));

    // Should not crash even if selected entity not in layout
    expect(useFrame).toHaveBeenCalled();
    
    const position = getTargetPosition('service-1', partialLayout);
    expect(position).toBeNull();
  });

  it('should handle entity in layout but selected entity is different type', () => {
    const layout: LayoutPositions = {
      domains: {},
      teams: { 'team-1': { x: 15, y: 0, z: 15 } },
      services: {},
    };

    // Try to get position for team (should work)
    const teamPosition = getTargetPosition('team-1', layout);
    expect(teamPosition).toEqual(new Vector3(15, 0, 15));

    // Try to get position for non-existent service
    const servicePosition = getTargetPosition('service-1', layout);
    expect(servicePosition).toBeNull();
  });
});
