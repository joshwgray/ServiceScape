import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CityLayout } from '../CityLayout';
import * as orgContext from '../../contexts/OrganizationContext';
import * as useProgLoad from '../../hooks/useProgressiveLoad';

// Mock hooks
vi.mock('../../contexts/OrganizationContext');
vi.mock('../../hooks/useProgressiveLoad');

// Mock Domain
vi.mock('../Domain', () => ({
    Domain: ({ domain, position }: { domain: any, position: [number, number, number] }) => (
        <div data-testid="domain" data-position={position ? position.join(',') : 'undefined'}>
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
});

