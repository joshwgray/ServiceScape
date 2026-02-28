import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CityLayout } from '../CityLayout';
import * as orgContext from '../../contexts/OrganizationContext';
import * as domainHealthHook from '../../hooks/useDomainHealth';
import * as useProgLoad from '../../hooks/useProgressiveLoad';

// Mock hooks
vi.mock('../../contexts/OrganizationContext');
vi.mock('../../hooks/useDomainHealth');
vi.mock('../../hooks/useProgressiveLoad');
vi.mock('../../stores/selectionStore', () => ({
    useSelectionStore: vi.fn((selector: any) => selector({ metricsMode: true })),
}));

// Mock Domain
vi.mock('../Domain', () => ({
    Domain: ({ domain, position, domainHealth }: { domain: any, position: [number, number, number], domainHealth?: any }) => (
        <div
            data-testid="domain"
            data-position={position ? position.join(',') : 'undefined'}
            data-health-status={domainHealth?.status ?? 'none'}
        >
            {domain.name}
        </div>
    )
}));

// Mock R3F
vi.mock('@react-three/fiber', () => ({
    useFrame: vi.fn(),
    useThree: () => ({ camera: {} }) 
}));

describe('CityLayout', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(domainHealthHook.useDomainHealth).mockReturnValue({
            domainHealthMap: {},
            loading: false,
            error: null,
        });
    });

    it('uses layout positions (Position3D objects) for domains', () => {
        const domains = [{ id: 'd1', name: 'Domain 1' }];
        const layout = {
            domains: { 'd1': { x: 100, y: 0, z: 100 } },
            teams: {},
            services: {}
        };
        
        vi.mocked(orgContext.useOrganization).mockReturnValue({ 
            loading: false, 
            domains: domains as any, 
            teams: [],
            services: [],
            layout: layout as any,
            error: null,
            renderedPositions: {},
            registerServicePosition: vi.fn()
        });

        vi.mocked(useProgLoad.useProgressiveLoad).mockImplementation(() => {});

        render(<CityLayout />);
        
        const domainElement = screen.getByTestId('domain');
        expect(domainElement).toHaveTextContent('Domain 1');
        expect(domainElement).toHaveAttribute('data-position', '100,0,100');
    });

    it('handles missing layout gracefully with fallback position', () => {
        const domains = [{ id: 'd1', name: 'Domain 1' }];
        const layout = {
            domains: {},
            teams: {},
            services: {}
        };
        
        vi.mocked(orgContext.useOrganization).mockReturnValue({ 
            loading: false, 
            domains: domains as any, 
            teams: [],
            services: [],
            layout: layout as any,
            error: null,
            renderedPositions: {},
            registerServicePosition: vi.fn()
        });

        vi.mocked(useProgLoad.useProgressiveLoad).mockImplementation(() => {});

        render(<CityLayout />);
        
        const domainElement = screen.getByTestId('domain');
        expect(domainElement).toHaveAttribute('data-position', '0,0,0');
    });

    it('renders with fallback when layout is null', () => {
        const domains = [
            { id: 'd1', name: 'Domain 1' },
            { id: 'd2', name: 'Domain 2' }
        ];
        
        vi.mocked(orgContext.useOrganization).mockReturnValue({ 
            loading: false, 
            domains: domains as any, 
            teams: [],
            services: [],
            layout: null,
            error: null,
            renderedPositions: {},
            registerServicePosition: vi.fn()
        });

        vi.mocked(useProgLoad.useProgressiveLoad).mockImplementation(() => {});

        render(<CityLayout />);
        
        // Should render domains with default positions
        const domainElements = screen.getAllByTestId('domain');
        expect(domainElements).toHaveLength(2);
        expect(domainElements[0]).toHaveAttribute('data-position', '0,0,0');
        expect(domainElements[1]).toHaveAttribute('data-position', '0,0,0');
    });

    it('passes domain health to Domain components when metrics mode is enabled', () => {
        const domains = [{ id: 'd1', name: 'Domain 1' }];

        vi.mocked(orgContext.useOrganization).mockReturnValue({
            loading: false,
            domains: domains as any,
            teams: [],
            services: [],
            layout: null,
            error: null,
            renderedPositions: {},
            registerServicePosition: vi.fn(),
        });
        vi.mocked(useProgLoad.useProgressiveLoad).mockImplementation(() => {});
        vi.mocked(domainHealthHook.useDomainHealth).mockReturnValue({
            domainHealthMap: {
                d1: {
                    domainId: 'd1',
                    score: 0.33,
                    status: 'fragile',
                    components: {
                        couplingRatio: 0.5,
                        centralizationFactor: 0.4,
                        avgBlastRadius: 0.7,
                    },
                    serviceCount: 3,
                },
            },
            loading: false,
            error: null,
        });

        render(<CityLayout />);

        expect(screen.getByTestId('domain')).toHaveAttribute('data-health-status', 'fragile');
    });
});
