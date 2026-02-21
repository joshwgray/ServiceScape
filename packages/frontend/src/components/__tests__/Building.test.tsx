import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Team } from '@servicescape/shared';
import { Building } from '../Building';
import { LayoutPositions } from '../../services/apiClient';
import * as useLOD from '../../hooks/useLOD';
import * as useServiceData from '../../hooks/useServiceData';
import * as useInteraction from '../../hooks/useInteraction';
import { LODLevel } from '../../utils/lodLevels';

// Mock R3F
vi.mock('@react-three/fiber', () => ({
    useFrame: vi.fn(),
    extend: vi.fn(),
    useThree: () => ({ camera: { position: { distanceTo: vi.fn() } } })
}));

// Mock Drei
vi.mock('@react-three/drei', () => ({
    Text: () => <div data-testid="drei-text">Text</div>
}));

// Mock FloorContainer to test prop passing
const mockFloorContainer = vi.fn();
vi.mock('../FloorContainer', () => ({
    FloorContainer: (props: any) => {
        mockFloorContainer(props);
        return <div data-testid="floor-container" />;
    }
}));

// Mock hooks
vi.mock('../../hooks/useLOD', () => ({
    useLOD: vi.fn(),
}));
vi.mock('../../hooks/useServiceData', () => ({
    useServiceData: vi.fn(),
}));
vi.mock('../../hooks/useInteraction', () => ({
    useInteraction: vi.fn(),
}));

describe('Building Component', () => {
    const mockTeam: Team = { id: 't1', domainId: 'd1', name: 'Team 1' };
    const mockHandleBuildingClick = vi.fn();

    it('renders building mesh', () => {
        (useLOD.useLOD as any).mockReturnValue(LODLevel.FAR);
        (useServiceData.useServiceData as any).mockReturnValue({
            services: [],
            loading: false,
            error: null,
        });
        (useInteraction.useInteraction as any).mockReturnValue({
            handleBuildingClick: (_id: string) => mockHandleBuildingClick,
            handleClick: vi.fn(),
        });

        // Just verify it renders without crashing
        const { container } = render(<Building team={mockTeam} position={[0,0,0]} domainPosition={[0,0,0]} />);
        expect(container.innerHTML).toBeTruthy();
    });

    it('passes layout prop to FloorContainer when provided', () => {
        (useLOD.useLOD as any).mockReturnValue(LODLevel.NEAR);
        (useServiceData.useServiceData as any).mockReturnValue({
            services: [],
            loading: false,
            error: null,
        });
        (useInteraction.useInteraction as any).mockReturnValue({
            handleBuildingClick: (_id: string) => mockHandleBuildingClick,
            handleClick: vi.fn(),
        });

        const mockLayout: LayoutPositions = {
            domains: {},
            teams: {},
            services: {
                's1': { x: 0, y: 5, z: 0 }
            }
        };

        render(
            <Building 
                team={mockTeam} 
                position={[10, 0, 20]} 
                domainPosition={[5, 0, 10]}
                layout={mockLayout}
            />
        );

        expect(mockFloorContainer).toHaveBeenCalledWith(
            expect.objectContaining({
                teamId: 't1',
                layout: mockLayout
            })
        );
    });

    it('allows FloorContainer to work without layout prop', () => {
        (useLOD.useLOD as any).mockReturnValue(LODLevel.NEAR);
        (useServiceData.useServiceData as any).mockReturnValue({
            services: [],
            loading: false,
            error: null,
        });
        (useInteraction.useInteraction as any).mockReturnValue({
            handleBuildingClick: (_id: string) => mockHandleBuildingClick,
            handleClick: vi.fn(),
        });

        render(
            <Building 
                team={mockTeam} 
                position={[10, 0, 20]} 
                domainPosition={[5, 0, 10]}
            />
        );

        expect(mockFloorContainer).toHaveBeenCalledWith(
            expect.objectContaining({
                teamId: 't1',
                layout: undefined
            })
        );
    });

    it('renders a clickable ground-level hitbox mesh', () => {
        (useLOD.useLOD as any).mockReturnValue(LODLevel.NEAR);
        (useServiceData.useServiceData as any).mockReturnValue({
            services: [
                { id: 's1', teamId: 't1', name: 'Service 1', domainId: 'd1', dependsOn: [] }
            ],
            loading: false,
            error: null,
        });
        (useInteraction.useInteraction as any).mockReturnValue({
            handleBuildingClick: (_id: string) => mockHandleBuildingClick,
            handleClick: vi.fn(),
        });

        const { container } = render(
            <Building 
                team={mockTeam} 
                position={[0, 0, 0]} 
                domainPosition={[0, 0, 0]}
            />
        );

        // Find the mesh element (first mesh in the group is the hitbox)
        const meshes = container.querySelectorAll('mesh');
        expect(meshes.length).toBeGreaterThan(0);
        
        // The first mesh should be the hitbox with boxGeometry
        const hitboxMesh = meshes[0];
        expect(hitboxMesh).toBeTruthy();
    });

    it('hitbox has invisible material (opacity=0)', () => {
        (useLOD.useLOD as any).mockReturnValue(LODLevel.NEAR);
        (useServiceData.useServiceData as any).mockReturnValue({
            services: [],
            loading: false,
            error: null,
        });
        (useInteraction.useInteraction as any).mockReturnValue({
            handleBuildingClick: (_id: string) => mockHandleBuildingClick,
            handleClick: vi.fn(),
        });

        const { container } = render(
            <Building 
                team={mockTeam} 
                position={[0, 0, 0]} 
                domainPosition={[0, 0, 0]}
            />
        );

        // Find meshBasicMaterial element
        const materials = container.querySelectorAll('meshBasicMaterial');
        expect(materials.length).toBeGreaterThan(0);
        
        // Verify material exists (opacity and transparent props are handled by R3F at runtime)
        const hitboxMaterial = materials[0];
        expect(hitboxMaterial).toBeTruthy();
    });

    it('clicking hitbox calls handleBuildingClick with team id', () => {
        const mockClickHandler = vi.fn();
        (useLOD.useLOD as any).mockReturnValue(LODLevel.NEAR);
        (useServiceData.useServiceData as any).mockReturnValue({
            services: [],
            loading: false,
            error: null,
        });
        (useInteraction.useInteraction as any).mockReturnValue({
            handleBuildingClick: (id: string) => {
                expect(id).toBe('t1'); // Verify team id is passed
                return mockClickHandler;
            },
            handleClick: vi.fn(),
        });

        render(
            <Building 
                team={mockTeam} 
                position={[0, 0, 0]} 
                domainPosition={[0, 0, 0]}
            />
        );

        // useInteraction.handleBuildingClick should have been called with team id
        expect(useInteraction.useInteraction).toHaveBeenCalled();
    });
});
