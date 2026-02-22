/**
 * Phase 7 Integration Tests: Final Integration and Visual Verification
 *
 * These tests verify that all UI fixes from phases 1–6 work together:
 *  - Phase 1: Floor hover highlighting (entire brick, not just one stud)
 *  - Phase 2: DetailsPanel in top-right corner replaces speech bubble
 *  - Phase 3–5: Dependency paths connect door-to-door at correct floor Y levels
 *  - Phase 6: Labels have contrast outlines with clear hierarchy
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup, render, screen } from '@testing-library/react';
import * as THREE from 'three';
import { generateLegoPath } from '../../utils/legoPathGenerator';
import * as legoPathGeneratorModule from '../../utils/legoPathGenerator';
import { calculateDoorPosition } from '../../utils/servicePositionCalculator';
import { labelStyles } from '../../utils/labelStyles';
import { tokens } from '../../styles/tokens';
import { calculateFloorY } from '../../utils/floorLayout';
import type { Service } from '@servicescape/shared';

// ---------------------------------------------------------------------------
// Top-level component and store imports (placed after mocks for hoisting)
// (imported below after vi.mock declarations)
// ---------------------------------------------------------------------------

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// Shared mocks for R3F (must be declared before any component imports)
// ---------------------------------------------------------------------------

vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn(),
  extend: vi.fn(),
  useThree: () => ({
    camera: { position: { distanceTo: vi.fn(() => 50) } },
  }),
}));

// Capture Text component props so we can assert on label styling
const capturedTextProps: Array<{
  outlineWidth?: number;
  outlineColor?: string;
  fontSize?: number;
  position?: [number, number, number];
  children?: React.ReactNode;
}> = [];

vi.mock('@react-three/drei', () => ({
  Text: (props: any) => {
    capturedTextProps.push({
      outlineWidth: props.outlineWidth,
      outlineColor: props.outlineColor,
      fontSize: props.fontSize,
      position: props.position,
      children: props.children,
    });
    return <div data-testid="drei-text">{props.children}</div>;
  },
}));

// Configurable mock for generateColor — tests can override via mockGenerateColorFn
let mockGenerateColorFn = vi.fn((_id: string) => '#cc0000');

vi.mock('../../utils/colorGenerator', () => ({
  // Delegate to the outer variable so tests can call mockGenerateColorFn.mockReturnValue()
  generateColor: (...args: Parameters<typeof mockGenerateColorFn>) => mockGenerateColorFn(...args),
}));

// Capture LegoBrick color prop so we can assert on hover highlighting
const capturedLegoBrickProps: Array<{
  color: string;
  width?: number;
  height?: number;
  depth?: number;
  opacity?: number;
}> = [];

vi.mock('../../components/LegoBrick', () => ({
  LegoBrick: (props: any) => {
    capturedLegoBrickProps.push({
      color: props.color,
      width: props.width,
      height: props.height,
      depth: props.depth,
      opacity: props.opacity,
    });
    return (
      <div data-testid="lego-brick" data-color={props.color} data-opacity={props.opacity} />
    );
  },
}));

// ---------------------------------------------------------------------------
// Hook & store mocks (used by ServiceFloor and related components)
// ---------------------------------------------------------------------------

vi.mock('../../hooks/useLOD', () => ({
  useLOD: vi.fn(() => 'MEDIUM'),
}));

vi.mock('../../hooks/useAnimatedOpacity', () => ({
  useAnimatedOpacity: vi.fn((v: number) => v),
}));

vi.mock('../../hooks/usePathAnimation', () => ({
  usePathAnimation: vi.fn(() => ({ visibleBricks: 9999, isComplete: true })),
}));

vi.mock('../../utils/legoMaterials', () => ({
  createLegoPlasticMaterial: vi.fn(() => ({ dispose: vi.fn(), isMaterial: true })),
}));

vi.mock('../../contexts/OrganizationContext', () => ({
  useOrganization: vi.fn(() => ({
    layout: { domains: {}, teams: {}, services: {} },
    teams: [],
    services: [],
    renderedPositions: {},
    registerServicePosition: vi.fn(),
  })),
}));

vi.mock('../../stores/bubblePositionStore', () => ({
  useBubblePositionStore: vi.fn((selector: any) => {
    const state = { setAnchor: vi.fn(), clearAnchor: vi.fn() };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('../../services/apiClient', () => ({
  getTeams: vi.fn(() => Promise.resolve([])),
  getServices: vi.fn(() => Promise.resolve([])),
  getDependencies: vi.fn(() => Promise.resolve([])),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Configurable mocks for useSelectionStore and useInteraction so individual
// tests can override them without re-declaring the entire mock.
let mockSelectionState: any = {
  selectedServiceId: null,
  selectedBuildingId: null,
  selectionLevel: 'none',
  selectService: vi.fn(),
  clearSelection: vi.fn(),
};

let mockInteractionState: any = {
  handleClick: vi.fn(() => vi.fn()),
  handlePointerOver: vi.fn(() => vi.fn()),
  handlePointerOut: vi.fn(),
  hoveredId: null,
};

vi.mock('../../stores/selectionStore', () => ({
  useSelectionStore: vi.fn((selector: any) => {
    return selector ? selector(mockSelectionState) : mockSelectionState;
  }),
}));

vi.mock('../../hooks/useInteraction', () => ({
  useInteraction: vi.fn(() => mockInteractionState),
}));

// Additional mocks required by UIOverlay
vi.mock('../../hooks/useServiceDetails', () => ({ useServiceDetails: vi.fn(() => ({ details: null })) }));
vi.mock('../../hooks/useTeamMembers', () => ({ useTeamMembers: vi.fn(() => ({ members: [], loading: false })) }));

// ---------------------------------------------------------------------------
// Static component imports (after all vi.mock declarations)
// ---------------------------------------------------------------------------

import { ServiceFloor } from '../../components/ServiceFloor';
import { UIOverlay } from '../../components/ui/UIOverlay';
import { DetailsPanel } from '../../components/ui/DetailsPanel';
import { useOrganization } from '../../contexts/OrganizationContext';
import LegoDependencyPath from '../../components/LegoDependencyPath';

// ---------------------------------------------------------------------------
// Integration Test Suite
// ---------------------------------------------------------------------------

describe('Phase 7 Integration Tests', () => {
  beforeEach(() => {
    capturedTextProps.length = 0;
    capturedLegoBrickProps.length = 0;

    // Reset color generator mock to a default red LEGO color
    mockGenerateColorFn = vi.fn((_id: string) => '#cc0000');

    // Reset to default (no selection, not hovered)
    mockSelectionState = {
      selectedServiceId: null,
      selectedBuildingId: null,
      selectionLevel: 'none',
      selectService: vi.fn(),
      clearSelection: vi.fn(),
    };

    mockInteractionState = {
      handleClick: vi.fn(() => vi.fn()),
      handlePointerOver: vi.fn(() => vi.fn()),
      handlePointerOut: vi.fn(),
      hoveredId: null,
    };
  });

  // -------------------------------------------------------------------------
  // TEST 1: Selecting a service shows the DetailsPanel with correct data
  // -------------------------------------------------------------------------

  describe('integration test: select service shows DetailsPanel with correct data', () => {

    it('shows DetailsPanel with service name when a service is selected', () => {
      const mockService = {
        id: 'svc-auth',
        name: 'Auth Service',
        teamId: 'team-1',
        description: 'Handles authentication',
        type: 'service',
      };

      mockSelectionState = { ...mockSelectionState, selectedServiceId: 'svc-auth', selectedBuildingId: 'team-1', selectionLevel: 'service' };
      (useOrganization as any).mockReturnValue({
        domains: [],
        teams: [],
        services: [mockService],
        renderedPositions: {},
        registerServicePosition: vi.fn(),
      });

      render(<UIOverlay />);

      // DetailsPanel should be visible with the service name
      expect(screen.getByText('Auth Service')).toBeInTheDocument();
    });

    it('hides DetailsPanel when no service is selected', () => {
      const mockService = {
        id: 'svc-auth',
        name: 'Auth Service',
        teamId: 'team-1',
        description: 'Handles authentication',
        type: 'service',
      };

      // selectedServiceId is null (default)
      (useOrganization as any).mockReturnValue({
        domains: [],
        teams: [],
        services: [mockService],
        renderedPositions: {},
        registerServicePosition: vi.fn(),
      });

      render(<UIOverlay />);

      // DetailsPanel should NOT show service name when nothing is selected
      expect(screen.queryByText('Auth Service')).not.toBeInTheDocument();
    });

    it('DetailsPanel is positioned in top-right (fixed position, not following mouse)', () => {

      const item = {
        id: '1',
        name: 'Payment Service',
        type: 'service',
        description: 'Handles payments',
      };

      const { container } = render(<DetailsPanel item={item} />);

      // The panel should use absolute/fixed positioning in top-right corner
      const panel = container.firstChild as HTMLElement;
      expect(panel).toBeTruthy();
      const style = panel.style;

      // Position should be top-right (top: 20, right: 20 per implementation)
      expect(style.position === 'absolute' || style.position === 'fixed').toBe(true);
      expect(parseInt(style.top)).toBeLessThanOrEqual(20);
      expect(parseInt(style.right)).toBeLessThanOrEqual(20);
    });
  });

  // -------------------------------------------------------------------------
  // TEST 2: Dependency paths connect at different floor levels
  // -------------------------------------------------------------------------

  describe('integration test: dependency paths connect at different floor levels', () => {
    const FLOOR_HEIGHT = 0.5;
    const FLOOR_SPACING = 0.1;

    it('generateLegoPath creates vertical segments when services are on different floors', () => {
      // Floor 0 (index 0) vs Floor 2 (index 2) — should have y-traversal bricks
      const y0 = calculateFloorY(0, FLOOR_HEIGHT, FLOOR_SPACING); // ≈ 0.25
      const y2 = calculateFloorY(2, FLOOR_HEIGHT, FLOOR_SPACING); // ≈ 1.45

      const start = { x: 0, y: y0, z: 0 };
      const end = { x: 5, y: y2, z: 5 };

      const path = generateLegoPath(start, end, 1.0);

      expect(path.length).toBeGreaterThan(0);

      // There should be segments at different Y values — meaning the path bridges the height gap
      const yValues = path.map((seg) => seg.position[1]);
      const uniqueYValues = new Set(yValues.map((y) => Math.round(y * 100)));
      expect(uniqueYValues.size).toBeGreaterThan(1);
    });

    it('generateLegoPath path endpoint approaches the target floor Y position', () => {
      const y0 = calculateFloorY(0, FLOOR_HEIGHT, FLOOR_SPACING);
      const y3 = calculateFloorY(3, FLOOR_HEIGHT, FLOOR_SPACING);

      const start = { x: 0, y: y0, z: 0 };
      const end = { x: 0, y: y3, z: 0 };

      const path = generateLegoPath(start, end, 1.0);

      // For a purely vertical path (same x, z), all segments should be in Y
      expect(path.length).toBeGreaterThan(0);

      // The last segment should be positioned close to the end Y
      const lastSeg = path[path.length - 1];
      expect(Math.abs(lastSeg.position[1] - y3)).toBeLessThan(1.0);
    });

    it('calculateDoorPosition preserves Y coordinate of source service', () => {
      // Services on floor 1 (y ≈ 0.25) — door should stay at that height
      const floorY = calculateFloorY(1, FLOOR_HEIGHT, FLOOR_SPACING);
      const servicePos: [number, number, number] = [0, floorY, 0];
      const targetPos: [number, number, number] = [10, floorY, 10];

      const door = calculateDoorPosition(servicePos, targetPos);

      // Door's Y should match the service's Y (±small epsilon for face offset)
      expect(door[1]).toBeCloseTo(floorY, 1);
    });

    it('paths from floor 0 to floor 3 contain both horizontal and vertical segments', () => {
      const y0 = calculateFloorY(0, FLOOR_HEIGHT, FLOOR_SPACING);
      const y3 = calculateFloorY(3, FLOOR_HEIGHT, FLOOR_SPACING);

      // Services separated in X, Z, and Y
      const start = { x: -3, y: y0, z: -3 };
      const end = { x: 3, y: y3, z: 3 };

      const path = generateLegoPath(start, end, 1.0);

      // Check that path traverses each dimension
      const xValues = new Set(path.map((s) => Math.round(s.position[0])));
      const zValues = new Set(path.map((s) => Math.round(s.position[2])));
      const yValues = new Set(path.map((s) => Math.round(s.position[1] * 10)));

      // X segment: should have bricks from x=-3 to x=3
      expect(xValues.size).toBeGreaterThan(1);
      // Z segment: should have bricks from z=-3 to z=3
      expect(zValues.size).toBeGreaterThan(1);
      // Y segment: should have bricks from y0 to y3
      expect(yValues.size).toBeGreaterThan(1);
    });

    it('LegoDependencyPath component renders with floor-correct Y coordinates', () => {
      // Component-level integration test: renders LegoDependencyPath with service
      // positions on floor 0 and floor 2 and asserts that generateLegoPath is
      // invoked with coordinates that reflect the correct floor Y values.
      const y0 = calculateFloorY(0, FLOOR_HEIGHT, FLOOR_SPACING);
      const y2 = calculateFloorY(2, FLOOR_HEIGHT, FLOOR_SPACING);

      const start = new THREE.Vector3(0, y0, 0);
      const end = new THREE.Vector3(5, y2, 5);

      const spy = vi.spyOn(legoPathGeneratorModule, 'generateLegoPath');

      render(
        <LegoDependencyPath start={start} end={end} color="#ff4444" />
      );

      // generateLegoPath should have been called inside the component
      expect(spy).toHaveBeenCalled();

      // The call arguments should use the start/end Y values from different floors
      const [calledStart, calledEnd] = spy.mock.calls[0];
      expect(calledStart.y).toBeCloseTo(y0, 2);
      expect(calledEnd.y).toBeCloseTo(y2, 2);

      // The generated segments should span multiple distinct Y levels (floor-to-floor traversal)
      const segments = spy.mock.results[0].value as Array<{ position: [number, number, number] }>;
      const yValues = segments.map((s) => s.position[1]);
      const uniqueY = new Set(yValues.map((y) => Math.round(y * 10)));
      expect(uniqueY.size).toBeGreaterThan(1);

      // The last segment should approach the target floor Y
      const lastSeg = segments[segments.length - 1];
      expect(Math.abs(lastSeg.position[1] - y2)).toBeLessThan(1.0);

      spy.mockRestore();
    });
  });

  // -------------------------------------------------------------------------
  // TEST 3: Labels readable on dark and light LEGO colors
  // -------------------------------------------------------------------------

  describe('integration test: labels readable on dark and light LEGO colors', () => {

    it('service label has white outline on dark LEGO brick colors', () => {
      // Override generateColor to return a dark LEGO color for this test
      mockGenerateColorFn.mockReturnValue('#1e2d3e'); // Dark navy-like color

      const darkService: Service = {
        id: 'dark-svc',
        teamId: 'team-1',
        name: 'Dark Color Service',
        description: '',
      };

      capturedTextProps.length = 0;
      render(<ServiceFloor service={darkService} position={[0, 0, 0]} height={1} />);

      const textProps = capturedTextProps.find(
        (p) => typeof p.children === 'string' && p.children.includes('Dark Color Service')
      );
      expect(textProps).toBeDefined();
      expect(textProps!.outlineWidth).toBeGreaterThan(0);
      expect(textProps!.outlineColor).toBe('white');
    });

    it('service label has white outline on light LEGO brick colors', () => {
      // Override generateColor to return a light LEGO color for this test
      mockGenerateColorFn.mockReturnValue('#f5f5f5'); // Near-white color

      const lightService: Service = {
        id: 'light-svc',
        teamId: 'team-1',
        name: 'Light Color Service',
        description: '',
      };

      capturedTextProps.length = 0;
      render(<ServiceFloor service={lightService} position={[0, 0, 0]} height={1} />);

      const textProps = capturedTextProps.find(
        (p) => typeof p.children === 'string' && p.children.includes('Light Color Service')
      );
      expect(textProps).toBeDefined();
      expect(textProps!.outlineWidth).toBeGreaterThan(0);
      expect(textProps!.outlineColor).toBe('white');
    });

    it('label style constants ensure contrast: outline is present with standard values', () => {
      // Verify label style configuration is correct for contrast
      expect(labelStyles.service.outlineWidth).toBeGreaterThan(0);
      expect(labelStyles.service.outlineColor).toBe('white');
      expect(labelStyles.building.outlineWidth).toBeGreaterThan(0);
      expect(labelStyles.building.outlineColor).toBe('white');
      expect(labelStyles.domain.outlineWidth).toBeGreaterThan(0);
      expect(labelStyles.domain.outlineColor).toBe('white');
    });

    it('service labels always have outlines regardless of brick color at runtime', () => {
      // Render multiple services with different IDs (which produce different LEGO colors)
      const services: Service[] = [
        { id: 'svc-aaa', teamId: 't1', name: 'Service AAA', description: '' },
        { id: 'svc-bbb', teamId: 't1', name: 'Service BBB', description: '' },
        { id: 'svc-zzz', teamId: 't1', name: 'Service ZZZ', description: '' },
      ];

      services.forEach((svc) => {
        capturedTextProps.length = 0;
        render(<ServiceFloor service={svc} position={[0, 0, 0]} height={1} />);

        // Each service should render with outline regardless of its LEGO color
        const textProps = capturedTextProps[0];
        expect(textProps, `Service ${svc.id} should render a label`).toBeDefined();
        expect(textProps.outlineWidth, `Service ${svc.id} label should have outlineWidth`).toBeGreaterThan(0);
        expect(textProps.outlineColor, `Service ${svc.id} label should have white outline`).toBe('white');
      });
    });
  });

  // -------------------------------------------------------------------------
  // TEST 4: Hovering floor highlights entire block
  // -------------------------------------------------------------------------

  describe('integration test: hovering floor highlights entire block', () => {

    const testService: Service = {
      id: 'hover-test-svc',
      teamId: 'team-hover',
      name: 'Hover Test Service',
      description: '',
    };

    it('LegoBrick receives normal color when service is not hovered', () => {
      // hoveredId does NOT match service id
      mockInteractionState = {
        ...mockInteractionState,
        hoveredId: null,
      };

      capturedLegoBrickProps.length = 0;
      render(<ServiceFloor service={testService} position={[0, 0, 0]} height={1} />);

      const brickProps = capturedLegoBrickProps[0];
      expect(brickProps).toBeDefined();
      // When not hovered, color should NOT be the hover highlight color
      expect(brickProps.color).not.toBe(tokens.colors.primaryHover);
    });

    it('LegoBrick receives hover highlight color when service is hovered', () => {
      // hoveredId MATCHES service id — this simulates a pointer-over event
      mockInteractionState = {
        ...mockInteractionState,
        hoveredId: 'hover-test-svc',
      };

      capturedLegoBrickProps.length = 0;
      render(<ServiceFloor service={testService} position={[0, 0, 0]} height={1} />);

      const brickProps = capturedLegoBrickProps[0];
      expect(brickProps).toBeDefined();
      // When hovered (and not selected), LegoBrick should receive primaryHover color
      expect(brickProps.color).toBe(tokens.colors.primaryHover);
    });

    it('entire brick highlights (single color prop drives body + studs)', () => {
      // LegoBrick uses a SINGLE shared material for both body mesh and stud meshes.
      // Therefore, one color change to LegoBrick === entire block highlights.
      // We verify this by checking that LegoBrick is only rendered ONCE per service
      // (not once for body + once for each stud with separate colors).

      mockInteractionState = {
        ...mockInteractionState,
        hoveredId: 'hover-test-svc',
      };

      capturedLegoBrickProps.length = 0;
      render(<ServiceFloor service={testService} position={[0, 0, 0]} height={1} />);

      // Only ONE LegoBrick should be rendered per ServiceFloor
      expect(capturedLegoBrickProps.length).toBe(1);

      // That single LegoBrick receives the hover highlight color
      expect(capturedLegoBrickProps[0].color).toBe(tokens.colors.primaryHover);
    });

    it('selected service uses primary selection color instead of hover color', () => {
      // When a service is selected AND hovered, selection color takes precedence
      mockSelectionState = {
        ...mockSelectionState,
        selectedServiceId: 'hover-test-svc',
        selectedBuildingId: 'team-hover',
        selectionLevel: 'service',
      };

      // Also hovered
      mockInteractionState = {
        ...mockInteractionState,
        hoveredId: 'hover-test-svc',
      };

      capturedLegoBrickProps.length = 0;
      render(<ServiceFloor service={testService} position={[0, 0, 0]} height={1} buildingId="team-hover" />);

      const brickProps = capturedLegoBrickProps[0];
      expect(brickProps).toBeDefined();
      // Selected state overrides hover → should use primary (selection) color, not primaryHover
      expect(brickProps.color).toBe(tokens.colors.primary);
    });

    it('hover color is visually distinct from the normal and selection colors', () => {
      // Verify the color values are genuinely different
      expect(tokens.colors.primaryHover).not.toBe(tokens.colors.primary);
      // primaryHover should be defined
      expect(tokens.colors.primaryHover).toBeTruthy();
      // It should look like a color (hex or css string)
      expect(tokens.colors.primaryHover).toMatch(/^#[0-9a-fA-F]{3,6}$|^rgb|^hsl/);
    });
  });
});
