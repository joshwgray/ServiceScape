import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Domain as DomainType, Team, Service } from '@servicescape/shared';
import { Domain } from '../../components/Domain';
import { Building } from '../../components/Building';
import { ServiceFloor } from '../../components/ServiceFloor';
import * as useLOD from '../../hooks/useLOD';
import * as useServiceData from '../../hooks/useServiceData';
import * as useInteraction from '../../hooks/useInteraction';
import * as useAnimatedOpacity from '../../hooks/useAnimatedOpacity';
import * as useOrganization from '../../contexts/OrganizationContext';
import { LODLevel } from '../../utils/lodLevels';
import { labelStyles } from '../../utils/labelStyles.js';

// Mock R3F
vi.mock('@react-three/fiber', () => ({
    useFrame: vi.fn(),
    extend: vi.fn(),
    useThree: () => ({ camera: { position: { distanceTo: vi.fn(() => 50) } } })
}));

// Mock Drei Text to capture props
const mockTextComponents: Array<{ fontSize: number; outlineWidth?: number; outlineColor?: string; position: [number, number, number] }> = [];

vi.mock('@react-three/drei', () => ({
    Text: (props: any) => {
        mockTextComponents.push({
            fontSize: props.fontSize,
            outlineWidth: props.outlineWidth,
            outlineColor: props.outlineColor,
            position: props.position
        });
        return <div data-testid="drei-text">{props.children}</div>;
    }
}));

// Mock other components
vi.mock('../../components/FloorContainer', () => ({
    FloorContainer: () => <div data-testid="floor-container" />
}));

vi.mock('../../components/LegoBaseplate', () => ({
    LegoBaseplate: () => <div data-testid="lego-baseplate" />
}));

vi.mock('../../components/LegoBrick', () => ({
    LegoBrick: () => <div data-testid="lego-brick" />
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

vi.mock('../../hooks/useAnimatedOpacity', () => ({
    useAnimatedOpacity: vi.fn(),
}));

vi.mock('../../contexts/OrganizationContext', () => ({
    useOrganization: vi.fn(),
}));

// Mock stores
vi.mock('../../stores/selectionStore', () => ({
    useSelectionStore: vi.fn(() => null)
}));

vi.mock('../../stores/visibilityStore', () => ({
    useVisibilityStore: vi.fn(() => true)
}));

// Mock apiClient to prevent network calls
vi.mock('../../services/apiClient', () => ({
    getTeams: vi.fn(() => Promise.resolve([])),
    getServices: vi.fn(() => Promise.resolve([])),
}));

describe('Label Styling and Hierarchy', () => {
    beforeEach(() => {
        mockTextComponents.length = 0;
        (useLOD.useLOD as any).mockReturnValue(LODLevel.MEDIUM);
        (useServiceData.useServiceData as any).mockReturnValue({
            services: [],
            loading: false,
            error: null,
        });
        (useInteraction.useInteraction as any).mockReturnValue({
            handleBuildingClick: vi.fn(() => vi.fn()),
            handleClick: vi.fn(() => vi.fn()),
            handlePointerOver: vi.fn(() => vi.fn()),
            handlePointerOut: vi.fn(),
            hoveredId: null,
        });
        (useAnimatedOpacity.useAnimatedOpacity as any).mockReturnValue(1.0);
        (useOrganization.useOrganization as any).mockReturnValue({
            layout: { domains: {}, teams: {}, services: {} },
            teams: [],
            registerServicePosition: vi.fn(),
        });
    });

    describe('Font Size Hierarchy', () => {
        it('domain labels have larger font size than building labels', () => {
            const mockDomain: DomainType = { id: 'd1', name: 'Domain 1' };
            const mockTeam: Team = { id: 't1', domainId: 'd1', name: 'Team 1' };

            mockTextComponents.length = 0;
            render(<Domain domain={mockDomain} position={[0, 0, 0]} />);
            const domainFontSize = mockTextComponents[0]?.fontSize;

            mockTextComponents.length = 0;
            render(<Building team={mockTeam} position={[0, 0, 0]} domainPosition={[0, 0, 0]} />);
            const buildingFontSize = mockTextComponents[0]?.fontSize;

            expect(domainFontSize).toBeGreaterThan(buildingFontSize);
            expect(domainFontSize).toBe(labelStyles.domain.fontSize);
        });

        it('building labels have larger font size than service labels', () => {
            const mockTeam: Team = { id: 't1', domainId: 'd1', name: 'Team 1' };
            const mockService: Service = {
                id: 's1',
                teamId: 't1',
                name: 'Service 1',
                description: ''
            };

            mockTextComponents.length = 0;
            render(<Building team={mockTeam} position={[0, 0, 0]} domainPosition={[0, 0, 0]} />);
            const buildingFontSize = mockTextComponents[0]?.fontSize;

            mockTextComponents.length = 0;
            render(<ServiceFloor service={mockService} position={[0, 0, 0]} />);
            const serviceFontSize = mockTextComponents[0]?.fontSize;

            expect(buildingFontSize).toBeGreaterThan(serviceFontSize);
            expect(buildingFontSize).toBe(labelStyles.building.fontSize);
        });
    });

    describe('Label Outlines for Contrast', () => {
        it('all labels have white outline for contrast', () => {
            const mockDomain: DomainType = { id: 'd1', name: 'Domain 1' };
            const mockTeam: Team = { id: 't1', domainId: 'd1', name: 'Team 1' };
            const mockService: Service = {
                id: 's1',
                teamId: 't1',
                name: 'Service 1',
                description: ''
            };

            // Test domain label
            mockTextComponents.length = 0;
            render(<Domain domain={mockDomain} position={[0, 0, 0]} />);
            expect(mockTextComponents[0]?.outlineWidth).toBeGreaterThan(0);
            expect(mockTextComponents[0]?.outlineColor).toBe('white');

            // Test building label
            mockTextComponents.length = 0;
            render(<Building team={mockTeam} position={[0, 0, 0]} domainPosition={[0, 0, 0]} />);
            expect(mockTextComponents[0]?.outlineWidth).toBeGreaterThan(0);
            expect(mockTextComponents[0]?.outlineColor).toBe('white');

            // Test service label
            mockTextComponents.length = 0;
            render(<ServiceFloor service={mockService} position={[0, 0, 0]} />);
            expect(mockTextComponents[0]?.outlineWidth).toBeGreaterThan(0);
            expect(mockTextComponents[0]?.outlineColor).toBe('white');
        });
    });

    describe('Service Label Positioning', () => {
        it('service labels positioned off brick face to avoid z-fighting', () => {
            const mockService: Service = {
                id: 's1',
                teamId: 't1',
                name: 'Service 1',
                description: ''
            };

            mockTextComponents.length = 0;
            render(<ServiceFloor service={mockService} position={[0, 0, 0]} height={1} />);
            
            const labelPosition = mockTextComponents[0]?.position;
            expect(labelPosition).toBeDefined();
            expect(labelPosition[2]).toBeGreaterThan(0.9); // Should be positioned off the brick face (z >= 0.95)
        });
    });

    describe('Label Styles Configuration', () => {
        it('label styles export correct hierarchy values', () => {
            expect(labelStyles.domain.fontSize).toBe(0.8);
            expect(labelStyles.domain.outlineWidth).toBe(0.02);
            expect(labelStyles.domain.outlineColor).toBe('white');

            expect(labelStyles.building.fontSize).toBe(0.5);
            expect(labelStyles.building.outlineWidth).toBe(0.015);
            expect(labelStyles.building.outlineColor).toBe('white');

            expect(labelStyles.service.fontSize).toBe(0.3);
            expect(labelStyles.service.outlineWidth).toBe(0.01);
            expect(labelStyles.service.outlineColor).toBe('white');
            expect(labelStyles.service.zOffset).toBe(0.95);
        });
    });

    describe('LOD-Specific Label Rendering', () => {
        it('service labels are visible at MEDIUM LOD', () => {
            const mockService: Service = {
                id: 's1',
                teamId: 't1',
                name: 'Service at Medium LOD',
                description: ''
            };

            // Set LOD to MEDIUM
            (useLOD.useLOD as any).mockReturnValue(LODLevel.MEDIUM);

            mockTextComponents.length = 0;
            render(<ServiceFloor service={mockService} position={[0, 0, 0]} height={1} />);
            
            // Verify that label was rendered at MEDIUM LOD
            expect(mockTextComponents.length).toBeGreaterThan(0);
            expect(mockTextComponents[0]?.fontSize).toBe(labelStyles.service.fontSize);
        });

        it('service labels are visible at NEAR LOD', () => {
            const mockService: Service = {
                id: 's2',
                teamId: 't1',
                name: 'Service at Near LOD',
                description: ''
            };

            // Set LOD to NEAR
            (useLOD.useLOD as any).mockReturnValue(LODLevel.NEAR);

            mockTextComponents.length = 0;
            render(<ServiceFloor service={mockService} position={[0, 0, 0]} height={1} />);
            
            // Verify that label was rendered at NEAR LOD
            expect(mockTextComponents.length).toBeGreaterThan(0);
            expect(mockTextComponents[0]?.fontSize).toBe(labelStyles.service.fontSize);
        });
    });
});
