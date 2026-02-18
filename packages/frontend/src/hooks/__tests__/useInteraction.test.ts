import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
// @ts-ignore
import { useInteraction } from '../useInteraction';
import { useSelectionStore } from '../../stores/selectionStore';

// Mock dependencies
vi.mock('../../stores/selectionStore', () => ({
  useSelectionStore: vi.fn(),
}));

describe('useInteraction', () => {
  const mockSelectService = vi.fn();
  const mockClearSelection = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock the store hook implementation
    (useSelectionStore as any).mockImplementation((selector: any) => {
      const state = {
        selectService: mockSelectService,
        clearSelection: mockClearSelection,
      };
      return selector ? selector(state) : state;
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
    const event = { stopPropagation: vi.fn(), point: { x: 0, y: 0, z: 0 } } as any; 
    
    act(() => {
      // @ts-ignore
      result.current.handleClick('service-123')(event);
    });

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(mockSelectService).toHaveBeenCalledWith('service-123');
  });

  it('handlePointerOver sets hover state', () => {
    const { result } = renderHook(() => useInteraction());
    const event = { stopPropagation: vi.fn() } as any;

    act(() => {
      // @ts-ignore
      result.current.handlePointerOver('service-123')(event);
    });
    
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(result.current.hoveredId).toBe('service-123');
  });

  it('handlePointerOut clears hover state', () => {
    const { result } = renderHook(() => useInteraction());
    const event = { stopPropagation: vi.fn() } as any;

    act(() => {
      // @ts-ignore
      result.current.handlePointerOver('service-123')(event);
    });
    expect(result.current.hoveredId).toBe('service-123');

    act(() => {
      // @ts-ignore
      result.current.handlePointerOut(event);
    });
    
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(result.current.hoveredId).toBeNull();
  });
});
