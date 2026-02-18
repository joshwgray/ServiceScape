import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import DependencyLayer from '../DependencyLayer';
import type { Dependency, Service } from '@servicescape/shared';
import { DEPENDENCY_TYPES } from '@servicescape/shared';
import type { LayoutPositions } from '../../services/apiClient';
import * as THREE from 'three';

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

// Track DependencyEdge renders
let edgeRenders: any[] = [];

vi.mock('../DependencyEdge', () => ({
  default: vi.fn((props) => {
    edgeRenders.push(props);
    return null; // Return null instead of JSX  
  }),
}));

import { useSelectionStore } from '../../stores/selectionStore';
import { useDependencies } from '../../hooks/useDependencies';
import { useOrganization } from '../../contexts/OrganizationContext';
import DependencyEdge from '../DependencyEdge';

describe('DependencyLayer', () => {
  const mockServices: Service[] = [
    { id: 'service-1', name: 'Service 1', teamId: 'team-1' },
    { id: 'service-2', name: 'Service 2', teamId: 'team-1' },
    { id: 'service-3', name: 'Service 3', teamId: 'team-2' },
  ];

  const mockLayout: LayoutPositions = {
    domains: {
      'domain-1': { x: -20, y: 0, z: 0 },
    },
    teams: {
      'team-1': { x: -20, y: 0, z: 0 },
      'team-2': { x: 20, y: 0, z: 5 },
    },
    services: {
      'service-1': { x: -20, y: 0.5, z: 0 },
      'service-2': { x: -15, y: 0.5, z: 2 },
      'service-3': { x: 20, y: 0.5, z: 5 },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    edgeRenders = [];
    
    // Default mocks
    (useSelectionStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any) => {
      const state = {
        selectedServiceId: null,
        dependencyFilters: { declared: true, observed: true },
      };
      return selector ? selector(state) : state;
    });

    (useDependencies as ReturnType<typeof vi.fn>).mockReturnValue({
      dependencies: [],
      loading: false,
      error: null,
    });

    (useOrganization as ReturnType<typeof vi.fn>).mockReturnValue({
      services: mockServices,
      layout: mockLayout,
      domains: [],
      teams: [],
      loading: false,
      error: null,
    });
  });

  it('should render nothing when no service is selected', () => {
    render(<DependencyLayer />);

    expect(edgeRenders).toHaveLength(0);
  });

  it('should render nothing when layout is not available', () => {
    (useSelectionStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any) => {
      const state = {
        selectedServiceId: 'service-1',
        dependencyFilters: { declared: true, observed: true },
      };
      return selector ? selector(state) : state;
    });

    (useOrganization as ReturnType<typeof vi.fn>).mockReturnValue({
      services: mockServices,
      layout: null,
      domains: [],
      teams: [],
      loading: false,
      error: null,
    });

    render(<DependencyLayer />);

    expect(edgeRenders).toHaveLength(0);
  });

  it('should render dependency edges connecting positioned services', () => {
    const mockDependencies: Dependency[] = [
      {
        id: 'dep-1',
        fromServiceId: 'service-1',
        toServiceId: 'service-2',
        type: DEPENDENCY_TYPES.DECLARED,
      },
    ];

    (useSelectionStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any) => {
      const state = {
        selectedServiceId: 'service-1',
        dependencyFilters: { declared: true, observed: true },
      };
      return selector ? selector(state) : state;
    });

    (useDependencies as ReturnType<typeof vi.fn>).mockReturnValue({
      dependencies: mockDependencies,
      loading: false,
      error: null,
    });

    render(<DependencyLayer />);

    // Verify DependencyEdge was called with correct positions
    expect(edgeRenders).toHaveLength(1);
    const firstEdge = edgeRenders[0];
    
    expect(firstEdge.start.x).toBe(-20);
    expect(firstEdge.start.y).toBe(0.5);
    expect(firstEdge.start.z).toBe(0);
    
    expect(firstEdge.end.x).toBe(-15);
    expect(firstEdge.end.y).toBe(0.5);
    expect(firstEdge.end.z).toBe(2);
    
    expect(firstEdge.color).toBe('#3b82f6');
    expect(firstEdge.dashed).toBe(false);
    expect(firstEdge.opacity).toBe(0.8);
  });

  it('should verify edge coordinates match layout.services positions', () => {
    const mockDependencies: Dependency[] = [
      {
        id: 'dep-1',
        fromServiceId: 'service-1',
        toServiceId: 'service-3',
        type: DEPENDENCY_TYPES.OBSERVED,
      },
    ];

    (useSelectionStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any) => {
      const state = {
        selectedServiceId: 'service-1',
        dependencyFilters: { declared: true, observed: true },
      };
      return selector ? selector(state) : state;
    });

    (useDependencies as ReturnType<typeof vi.fn>).mockReturnValue({
      dependencies: mockDependencies,
      loading: false,
      error: null,
    });

    render(<DependencyLayer />);

    expect(edgeRenders).toHaveLength(1);
    const firstEdge = edgeRenders[0];
    
    // Verify start position matches service-1 in layout
    const service1Pos = mockLayout.services['service-1'];
    expect(firstEdge.start.x).toBe(service1Pos.x);
    expect(firstEdge.start.y).toBe(service1Pos.y);
    expect(firstEdge.start.z).toBe(service1Pos.z);
    
    // Verify end position matches service-3 in layout
    const service3Pos = mockLayout.services['service-3'];
    expect(firstEdge.end.x).toBe(service3Pos.x);
    expect(firstEdge.end.y).toBe(service3Pos.y);
    expect(firstEdge.end.z).toBe(service3Pos.z);
    
    // Verify OBSERVED dependency style
    expect(firstEdge.color).toBe('#f97316');
    expect(firstEdge.dashed).toBe(true);
    expect(firstEdge.opacity).toBe(0.6);
  });

  it('should render multiple dependency edges with correct spatial connections', () => {
    const mockDependencies: Dependency[] = [
      {
        id: 'dep-1',
        fromServiceId: 'service-1',
        toServiceId: 'service-2',
        type: DEPENDENCY_TYPES.DECLARED,
      },
      {
        id: 'dep-2',
        fromServiceId: 'service-1',
        toServiceId: 'service-3',
        type: DEPENDENCY_TYPES.OBSERVED,
      },
    ];

    (useSelectionStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any) => {
      const state = {
        selectedServiceId: 'service-1',
        dependencyFilters: { declared: true, observed: true },
      };
      return selector ? selector(state) : state;
    });

    (useDependencies as ReturnType<typeof vi.fn>).mockReturnValue({
      dependencies: mockDependencies,
      loading: false,
      error: null,
    });

    render(<DependencyLayer />);

    // Should render 2 edges
    expect(edgeRenders).toHaveLength(2);
    
    // First edge: service-1 to service-2
    expect(edgeRenders[0].start).toEqual(new THREE.Vector3(-20, 0.5, 0));
    expect(edgeRenders[0].end).toEqual(new THREE.Vector3(-15, 0.5, 2));
    
    // Second edge: service-1 to service-3
    expect(edgeRenders[1].start).toEqual(new THREE.Vector3(-20, 0.5, 0));
    expect(edgeRenders[1].end).toEqual(new THREE.Vector3(20, 0.5, 5));
  });

  it('should skip edges when service position is missing from layout', () => {
    const incompleteLayout: LayoutPositions = {
      domains: {},
      teams: {},
      services: {
        'service-1': { x: -20, y: 0.5, z: 0 },
        // service-2 position missing
      },
    };

    const mockDependencies: Dependency[] = [
      {
        id: 'dep-1',
        fromServiceId: 'service-1',
        toServiceId: 'service-2',
        type: DEPENDENCY_TYPES.DECLARED,
      },
    ];

    (useSelectionStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any) => {
      const state = {
        selectedServiceId: 'service-1',
        dependencyFilters: { declared: true, observed: true },
      };
      return selector ? selector(state) : state;
    });

    (useDependencies as ReturnType<typeof vi.fn>).mockReturnValue({
      dependencies: mockDependencies,
      loading: false,
      error: null,
    });

    (useOrganization as ReturnType<typeof vi.fn>).mockReturnValue({
      services: mockServices,
      layout: incompleteLayout,
      domains: [],
      teams: [],
      loading: false,
      error: null,
    });

    render(<DependencyLayer />);

    // Should not render any edges since service-2 position is missing
    expect(edgeRenders).toHaveLength(0);
  });

  it('should handle dependency filters correctly', () => {
    (useSelectionStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any) => {
      const state = {
        selectedServiceId: 'service-1',
        dependencyFilters: { declared: true, observed: false },
      };
      return selector ? selector(state) : state;
    });

    render(<DependencyLayer />);

    // Should call useDependencies with DECLARED filter
    expect(useDependencies).toHaveBeenCalledWith('service-1', DEPENDENCY_TYPES.DECLARED);
  });

  it('should not fetch dependencies when both filters are off', () => {
    (useSelectionStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any) => {
      const state = {
        selectedServiceId: 'service-1',
        dependencyFilters: { declared: false, observed: false },
      };
      return selector ? selector(state) : state;
    });

    render(<DependencyLayer />);

    // Should pass null serviceId when both filters are off
    expect(useDependencies).toHaveBeenCalledWith(null, 'NONE');
  });

  it('should handle selected non-service entity gracefully', () => {
    (useSelectionStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any) => {
      const state = {
        selectedServiceId: 'team-1', // Not a service ID
        dependencyFilters: { declared: true, observed: true },
      };
      return selector ? selector(state) : state;
    });

    render(<DependencyLayer />);

    // Should pass null serviceId when selected entity is not a service
    expect(useDependencies).toHaveBeenCalledWith(null, undefined);
  });
});
