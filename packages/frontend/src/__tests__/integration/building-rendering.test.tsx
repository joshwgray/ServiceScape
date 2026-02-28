import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrganizationProvider } from '../../contexts/OrganizationContext';
import { CityLayout } from '../../components/CityLayout';
import * as organizationDataHook from '../../hooks/useOrganizationData';
import * as progressiveLoadHook from '../../hooks/useProgressiveLoad';
import * as domainHealthHook from '../../hooks/useDomainHealth';
import * as graphMetricsHook from '../../hooks/useGraphMetrics';
import type { Domain, Service, Team } from '@servicescape/shared';
import type { LayoutPositions } from '../../services/apiClient';

vi.mock('../../hooks/useOrganizationData');
vi.mock('../../hooks/useProgressiveLoad');
vi.mock('../../hooks/useDomainHealth');
vi.mock('../../hooks/useGraphMetrics');
vi.mock('../../stores/selectionStore', () => ({
  useSelectionStore: vi.fn((selector: (state: { metricsMode: boolean }) => unknown) =>
    selector({ metricsMode: false })
  ),
}));

vi.mock('../../components/Domain', () => ({
  Domain: ({ domain, position }: { domain: Domain; position: [number, number, number] }) => (
    <div
      data-testid="domain"
      data-domain-id={domain.id}
      data-position={position.join(',')}
    >
      {domain.name}
    </div>
  ),
}));

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
];

const mockLayout: LayoutPositions = {
  domains: {
    'domain-1': { x: 0, y: 0, z: 0 },
    'domain-2': { x: 150, y: 0, z: 0 },
  },
  teams: {
    'team-1': { x: -20, y: 0, z: -10 },
    'team-2': { x: 130, y: 0, z: 5 },
  },
  services: {
    'service-1': { x: -20, y: 10.5, z: -10 },
    'service-2': { x: 130, y: 10.5, z: 5 },
  },
};

describe('Integration: Building Rendering and Positioning', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(organizationDataHook.useOrganizationData).mockReturnValue({
      domains: mockDomains,
      teams: mockTeams,
      services: mockServices,
      layout: mockLayout,
      loading: false,
      error: null,
    });
    vi.mocked(progressiveLoadHook.useProgressiveLoad).mockImplementation(() => {});
    vi.mocked(domainHealthHook.useDomainHealth).mockReturnValue({
      domainHealthMap: {},
      loading: false,
      error: null,
    });
    vi.mocked(graphMetricsHook.useGraphMetrics).mockReturnValue({
      teamRiskMap: {},
      loading: false,
      error: null,
    });
  });

  it('renders one Domain per organization domain', () => {
    render(
      <OrganizationProvider>
        <CityLayout />
      </OrganizationProvider>
    );

    const domains = screen.getAllByTestId('domain');
    expect(domains).toHaveLength(2);
    expect(screen.getByText('Marketing Domain')).toBeInTheDocument();
    expect(screen.getByText('Engineering Domain')).toBeInTheDocument();
  });

  it('passes layout positions from OrganizationProvider into Domain components', () => {
    render(
      <OrganizationProvider>
        <CityLayout />
      </OrganizationProvider>
    );

    expect(screen.getByText('Marketing Domain')).toHaveAttribute('data-position', '0,0,0');
    expect(screen.getByText('Engineering Domain')).toHaveAttribute('data-position', '150,0,0');
  });

  it('maintains the expected 150-unit spacing between domains', () => {
    render(
      <OrganizationProvider>
        <CityLayout />
      </OrganizationProvider>
    );

    const positions = screen.getAllByTestId('domain').map((element) =>
      element.getAttribute('data-position')?.split(',').map(Number) ?? [0, 0, 0]
    );
    const [left, right] = positions;
    const dx = right[0] - left[0];
    const dz = right[2] - left[2];

    expect(Math.sqrt(dx * dx + dz * dz)).toBe(150);
  });

  it('falls back to the default position when a domain is missing from layout', () => {
    vi.mocked(organizationDataHook.useOrganizationData).mockReturnValue({
      domains: mockDomains,
      teams: mockTeams,
      services: mockServices,
      layout: {
        ...mockLayout,
        domains: {
          'domain-1': { x: 0, y: 0, z: 0 },
        },
      },
      loading: false,
      error: null,
    });

    render(
      <OrganizationProvider>
        <CityLayout />
      </OrganizationProvider>
    );

    expect(screen.getByText('Engineering Domain')).toHaveAttribute('data-position', '0,0,0');
  });

  it('tracks visible objects for progressive loading using layout positions', () => {
    render(
      <OrganizationProvider>
        <CityLayout />
      </OrganizationProvider>
    );

    expect(progressiveLoadHook.useProgressiveLoad).toHaveBeenCalledWith([
      {
        id: 'domain-1',
        position: { x: 0, y: 0, z: 0 },
        radius: 15,
      },
      {
        id: 'domain-2',
        position: { x: 150, y: 0, z: 0 },
        radius: 15,
      },
    ]);
  });
});
