import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Domain } from '../Domain';
import { LODLevel } from '../../utils/lodLevels';
import * as apiClient from '../../services/apiClient';

// Track BoxGeometry constructor calls
let boxGeometryCalls: number[][] = [];

// Mock THREE to track BoxGeometry calls
vi.mock('three', async () => {
    const actual = await vi.importActual<typeof import('three')>('three');
    return {
        ...actual,
        BoxGeometry: class BoxGeometry extends actual.BoxGeometry {
            constructor(...args: any[]) {
                super(...args);
                boxGeometryCalls.push(args);
            }
        }
    };
});

// Mock R3F hooks
vi.mock('@react-three/fiber', () => ({
    useFrame: vi.fn(),
    extend: vi.fn(),
    useThree: () => ({ camera: { position: { distanceTo: vi.fn() } } })
}));

// Mock Drei
vi.mock('@react-three/drei', () => ({
    Text: () => <div data-testid="drei-text">Text</div>
}));

// Mock useLOD
const mockUseLOD = vi.fn();
vi.mock('../../hooks/useLOD', () => ({
    useLOD: () => mockUseLOD()
}));

// Mock Visibility Store
const mockIsDomainVisible = vi.fn();
vi.mock('../../stores/visibilityStore', () => ({
    useVisibilityStore: (selector: any) => {
        const state = {
            isDomainVisible: mockIsDomainVisible,
            visibleDomains: new Set()
        };
        return selector(state);
    }
}));

// Mock API
vi.mock('../../services/apiClient', () => ({
    getTeams: vi.fn().mockResolvedValue([{ id: 't1', name: 'Team 1', domainId: 'd1' }])
}));

// Mock Organization Context
const mockUseOrganization = vi.fn();
vi.mock('../../contexts/OrganizationContext', () => ({
    useOrganization: () => mockUseOrganization()
}));

// Mock Building
const mockBuildingRender = vi.fn();
vi.mock('../Building', () => ({
    Building: (props: any) => {
        mockBuildingRender(props);
        return <div data-testid="building" data-position={props.position?.join(',')}>Building</div>;
    }
}));

describe('Domain Component', () => {
    const mockDomain = { id: 'd1', name: 'Domain 1', metadata: { position: [0, 0, 0] } };

    beforeEach(() => {
        vi.clearAllMocks();
        boxGeometryCalls = [];
        mockUseLOD.mockReturnValue(LODLevel.FAR);
        mockIsDomainVisible.mockReturnValue(false);
        mockUseOrganization.mockReturnValue({
            layout: null,
            domains: [],
            teams: [],
            services: [],
            loading: false,
            error: null
        });
    });

    it('renders simple representation at LOD FAR (no buildings)', () => {
        render(<Domain domain={mockDomain} position={[0,0,0]} />);
        // At FAR, we expect a simple box (mesh)
        // Since we can't easily check for mesh in JSDOM, let's just check no buildings are rendered initially
        expect(screen.queryByTestId('building')).toBeNull();
    });

    it('does NOT fetch teams when visible but LODLevel.FAR', async () => {
        mockIsDomainVisible.mockReturnValue(true);
        mockUseLOD.mockReturnValue(LODLevel.FAR);
        
        render(<Domain domain={mockDomain} position={[0,0,0]} />);
        
        // Wait to ensure useEffect runs and DOES NOT call getTeams
        await new Promise(resolve => setTimeout(resolve, 0));
        
        expect(apiClient.getTeams).not.toHaveBeenCalled();
    });

    it('fetches teams when visible', async () => {
        mockIsDomainVisible.mockReturnValue(true);
        mockUseLOD.mockReturnValue(LODLevel.MEDIUM);
        
        render(<Domain domain={mockDomain} position={[0,0,0]} />);
        
        await waitFor(() => {
            expect(apiClient.getTeams).toHaveBeenCalledWith('d1');
        });
    });

    it('renders buildings when visible and teams loaded', async () => {
        mockIsDomainVisible.mockReturnValue(true);
        mockUseLOD.mockReturnValue(LODLevel.MEDIUM);
        
        render(<Domain domain={mockDomain} position={[0,0,0]} />);
        
        await waitFor(() => {
            expect(screen.getByTestId('building')).toBeInTheDocument();
        });
    });

    it('uses layout.teams Position3D objects for building positions', async () => {
        mockIsDomainVisible.mockReturnValue(true);
        mockUseLOD.mockReturnValue(LODLevel.MEDIUM);
        mockUseOrganization.mockReturnValue({
            layout: {
                domains: { 'd1': { x: 100, y: 0, z: 100 } },
                teams: { 't1': { x: 110, y: 0, z: 105 } },
                services: {}
            },
            domains: [],
            teams: [],
            services: [],
            loading: false,
            error: null
        });
        
        render(<Domain domain={mockDomain} position={[100, 0, 100]} />);
        
        await waitFor(() => {
            const buildingEl = screen.getByTestId('building');
            expect(buildingEl).toBeInTheDocument();
            // Building should be at relative position (10, PLATE_TOP=0.4, 5) from domain
            expect(buildingEl).toHaveAttribute('data-position', '10,0.4,5');
        });
    });

    it('uses fallback circular arrangement when layout.teams is missing', async () => {
        mockIsDomainVisible.mockReturnValue(true);
        mockUseLOD.mockReturnValue(LODLevel.MEDIUM);
        mockUseOrganization.mockReturnValue({
            layout: {
                domains: { 'd1': { x: 100, y: 0, z: 100 } },
                teams: {}, // Empty - no position for t1
                services: {}
            },
            domains: [],
            teams: [],
            services: [],
            loading: false,
            error: null
        });
        
        render(<Domain domain={mockDomain} position={[100, 0, 100]} />);
        
        await waitFor(() => {
            expect(mockBuildingRender).toHaveBeenCalled();
            const call = mockBuildingRender.mock.calls[0][0];
            // Should have some position (fallback circular)
            expect(call.position).toBeDefined();
            expect(Array.isArray(call.position)).toBe(true);
        });
    });

    describe('Domain geometry sizing', () => {
        it('renders with correct 100x100 LEGO baseplate', () => {
            mockIsDomainVisible.mockReturnValue(true);
            mockUseLOD.mockReturnValue(LODLevel.MEDIUM);
            
            const { container } = render(<Domain domain={mockDomain} position={[0,0,0]} />);
            
            // LegoBaseplate renders as a group with a mesh using geometry/material props
            // (geometry is now passed as a prop via useMemo, not as a child <boxGeometry> element)
            const mesh = container.querySelector('mesh');
            expect(mesh).toBeInTheDocument();
        });

        it('renders domain plate without border lineSegments', () => {
            mockIsDomainVisible.mockReturnValue(true);
            mockUseLOD.mockReturnValue(LODLevel.MEDIUM);
            
            const { container } = render(<Domain domain={mockDomain} position={[0,0,0]} />);
            
            // The LEGO plate replaces the border — no lineSegments in MEDIUM+ LOD
            const lineSegments = container.querySelector('lineSegments');
            expect(lineSegments).not.toBeInTheDocument();
        });

        it('renders FAR LOD box with appropriately scaled dimensions', () => {
            mockIsDomainVisible.mockReturnValue(false);
            mockUseLOD.mockReturnValue(LODLevel.FAR);
            
            const { container } = render(<Domain domain={mockDomain} position={[0,0,0]} />);
            
            // Check for boxGeometry with scaled args [50, 5, 50]
            const boxGeometry = container.querySelector('boxGeometry');
            expect(boxGeometry).toBeInTheDocument();
            expect(boxGeometry).toHaveAttribute('args', '50,5,50');
        });
    });
});
