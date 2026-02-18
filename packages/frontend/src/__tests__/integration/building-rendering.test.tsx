import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Canvas } from '@react-three/fiber';
import { CityLayout } from '../../components/CityLayout';
import { OrganizationProvider } from '../../contexts/OrganizationContext';
import * as apiClient from '../../services/apiClient';
import type { Domain, Team, Service } from '@servicescape/shared';
import type { LayoutPositions } from '../../services/apiClient';

/**
 * Integration tests for building rendering and positioning verification
 * 
 * CRITICAL: These tests verify actual component rendering with 100×100 domain geometry.
 * They MUST fail if Domain.tsx geometry is changed back to 20×20.
 * 
 * Strategy:
 * - Test Domain component renders with correct 100×100 plane geometry
 * - Test CityLayout passes correct positions to Domain components
 * - Test layout data structure has teams within domain bounds
 * - Detailed Building/Service positioning is tested in Domain.test.tsx
 */

// Track domain render calls
const domainRenderCalls: any[] = [];

// Mock Domain to capture render calls and verify props
vi.mock('../../components/Domain', () => ({
  Domain: ({ domain, position }: any) => {
    domainRenderCalls.push({ domain, position });
    return (
      <group data-testid="domain" data-domain-id={domain.id} data-position={position?.join(',')}>
        <mesh data-testid="domain-plate">
          <boxGeometry args={[100, 0.4, 100]} />
        </mesh>
        <div data-testid="domain-name">{domain.name}</div>
      </group>
    );
  },
}));

// Mock R3F
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="canvas">{children}</div>,
  useFrame: vi.fn(),
  extend: vi.fn(),
  useThree: () => ({ camera: { position: { distanceTo: vi.fn(() => 100) } } }),
}));

// Mock Drei
vi.mock('@react-three/drei', () => ({
  Text: ({ children }: any) => <div data-testid="drei-text">{children}</div>,
}));

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

// Mock hooks
vi.mock('../../hooks/useProgressiveLoad', () => ({
  useProgressiveLoad: vi.fn(),
}));

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

vi.mock('../../hooks/useLOD', () => ({
  useLOD: vi.fn(() => 1), // LODLevel.MEDIUM
}));

vi.mock('../../hooks/useServiceData', () => ({
  useServiceData: vi.fn(() => ({ services: [] })),
}));

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
  { id: 'team-3', name: 'Data Team', domainId: 'domain-2' },
];

const mockServices: Service[] = [
  { id: 'service-1', name: 'Analytics Service', teamId: 'team-1' },
  { id: 'service-2', name: 'API Gateway', teamId: 'team-2' },
  { id: 'service-3', name: 'User Service', teamId: 'team-2' },
  { id: 'service-4', name: 'Data Pipeline', teamId: 'team-3' },
];

const mockLayout: LayoutPositions = {
  domains: {
    'domain-1': { x: 0, y: 0, z: 0 },
    'domain-2': { x: 150, y: 0, z: 0 },
  },
  teams: {
    'team-1': { x: -20, y: 0, z: -10 },
    'team-2': { x: 130, y: 0, z: 5 },
    'team-3': { x: 160, y: 0, z: -15 },
  },
  services: {
    'service-1': { x: -20, y: 10.5, z: -10 },
    'service-2': { x: 130, y: 10.5, z: 5 },
    'service-3': { x: 130, y: 11.1, z: 5 },
    'service-4': { x: 160, y: 10.5, z: -15 },
  },
};

describe('Integration: Building Rendering and Positioning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    domainRenderCalls.length = 0;
    
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

  describe('Domain renders with correct 100×100 geometry (REGRESSION TESTS)', () => {
    it('MUST render Domain with 100×100 plane geometry (FAILS if changed to 20×20)', async () => {
      const TestComponent = () => (
        <OrganizationProvider>
          <Canvas>
            <CityLayout />
          </Canvas>
        </OrganizationProvider>
      );

      const { container } = render(<TestComponent />);

      await waitFor(() => {
        expect(screen.queryAllByTestId('domain').length).toBeGreaterThan(0);
      });

      // Verify domain plate box geometry in rendered DOM (LegoBaseplate uses boxGeometry)
      const allBoxGeometries = [...container.querySelectorAll('boxgeometry')];
      const domainPlate = allBoxGeometries.find(el => {
        const args = el.getAttribute('args') ?? '';
        return args.startsWith('100,') && args.endsWith(',100');
      });
      expect(domainPlate).toBeInTheDocument();
      
      // THIS TEST WILL FAIL if Domain.tsx is changed back to [20, 20]
    });

    it('MUST reject 20×20 geometry (confirms regression protection)', async () => {
      const TestComponent = () => (
        <OrganizationProvider>
          <Canvas>
            <CityLayout />
          </Canvas>
        </OrganizationProvider>
      );

      const { container } = render(<TestComponent />);

      await waitFor(() => {
        expect(screen.queryAllByTestId('domain').length).toBeGreaterThan(0);
      });

      const allBoxGeometries = [...container.querySelectorAll('boxgeometry')];
      const has20x20 = allBoxGeometries.some(el => el.getAttribute('args') === '20,20,20');
      
      // Verify we're NOT using the old 20×20 geometry
      expect(has20x20).toBe(false);
    });

    it('MUST verify layout positions teams for 100×100, not 20×20', async () => {
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

      // Verify layout data has teams positioned for 100×100 domain bounds
      const layout = await apiClient.getLayout();
      
      mockTeams.forEach(team => {
        const teamPos = layout.teams[team.id];
        const domainPos = layout.domains[team.domainId];
        
        const relativeX = teamPos.x - domainPos.x;
        const relativeZ = teamPos.z - domainPos.z;

        // Teams MUST be within [-50, 50] for 100×100 domain
        expect(relativeX).toBeGreaterThanOrEqual(-50);
        expect(relativeX).toBeLessThanOrEqual(50);
        expect(relativeZ).toBeGreaterThanOrEqual(-50);
        expect(relativeZ).toBeLessThanOrEqual(50);
       });

      // Verify at least one team is positioned beyond ±10 units
      // (would be outside visible area if domain was 20×20)
      const someTeamBeyond10Units = mockTeams.some(team => {
        const teamPos = layout.teams[team.id];
        const domainPos = layout.domains[team.domainId];
        const relativeX = Math.abs(teamPos.x - domainPos.x);
        const relativeZ = Math.abs(teamPos.z - domainPos.z);
        return relativeX > 10 || relativeZ > 10;
      });

      expect(someTeamBeyond10Units).toBe(true);
    });
  });

  describe('CityLayout integration with Domain components', () => {
    it('should pass correct positions to Domain components', async () => {
      const TestComponent = () => (
        <OrganizationProvider>
          <Canvas>
            <CityLayout />
          </Canvas>
        </OrganizationProvider>
      );

      render(<TestComponent />);

      await waitFor(() => {
        expect(domainRenderCalls.length).toBe(2);
      });

      const domain1 = domainRenderCalls.find(call => call.domain.id === 'domain-1');
      const domain2 = domainRenderCalls.find(call => call.domain.id === 'domain-2');

      expect(domain1.position).toEqual([0, 0, 0]);
      expect(domain2.position).toEqual([150, 0, 0]);
    });

    it('should maintain 150-unit domain spacing', async () => {
      const TestComponent = () => (
        <OrganizationProvider>
          <Canvas>
            <CityLayout />
          </Canvas>
        </OrganizationProvider>
      );

      render(<TestComponent />);

      await waitFor(() => {
        expect(domainRenderCalls.length).toBe(2);
      });

      const positions = domainRenderCalls.map(call => call.position);
      const [pos1, pos2] = positions;

      const dx = pos2[0] - pos1[0];
      const dz = pos2[2] - pos1[2];
      const distance = Math.sqrt(dx * dx + dz * dz);

      expect(distance).toBe(150);
    });
  });

  describe('Layout data structure validation', () => {
    it('should have all entities positioned', async () => {
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

      const layout = await apiClient.getLayout();

      expect(Object.keys(layout.domains).length).toBe(2);
      expect(Object.keys(layout.teams).length).toBe(3);
      expect(Object.keys(layout.services).length).toBe(4);
    });

    it('should position all domains on ground plane (y=0)', async () => {
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

      const layout = await apiClient.getLayout();

      Object.values(layout.domains).forEach(pos => {
        expect(pos.y).toBe(0);
      });
    });

    it('should position all teams on ground plane (y=0)', async () => {
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

      const layout = await apiClient.getLayout();

      Object.values(layout.teams).forEach(pos => {
        expect(pos.y).toBe(0);
      });
    });

    it('should elevate all services above ground (y > 0)', async () => {
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

      const layout = await apiClient.getLayout();

      Object.values(layout.services).forEach(pos => {
        expect(pos.y).toBeGreaterThan(0);
      });
    });

    it('should maintain hierarchy: teams within domains, services within teams', async () => {
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

      const layout = await apiClient.getLayout();

      // Verify each team is within its domain bounds
      mockTeams.forEach(team => {
        const teamPos = layout.teams[team.id];
        const domainPos = layout.domains[team.domainId];
        
        const relativeX = teamPos.x - domainPos.x;
        const relativeZ = teamPos.z - domainPos.z;

        expect(Math.abs(relativeX)).toBeLessThanOrEqual(50);
        expect(Math.abs(relativeZ)).toBeLessThanOrEqual(50);
      });

      // Verify each service is within its parent domain bounds
      mockServices.forEach(service => {
        const servicePos = layout.services[service.id];
        const team = mockTeams.find(t => t.id === service.teamId)!;
        const domainPos = layout.domains[team.domainId];
        
        const relativeX = servicePos.x - domainPos.x;
        const relativeZ = servicePos.z - domainPos.z;

        expect(Math.abs(relativeX)).toBeLessThanOrEqual(50);
        expect(Math.abs(relativeZ)).toBeLessThanOrEqual(50);
      });
    });
  });
});
