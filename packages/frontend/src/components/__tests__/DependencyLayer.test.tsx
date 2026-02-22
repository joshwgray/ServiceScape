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

// Mock LegoDependencyPath to capture props
const MockLegoDependencyPath = vi.fn(({ start, end }) => {
  return (
    <div data-testid="lego-path" data-start={JSON.stringify(start)} data-end={JSON.stringify(end)}>
      Lego Path
    </div>
  );
});

vi.mock('../LegoDependencyPath', () => ({
  default: (props: any) => MockLegoDependencyPath(props),
}));

// Mock calculateDoorPosition to return predictable values
vi.mock('../../utils/servicePositionCalculator', () => ({
  calculateDoorPosition: (params: [number, number, number]) => {
      // Just offset by 1 for simplicity in testing
      return [params[0] + 1, params[1], params[2] + 1];
  },
}));


describe('DependencyLayer', () => {
  const mockServices = [
    { id: 'service-1', name: 'Service 1' },
    { id: 'service-2', name: 'Service 2' },
    { id: 'service-3', name: 'Service 3' },
  ];

  // We are removing layout dependency, so we can mock it as null/empty or check that it's ignored
  const mockRenderedPositions = {
    'service-1': [10, 0, 10],
    'service-2': [20, 0, 20],
    'service-3': [30, 5, 30],
  };

  const mockDependencies = [
    { id: 'dep-1', fromServiceId: 'service-1', toServiceId: 'service-2', type: 'resource' },
    { id: 'dep-2', fromServiceId: 'service-1', toServiceId: 'service-3', type: 'resource' },
  ];

  // Helper to set up store state
  const setupStore = (state: any = {}) => {
    (useSelectionStore as unknown as Mock).mockImplementation((selector: any) => {
      if (!selector) return state;
      return selector(state);
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Default mocks
    (useOrganization as unknown as Mock).mockReturnValue({
      services: mockServices,
      layout: null, // Ensure layout is not required
      renderedPositions: mockRenderedPositions,
    });

    (useDependencies as unknown as Mock).mockReturnValue({
      dependencies: mockDependencies,
      loading: false,
    });

    MockLegoDependencyPath.mockClear();
    
    // Default store state
    setupStore({
      selectedServiceId: 'service-1',
      selectedBuildingId: 'building-1',
      selectionLevel: 'service', // Default to service level for most tests
      dependencyFilters: { declared: true, observed: true },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('should NOT fetch dependencies when selectionLevel is building, even if serviceId is set', () => {
    // This tests the gating logic
    setupStore({
      selectedServiceId: 'service-1', 
      selectedBuildingId: 'building-1',
      selectionLevel: 'building', 
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
      vi.advanceTimersByTime(110);
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

    (useDependencies as unknown as Mock).mockReturnValue({
      dependencies: mockDependencies, // Should still have dependencies returned potentially if logic was flawed
      loading: false,
    });
    
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout');

    const { queryAllByTestId } = render(<DependencyLayer />);

    // Should be 0 initially
    expect(queryAllByTestId('lego-path')).toHaveLength(0);

    // Assert no timeouts scheduled
    expect(setTimeoutSpy).not.toHaveBeenCalledWith(expect.any(Function), 100);
    
    act(() => {
        vi.advanceTimersByTime(1000);
    });

    // Verify render is still 0
    expect(queryAllByTestId('lego-path')).toHaveLength(0);
  });

  it('should utilize renderedPositions ONLY and correctly pass start/end vectors to LegoDependencyPath', async () => {
    (useOrganization as unknown as Mock).mockReturnValue({
      services: mockServices,
      renderedPositions: mockRenderedPositions,
    });
    
    // Explicitly mock dependencies for this test to be sure about reference stability if needed
    // But beforeEach one should work. Let's explicitly set it here too.
    const stableDependencies = [...mockDependencies];
    (useDependencies as unknown as Mock).mockReturnValue({
      dependencies: stableDependencies,
      loading: false,
    });
      
    const { getAllByTestId } = render(<DependencyLayer />);

    // Fast forward animation step by step
    await act(async () => {
       vi.advanceTimersByTime(150);
    });
    await act(async () => {
       vi.advanceTimersByTime(150);
    });
     await act(async () => {
       vi.advanceTimersByTime(1000);
    });

    // Fast forward animation
    act(() => {
      // Advance by small steps to ensure staggered animation triggers
      for (let i = 0; i < 20; i++) {
        vi.advanceTimersByTime(200);
      }
    });

    const legoPaths = getAllByTestId('lego-path');
    
    // Debug output
    if (legoPaths.length !== 2) {
      console.log('Found paths data-ends:', legoPaths.map(p => p.getAttribute('data-end')));
      // Log what was provided to useOrganization mock to be sure
      /*
      console.log('mockRenderedPositions keys:', Object.keys(mockRenderedPositions));
      console.log('mockDependencies:', JSON.stringify(mockDependencies));
      */
    }

    expect(legoPaths).toHaveLength(2);

    const parsedPaths = legoPaths.map(path => ({
        start: JSON.parse(path.getAttribute('data-start')!),
        end: JSON.parse(path.getAttribute('data-end')!)
    }));

    const pathZeroY = parsedPaths.find(p => p.end.y === 0);
    const pathFiveY = parsedPaths.find(p => p.end.y === 5);

    expect(pathZeroY).toBeDefined();
    expect(pathFiveY).toBeDefined();

    // Check first dependency (service-1 -> service-2)
    const p1 = pathZeroY!;
    expect(p1.start.x).toBe(11);
    expect(p1.start.y).toBe(0);
    expect(p1.start.z).toBe(11);

    expect(p1.end.x).toBe(21);
    expect(p1.end.y).toBe(0);
    expect(p1.end.z).toBe(21);

    // Check second dependency (service-1 -> service-3) which has Y offset
    const p2 = pathFiveY!;
    expect(p2.start.x).toBe(11);
    expect(p2.start.y).toBe(0);
    expect(p2.start.z).toBe(11);

    expect(p2.end.x).toBe(31);
    // Explicit check for Y coordinate from renderedPositions: should be 5
    expect(p2.end.y).toBe(5); 
    expect(p2.end.z).toBe(31);
  });

  it('should NOT render paths if renderedPositions are missing', () => {
      // No rendered positions
    (useOrganization as unknown as Mock).mockReturnValue({
      services: mockServices,
      layout: { services: { 'service-1': { x: 0, y: 0, z: 0 } } }, 
      renderedPositions: {},
    });

    const { queryAllByTestId } = render(<DependencyLayer />);
    
     // Fast forward animation
    act(() => {
        vi.advanceTimersByTime(1000);
    });

    expect(queryAllByTestId('lego-path')).toHaveLength(0);
  });
});
