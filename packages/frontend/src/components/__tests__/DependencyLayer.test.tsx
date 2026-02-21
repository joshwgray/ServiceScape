// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import DependencyLayer from '../DependencyLayer';
import { useSelectionStore } from '../../stores/selectionStore';
import { useDependencies } from '../../hooks/useDependencies';
import { useOrganization } from '../../contexts/OrganizationContext';

// Mock dependencies
vi.mock('../../stores/selectionStore', () => ({
  useSelectionStore: vi.fn(),
}));

vi.mock('../../hooks/useDependencies', () => ({
  useDependencies: vi.fn(),
}));

vi.mock('../../contexts/OrganizationContext', () => ({
  useOrganization: vi.fn(),
}));

// Mock LegoDependencyPath
vi.mock('../LegoDependencyPath', () => ({
  default: () => <div data-testid="lego-path">Lego Path</div>,
}));

describe('DependencyLayer Phase 7', () => {
  const mockServices = [
    { id: 'service-1', name: 'Service 1' },
    { id: 'service-2', name: 'Service 2' },
    { id: 'service-3', name: 'Service 3' },
  ];

  const mockLayout = {
    services: {
      'service-1': { x: 0, y: 0, z: 0 },
      'service-2': { x: 10, y: 0, z: 0 },
      'service-3': { x: 5, y: 0, z: 5 },
    },
  };

  const mockDependencies = [
    { id: 'dep-1', fromServiceId: 'service-1', toServiceId: 'service-2', type: 'resource' },
    { id: 'dep-2', fromServiceId: 'service-1', toServiceId: 'service-3', type: 'resource' },
  ];

  // Helper to set up store state
  const setupStore = (state: any) => {
    (useSelectionStore as unknown as Mock).mockImplementation((selector: any) => {
      return selector ? selector(state) : state;
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Default mocks
    (useOrganization as unknown as Mock).mockReturnValue({
      services: mockServices,
      layout: mockLayout,
    });

    (useDependencies as unknown as Mock).mockReturnValue({
      dependencies: mockDependencies,
      loading: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('should NOT fetch dependencies when selectionLevel is building, even if serviceId is set', () => {
    // This tests the gating logic
    setupStore({
      selectedServiceId: 'service-1', // Valid service ID
      selectedBuildingId: 'building-1',
      selectionLevel: 'building', // But at building level
      dependencyFilters: { declared: true, observed: true },
    });

    render(<DependencyLayer />);

    // Assert useDependencies called with null
    expect(useDependencies).toHaveBeenCalledWith(null, undefined);
  });

  it('should stagger dependency rendering precisely', () => {
    setupStore({
      selectedServiceId: 'service-1',
      selectedBuildingId: 'building-1',
      selectionLevel: 'service',
      dependencyFilters: { declared: true, observed: true },
    });

    // Provide 3 dependencies
    const threeDeps = [
      ...mockDependencies,
      { id: 'dep-3', fromServiceId: 'service-2', toServiceId: 'service-3', type: 'resource' },
    ];

    (useDependencies as unknown as Mock).mockReturnValue({
      dependencies: threeDeps,
      loading: false,
    });

    const { getAllByTestId, queryAllByTestId } = render(<DependencyLayer />);

    // Initial render: 0 visible
    expect(queryAllByTestId('lego-path')).toHaveLength(0);

    // Advance 100ms: 1 visible
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(getAllByTestId('lego-path')).toHaveLength(1);

    // Advance 100ms: 2 visible
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(getAllByTestId('lego-path')).toHaveLength(2);

    // Advance 100ms: 3 visible
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(getAllByTestId('lego-path')).toHaveLength(3);
    
    // Advance more: still 3 visible
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(getAllByTestId('lego-path')).toHaveLength(3);
  });

  it('should NOT run stagger timers if selectionLevel is not service', () => {
    setupStore({
      selectedServiceId: 'service-1',
      selectedBuildingId: 'building-1',
      selectionLevel: 'building', // Changed to building
      dependencyFilters: { declared: true, observed: true },
    });

    // Setup dependencies as if they were somehow present
    // Force useDependencies to return data
    (useDependencies as unknown as Mock).mockReturnValue({
      dependencies: mockDependencies,
      loading: false,
    });
    
    // We spy on setTimeout to ensure it's not called
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout');

    const { queryAllByTestId } = render(<DependencyLayer />);

    // Should be 0 initially
    expect(queryAllByTestId('lego-path')).toHaveLength(0);

    // If the effect was NOT gated, it would schedule a timeout because dependencies.length > 0 (2)
    // and visibleCount (0) < dependencies.length (2).
    
    // Assert no timeouts scheduled
    // We specifically check that our stagger timeout (100ms) was not scheduled
    expect(setTimeoutSpy).not.toHaveBeenCalledWith(expect.any(Function), 100);
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Verify render is still 0
    expect(queryAllByTestId('lego-path')).toHaveLength(0);
  });
});
