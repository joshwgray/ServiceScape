/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInteraction } from '../useInteraction';
import { useSelectionStore } from '../../stores/selectionStore';
import { useBubblePositionStore } from '../../stores/bubblePositionStore';
import { useOrganization } from '../../contexts/OrganizationContext';
import type { ThreeEvent } from '@react-three/fiber';

// Create a proper mock ThreeEvent type
type MockThreeEvent<T extends Event> = Partial<ThreeEvent<T>> & {
  stopPropagation: () => void;
};

// Mock dependencies
vi.mock('../../stores/selectionStore', () => ({
  useSelectionStore: vi.fn(),
}));
vi.mock('../../stores/bubblePositionStore', () => ({
  useBubblePositionStore: vi.fn(),
}));
vi.mock('../../contexts/OrganizationContext', () => ({
  useOrganization: vi.fn(),
}));

describe('useInteraction', () => {
  const mockSelectService = vi.fn();
  const mockClearSelection = vi.fn();
  const mockSetAnchor = vi.fn();
  const mockClearAnchor = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock the selection store hook implementation
    (useSelectionStore as any).mockImplementation((selector: any) => {
      const state = {
        selectService: mockSelectService,
        clearSelection: mockClearSelection,
      };
      return selector ? selector(state) : state;
    });

    // Mock the bubble store hook implementation
    (useBubblePositionStore as any).mockImplementation((selector: any) => {
      const state = {
        setAnchor: mockSetAnchor,
        clearAnchor: mockClearAnchor,
      };
      return selector ? selector(state) : state;
    });

    // Mock Organization Context
    (useOrganization as any).mockReturnValue({
        layout: {
            services: {
                'service-123': { x: 10, y: 5, z: 20 },
                'service-positioned': { x: 20, y: 5, z: 25 }
            },
            teams: {
                'team-1': { x: 30, y: 10, z: 30 }
            },
            domains: {}
        }
    });
  });

  it('returns event handlers', () => {
    const { result } = renderHook(() => useInteraction());
    expect(result.current.handleClick).toBeDefined();
    expect(result.current.handlePointerOver).toBeDefined();
    expect(result.current.handlePointerOut).toBeDefined();
  });

  it('handleClick calls selectService with correct ID', () => {
    const { result } = renderHook(() => useInteraction());
    const event: MockThreeEvent<MouseEvent> = { 
      stopPropagation: vi.fn(), 
      point: { x: 0, y: 0, z: 0 } as any 
    };
    
    act(() => {
      result.current.handleClick('service-123')(event as ThreeEvent<MouseEvent>);
    });

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(mockSelectService).toHaveBeenCalledWith('service-123');
  });

  it('handlePointerOver sets hover state', () => {
    const { result } = renderHook(() => useInteraction());
    const event: MockThreeEvent<PointerEvent> = { stopPropagation: vi.fn() };

    act(() => {
      result.current.handlePointerOver('service-123')(event as ThreeEvent<PointerEvent>);
    });
    
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(result.current.hoveredId).toBe('service-123');
  });

  it('handlePointerOut clears hover state', () => {
    const { result } = renderHook(() => useInteraction());
    const event: MockThreeEvent<PointerEvent> = { stopPropagation: vi.fn() };

    act(() => {
      result.current.handlePointerOver('service-123')(event as ThreeEvent<PointerEvent>);
    });
    expect(result.current.hoveredId).toBe('service-123');

    act(() => {
      result.current.handlePointerOut(event as ThreeEvent<PointerEvent>);
    });
    
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(result.current.hoveredId).toBeNull();
  });

  it('handleBackgroundClick clears selection', () => {
    const { result } = renderHook(() => useInteraction());
    const event: MockThreeEvent<MouseEvent> = { stopPropagation: vi.fn() };

    act(() => {
      result.current.handleBackgroundClick(event as ThreeEvent<MouseEvent>);
    });

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(mockClearSelection).toHaveBeenCalled();
  });

  it('click on positioned mesh triggers selection with correct ID', () => {
    const { result } = renderHook(() => useInteraction());
    
    // Simulate clicking on a service floor at a specific position
    const clickEvent: MockThreeEvent<MouseEvent> = {
      stopPropagation: vi.fn(),
      point: { x: 20, y: 5, z: 25 } as any,
      object: { userData: { serviceId: 'service-positioned' } } as any,
    };

    act(() => {
      result.current.handleClick('service-positioned')(clickEvent as ThreeEvent<MouseEvent>);
    });

    expect(clickEvent.stopPropagation).toHaveBeenCalled();
    expect(mockSelectService).toHaveBeenCalledWith('service-positioned');
    expect(mockSetAnchor).toHaveBeenCalledWith(expect.any(Object)); // Check if setAnchor called
  });

  it('hover on positioned mesh sets correct hover state', () => {
    const { result } = renderHook(() => useInteraction());
    
    // Simulate hovering over a service floor at a specific position
    const hoverEvent: MockThreeEvent<PointerEvent> = {
      stopPropagation: vi.fn(),
      point: { x: 20, y: 5, z: 25 } as any,
    };

    act(() => {
      result.current.handlePointerOver('service-positioned')(hoverEvent as ThreeEvent<PointerEvent>);
    });

    expect(hoverEvent.stopPropagation).toHaveBeenCalled();
    expect(result.current.hoveredId).toBe('service-positioned');
    expect(document.body.style.cursor).toBe('pointer');
  });

  it('resets cursor on unmount', () => {
    const { unmount } = renderHook(() => useInteraction());
    
    // Set cursor to pointer
    document.body.style.cursor = 'pointer';
    
    unmount();
    
    // Cursor should be reset to auto
    expect(document.body.style.cursor).toBe('auto');
  });

  it('handles multiple rapid hover events correctly', () => {
    const { result } = renderHook(() => useInteraction());
    const event1: MockThreeEvent<PointerEvent> = { stopPropagation: vi.fn() };
    const event2: MockThreeEvent<PointerEvent> = { stopPropagation: vi.fn() };

    act(() => {
      result.current.handlePointerOver('service-1')(event1 as ThreeEvent<PointerEvent>);
    });
    expect(result.current.hoveredId).toBe('service-1');

    act(() => {
      result.current.handlePointerOver('service-2')(event2 as ThreeEvent<PointerEvent>);
    });
    expect(result.current.hoveredId).toBe('service-2');
  });

  it('click on team triggers selection and sets anchor', () => {
    const { result } = renderHook(() => useInteraction());
    
    // Simulate clicking on a team mesh
    const clickEvent: MockThreeEvent<MouseEvent> = {
      stopPropagation: vi.fn(),
      point: { x: 30, y: 10, z: 30 } as any,
    };

    act(() => {
      result.current.handleClick('team-1')(clickEvent as ThreeEvent<MouseEvent>);
    });

    expect(clickEvent.stopPropagation).toHaveBeenCalled();
    expect(mockSelectService).toHaveBeenCalledWith('team-1');
    expect(mockSetAnchor).toHaveBeenCalledWith(expect.objectContaining({ x: 30, y: 10, z: 30 }));
  });

  it('handleBackgroundClick calls clearSelection and clearAnchor', () => {
    const { result } = renderHook(() => useInteraction());
    const event: MockThreeEvent<MouseEvent> = { 
        stopPropagation: vi.fn(),
        point: { x: 0, y: 0, z: 0 } as any
    };

    act(() => {
      result.current.handleBackgroundClick(event as ThreeEvent<MouseEvent>);
    });

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(mockClearSelection).toHaveBeenCalled();
    expect(mockClearAnchor).toHaveBeenCalled();
  });
});
