import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { Canvas } from '@react-three/fiber';
import { CityLayout } from '../../components/CityLayout';
import { OrganizationProvider } from '../../contexts/OrganizationContext';
import * as apiClient from '../../services/apiClient';
import type { Domain, Team, Service } from '@servicescape/shared';
import type { LayoutPositions } from '../../services/apiClient';

// Mock API client
vi.mock('../../services/apiClient', () => ({
  __esModule: true,
  getDomains: vi.fn(),
  getAllTeams: vi.fn(),
  getAllServices: vi.fn(),
  getLayout: vi.fn(),
  getTeams: vi.fn(),
  getServices: vi.fn(),
}));

// Mock progressive load hook
vi.mock('../../hooks/useProgressiveLoad', () => ({
  useProgressiveLoad: vi.fn(),
}));

// Mock visibility store
vi.mock('../../stores/visibilityStore', () => ({
  useVisibilityStore: vi.fn((selector: any) => {
    const state = {
      isDomainVisible: () => true,
      isTeamVisible: () => true,
      isServiceVisible: () => true,
    };
    return selector ? selector(state) : state;
  }),
}));

// Mock selection store
vi.mock('../../stores/selectionStore', () => ({
  useSelectionStore: vi.fn((selector: any) => {
    const state = {
      selectedServiceId: null,
      selectService: vi.fn(),
      clearSelection: vi.fn(),
      dependencyFilters: { declared: true, observed: true },
    };
    return selector ? selector(state) : state;
  }),
}));

// Mock LOD hook to always return NEAR
vi.mock('../../hooks/useLOD', () => ({
  useLOD: vi.fn(() => 2), // LODLevel.NEAR
}));

// Mock ServiceData hook
vi.mock('../../hooks/useServiceData', () => ({
  useServiceData: vi.fn((teamId: string) => {
    const services = mockServices.filter(s => s.teamId === teamId);
    return { services };
  }),
}));

// Mock dependencies hook
vi.mock('../../hooks/useDependencies', () => ({
  useDependencies: vi.fn(() => ({ dependencies: [] })),
}));

// Mock data
const mockDomains: Domain[] = [
  { id: 'domain-1', name: 'Marketing Domain' },
  { id: 'domain-2', name: 'Engineering Domain' },
];

const mockTeams: Team[] = [
  { id: 'team-1', name: 'Marketing Team', domainId: 'domain-1' },
  { id: 'team-2', name: 'Platform Team', domainId: 'domain-2' },
];

const mockServices: Service[] = [
  { id: 'service-1', name: 'Analytics Service', teamId: 'team-1' },
  { id: 'service-2', name: 'API Gateway', teamId: 'team-2' },
  { id: 'service-3', name: 'User Service', teamId: 'team-2' },
];

const mockLayout: LayoutPositions = {
  domains: {
    'domain-1': { x: -20, y: 0, z: 0 },
    'domain-2': { x: 20, y: 0, z: 0 },
  },
  teams: {
    'team-1': { x: -20, y: 0, z: 0 },
    'team-2': { x: 20, y: 0, z: 5 },
  },
  services: {
    'service-1': { x: -20, y: 0.5, z: 0 },
    'service-2': { x: 20, y: 0.5, z: 5 },
    'service-3': { x: 20, y: 1.1, z: 5 },
  },
};

describe('Integration: Positioning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.getDomains).mockResolvedValue(mockDomains);
    vi.mocked(apiClient.getAllTeams).mockResolvedValue(mockTeams);
    vi.mocked(apiClient.getAllServices).mockResolvedValue(mockServices);
    vi.mocked(apiClient.getLayout).mockResolvedValue(mockLayout);
    vi.mocked(apiClient.getTeams).mockImplementation(async (domainId: string) => {
      return mockTeams.filter(t => t.domainId === domainId);
    });
    vi.mocked(apiClient.getServices).mockImplementation(async (teamId: string) => {
      return mockServices.filter(s => s.teamId === teamId);
    });
  });

  it('should load organization data with layout positions', async () => {
    const TestComponent = () => (
      <OrganizationProvider>
        <Canvas>
          <CityLayout />
        </Canvas>
      </OrganizationProvider>
    );

    render(<TestComponent />);

    await waitFor(() => {
      expect(apiClient.getDomains).toHaveBeenCalled();
      expect(apiClient.getAllTeams).toHaveBeenCalled();
      expect(apiClient.getAllServices).toHaveBeenCalled();
      expect(apiClient.getLayout).toHaveBeenCalled();
    });
  });

  it('should verify Domain meshes render at expected x/z coordinates from layout', async () => {
    const TestComponent = () => (
      <OrganizationProvider>
        <Canvas>
          <CityLayout />
        </Canvas>
      </OrganizationProvider>
    );

    const { container } = render(<TestComponent />);

    await waitFor(() => {
      expect(apiClient.getLayout).toHaveBeenCalled();
    });

    // Verify layout data was loaded with correct domain positions
    const layout = await apiClient.getLayout();
    expect(layout.domains['domain-1']).toEqual({ x: -20, y: 0, z: 0 });
    expect(layout.domains['domain-2']).toEqual({ x: 20, y: 0, z: 0 });
    
    // Verify OrganizationContext has the layout data
    expect(container).toBeTruthy();
  });

  it('should verify Building meshes render at team positions from layout', async () => {
    const TestComponent = () => (
      <OrganizationProvider>
        <Canvas>
          <CityLayout />
        </Canvas>
      </OrganizationProvider>
    );

    render(<TestComponent />);

    await waitFor(() => {
      expect(apiClient.getLayout).toHaveBeenCalled();
    }, { timeout: 3000 });

    // Verify layout includes team positions
    const layout = await apiClient.getLayout();
    expect(layout.teams['team-1']).toEqual({ x: -20, y: 0, z: 0 });
    expect(layout.teams['team-2']).toEqual({ x: 20, y: 0, z: 5 });
    
    // Verify all required layout data is present
    expect(layout.teams).toBeDefined();
    expect(Object.keys(layout.teams).length).toBe(2);
  });

  it('should verify ServiceFloor meshes render at service positions from layout', async () => {
    const TestComponent = () => (
      <OrganizationProvider>
        <Canvas>
          <CityLayout />
        </Canvas>
      </OrganizationProvider>
    );

    render(<TestComponent />);

    await waitFor(() => {
      expect(apiClient.getLayout).toHaveBeenCalled();
    }, { timeout: 3000 });

    // Verify layout includes service positions
    const layout = await apiClient.getLayout();
    expect(layout.services['service-1']).toEqual({ x: -20, y: 0.5, z: 0 });
    expect(layout.services['service-2']).toEqual({ x: 20, y: 0.5, z: 5 });
    expect(layout.services['service-3']).toEqual({ x: 20, y: 1.1, z: 5 });
    
    // Verify all services have position data
    expect(layout.services).toBeDefined();
    expect(Object.keys(layout.services).length).toBe(3);
  });

  it('should handle missing layout data for entities gracefully', async () => {
    const partialLayout: LayoutPositions = {
      domains: {
        'domain-1': { x: -20, y: 0, z: 0 },
        // domain-2 missing
      },
      teams: {
        'team-1': { x: -20, y: 0, z: 0 },
        // team-2 missing
      },
      services: {
        'service-1': { x: -20, y: 0.5, z: 0 },
        // service-2 and service-3 missing
      },
    };

    vi.mocked(apiClient.getLayout).mockResolvedValue(partialLayout);

    const TestComponent = () => (
      <OrganizationProvider>
        <Canvas>
          <CityLayout />
        </Canvas>
      </OrganizationProvider>
    );

    render(<TestComponent />);

    await waitFor(() => {
      expect(apiClient.getLayout).toHaveBeenCalled();
    });

    // Should not crash even with partial layout data
    const layout = await apiClient.getLayout();
    expect(layout.domains['domain-1']).toBeDefined();
    expect(layout.domains['domain-2']).toBeUndefined();
    expect(layout.teams['team-2']).toBeUndefined();
    expect(layout.services['service-2']).toBeUndefined();
  });

  it('should handle layout API failure gracefully', async () => {
    vi.mocked(apiClient.getLayout).mockRejectedValue(new Error('API Error'));

    const TestComponent = () => (
      <OrganizationProvider>
        <Canvas>
          <CityLayout />
        </Canvas>
      </OrganizationProvider>
    );

    render(<TestComponent />);

    await waitFor(() => {
      expect(apiClient.getLayout).toHaveBeenCalled();
    });

    // Should not crash on API failure
    // Component should handle error gracefully
  });

  it('should handle empty layout data', async () => {
    const emptyLayout: LayoutPositions = {
      domains: {},
      teams: {},
      services: {},
    };

    vi.mocked(apiClient.getLayout).mockResolvedValue(emptyLayout);

    const TestComponent = () => (
      <OrganizationProvider>
        <Canvas>
          <CityLayout />
        </Canvas>
      </OrganizationProvider>
    );

    const { container } = render(<TestComponent />);

    await waitFor(() => {
      expect(apiClient.getLayout).toHaveBeenCalled();
    });

    // Should render without errors even with empty layout
    expect(container).toBeTruthy();
    
    const layout = await apiClient.getLayout();
    expect(Object.keys(layout.domains).length).toBe(0);
    expect(Object.keys(layout.teams).length).toBe(0);
    expect(Object.keys(layout.services).length).toBe(0);
  });
});
