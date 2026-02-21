import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useInteraction } from '../useInteraction';
import { useSelectionStore } from '../../stores/selectionStore';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useBubblePositionStore } from '../../stores/bubblePositionStore';

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
  const mockSelectBuilding = vi.fn();
  const mockClearSelection = vi.fn();
  const mockSetAnchor = vi.fn();
  const mockClearAnchor = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useSelectionStore as any).mockImplementation((selector: any) => {
        const state = {
            selectService: mockSelectService,
            selectBuilding: mockSelectBuilding,
            clearSelection: mockClearSelection,
            selectedBuildingId: null // Default
        };
        return selector(state);
    });

    (useBubblePositionStore as any).mockImplementation((selector: any) => {
         const state = {
            setAnchor: mockSetAnchor,
            clearAnchor: mockClearAnchor
         };
         return selector(state);
    });

    (useOrganization as any).mockReturnValue({
      layout: {
        services: { 's1': { x: 0, y: 0, z: 0 } },
        teams: { 't1': { x: 10, y: 0, z: 0 } },
        domains: {}
      },
      services: [{ id: 's1', teamId: 't1', name: 'Service 1' }],
      teams: [{ id: 't1', name: 'Team 1' }]
    });
  });

  describe('handleServiceClick', () => {
     it('should select service if its building is already focused', () => {
        // Mock selected building as 't1'
        (useSelectionStore as any).mockImplementation((selector: any) => {
            const state = {
                selectService: mockSelectService,
                selectBuilding: mockSelectBuilding,
                selectedBuildingId: 't1'
            };
            return selector(state);
        });

        const { result } = renderHook(() => useInteraction());
        const event = { stopPropagation: vi.fn() } as any;

        act(() => {
            // Using handleServiceClick if we rename it, or existing handleClick
            // Assuming we'll use handleClick for services for now as per current code
            result.current.handleServiceClick('s1')(event);
        });

        expect(event.stopPropagation).toHaveBeenCalled();
        expect(mockSelectService).toHaveBeenCalledWith('s1');
        expect(mockSelectBuilding).not.toHaveBeenCalled();
     });

     it('should auto-select building if service clicked and building NOT focused', () => {
        // Mock selected building as null
        (useSelectionStore as any).mockImplementation((selector: any) => {
            const state = {
                selectService: mockSelectService,
                selectBuilding: mockSelectBuilding,
                selectedBuildingId: null
            };
            return selector(state);
        });

        const { result } = renderHook(() => useInteraction());
        const event = { stopPropagation: vi.fn() } as any;

        act(() => {
            result.current.handleServiceClick('s1')(event);
        });

        expect(event.stopPropagation).toHaveBeenCalled();
        expect(mockSelectBuilding).toHaveBeenCalledWith('t1'); // Auto-select t1
        expect(mockSelectService).not.toHaveBeenCalled();
     });
     
     it('should select service if clicked service has no team found (fallback)', () => {
         // Mock org data to not have s2
        (useOrganization as any).mockReturnValue({
            layout: { services: {} },
            services: [],
            teams: []
        });

        const { result } = renderHook(() => useInteraction());
        const event = { stopPropagation: vi.fn() } as any;

        act(() => {
            result.current.handleServiceClick('s2')(event);
        });

        expect(mockSelectService).toHaveBeenCalledWith('s2');
     });
  });

  describe('handleBuildingClick', () => {
      it('should select building when called', () => {
        const { result } = renderHook(() => useInteraction());
        const event = { stopPropagation: vi.fn() } as any;

        act(() => {
            result.current.handleBuildingClick('t2')(event);
        });

        expect(mockSelectBuilding).toHaveBeenCalledWith('t2');
      });
  });
});
