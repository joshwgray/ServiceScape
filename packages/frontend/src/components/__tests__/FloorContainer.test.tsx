
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FloorContainer } from '../FloorContainer';
import { LODLevel } from '../../utils/lodLevels';
import * as useLODModule from '../../hooks/useLOD';
import * as useServiceDataModule from '../../hooks/useServiceData';
import * as useAnimatedOpacityModule from '../../hooks/useAnimatedOpacity';
import * as selectionStoreModule from '../../stores/selectionStore';
import React from 'react';

// Mock dependencies
vi.mock('../../hooks/useLOD', () => ({
  useLOD: vi.fn(),
  LODLevel: {
    NEAR: 'NEAR',
    FAR: 'FAR'
  }
}));

vi.mock('../../hooks/useServiceData', () => ({
  useServiceData: vi.fn(),
}));

// Mock useAnimatedOpacity hook
vi.mock('../../hooks/useAnimatedOpacity', () => ({
  useAnimatedOpacity: vi.fn((target: number) => target),
}));

// Mock selectionStore
vi.mock('../../stores/selectionStore', () => ({
  useSelectionStore: vi.fn(),
}));

// Mock ServiceFloor component
vi.mock('../ServiceFloor', () => ({
  ServiceFloor: (props: any) => (
    <div 
      data-testid="service-floor" 
      data-service-id={props.service.id}
      data-position={props.position.join(',')}
      data-opacity={props.opacity}
    />
  )
}));

// Mock Three.js - we need to make sure instancedMesh is mocked or reachable
// In JSDOM, <instancedMesh> elements are just custom elements without special behavior
// We can check if they are rendered in the DOM.
vi.mock('three', async () => {
    const actual = await vi.importActual('three');
    return {
        ...actual,
        InstancedMesh: class {
            count: number;
            instanceMatrix: any;
            instanceColor: any;
            setColorAt = vi.fn();
            setMatrixAt = vi.fn();
            dispose = vi.fn();
            constructor(_g: any, _m: any, count: number) {
                this.count = count;
                this.instanceMatrix = { needsUpdate: false };
                this.instanceColor = { needsUpdate: false };
            }
        },
        Object3D: class {
            position = { set: vi.fn() };
            scale = { set: vi.fn() };
            updateMatrix = vi.fn();
            matrix = { copy: vi.fn() };
        },
        Color: class {
            set = vi.fn();
        },
        Matrix4: class {
            makeScale = vi.fn();
            setPosition = vi.fn();
            copy = vi.fn();
        }
    };
});

// Mock instancedMesh JSX element
vi.mock('@react-three/fiber', () => ({
    extend: vi.fn(),
    useThree: () => ({ camera: {}, gl: {} }), 
    useFrame: vi.fn(),
}));

// Mock React useLayoutEffect to avoid JSDOM issues with refs
vi.mock('react', async () => {
    const actual = await vi.importActual<any>('react');
    // Create a mock function for useLayoutEffect
    const mockUseLayoutEffect = vi.fn();
    return {
        ...actual,
        // Override named export
        useLayoutEffect: mockUseLayoutEffect,
        // Override property on default export if it exists
        default: {
            ...actual.default,
            useLayoutEffect: mockUseLayoutEffect
        }
    };
});

describe('FloorContainer', () => {
  const mockServices = [
    { id: '1', name: 'S1', teamId: 'team1' },
    { id: '2', name: 'S2', teamId: 'team1' },
    { id: '3', name: 'S3', teamId: 'team1' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useServiceDataModule.useServiceData as any).mockReturnValue({
      services: mockServices,
      loading: false,
      error: null,
    });
    // Default: no building selected
    (selectionStoreModule.useSelectionStore as any).mockImplementation(
      (selector: (state: any) => any) => selector({ selectedBuildingId: null })
    );
  });

  it('renders individual ServiceFloor components in NEAR LOD mode', () => {
    (useLODModule.useLOD as any).mockReturnValue(LODLevel.NEAR);
    
    render(
        <FloorContainer teamId="team1" position={[0, 0, 0]} lodPosition={[0, 0, 0]} />
    );
    
    const floors = screen.getAllByTestId('service-floor');
    expect(floors).toHaveLength(3);
    expect(floors[0]).toHaveAttribute('data-service-id', '1');
    expect(floors[1]).toHaveAttribute('data-service-id', '2');
    expect(floors[2]).toHaveAttribute('data-service-id', '3');
  });

  it('stacks floors directly on top of each other in NEAR mode', () => {
    (useLODModule.useLOD as any).mockReturnValue(LODLevel.NEAR);
    
    const mockLayout = {
      domains: {},
      teams: {},
      services: {}
    };
    
    render(
        <FloorContainer teamId="team1" position={[0, 0, 0]} lodPosition={[0, 0, 0]} layout={mockLayout} />
    );
    
    const floors = screen.getAllByTestId('service-floor');
    
    // Verify floors are stacked directly on top of each other (no horizontal offset)
    floors.forEach((floor, index) => {
      const position = floor.getAttribute('data-position');
      expect(position).toBeTruthy();
      const [x, y, z] = position!.split(',').map(Number);
      
      // Y should match floor heights (deterministic)
      const expectedY = 0.25 + index * 0.6; // FLOOR_HEIGHT/2 + index * (FLOOR_HEIGHT + FLOOR_SPACING)
      expect(y).toBeCloseTo(expectedY, 1);
      
      // X and Z should be 0 (floors stack directly)
      expect(x).toBe(0);
      expect(z).toBe(0);
    });
  });

  it('generates consistent positions for services regardless of LOD position', () => {
    (useLODModule.useLOD as any).mockReturnValue(LODLevel.NEAR);
    
    const mockLayout = {
      domains: {},
      teams: {},
      services: {}
    };
    
    render(
        <FloorContainer teamId="team1" position={[0, 0, 0]} lodPosition={[10, 20, 5]} layout={mockLayout} />
    );
    
    const floors = screen.getAllByTestId('service-floor');
    
    // Verify positions are consistent (floors stack directly)
    floors.forEach((floor, index) => {
      const position = floor.getAttribute('data-position');
      expect(position).toBeTruthy();
      const [x, y, z] = position!.split(',').map(Number);
      
      const expectedY = 0.25 + index * 0.6;
      expect(y).toBeCloseTo(expectedY, 1);
      expect(x).toBe(0);
      expect(z).toBe(0);
    });
  });

  it('uses calculateFloorY for vertical positioning with no horizontal offset', () => {
    (useLODModule.useLOD as any).mockReturnValue(LODLevel.NEAR);
    
    render(
        <FloorContainer teamId="team1" position={[0, 0, 0]} lodPosition={[0, 0, 0]} />
    );
    
    const floors = screen.getAllByTestId('service-floor');
    
    // Verify Y uses calculateFloorY (deterministic), X/Z are 0 (direct stacking)
    floors.forEach((floor, index) => {
      const position = floor.getAttribute('data-position');
      expect(position).toBeTruthy();
      const [x, y, z] = position!.split(',').map(Number);
      
      // calculateFloorY(index, 0.5, 0.1) = 0.25 + index * 0.6
      const expectedY = 0.25 + index * 0.6;
      expect(y).toBeCloseTo(expectedY, 1);
      
      // X and Z should be 0 (floors stack directly)
      expect(x).toBe(0);
      expect(z).toBe(0);
    });
  });

  it('renders instanced mesh in FAR LOD mode and updates matrices', () => {
    (useLODModule.useLOD as any).mockReturnValue(LODLevel.FAR);
    (useServiceDataModule.useServiceData as any).mockReturnValue({
      services: [
        { id: '1', name: 'Service 1' },
        { id: '2', name: 'Service 2' },
        { id: '3', name: 'Service 3' }
      ],
      loading: false,
      error: null,
    });
    
    // Setup mocks for Three.js methods on HTMLUnknownElement (how instancedMesh renders in JSDOM)
    const setMatrixAtSpy = vi.fn();
    const setColorAtSpy = vi.fn();
    const instanceMatrix = { needsUpdate: false };
    const instanceColor = { needsUpdate: false };

    // Patch prototype to allow refs to work as expected
    const originalSetMatrixAt = (global.HTMLUnknownElement.prototype as any).setMatrixAt;
    const originalSetColorAt = (global.HTMLUnknownElement.prototype as any).setColorAt;
    const originalInstanceMatrix = Object.getOwnPropertyDescriptor(global.HTMLUnknownElement.prototype, 'instanceMatrix');
    const originalInstanceColor = Object.getOwnPropertyDescriptor(global.HTMLUnknownElement.prototype, 'instanceColor');

    (global.HTMLUnknownElement.prototype as any).setMatrixAt = setMatrixAtSpy;
    (global.HTMLUnknownElement.prototype as any).setColorAt = setColorAtSpy;
    
    Object.defineProperty(global.HTMLUnknownElement.prototype, 'instanceMatrix', {
      get: () => instanceMatrix,
      configurable: true
    });
    
    Object.defineProperty(global.HTMLUnknownElement.prototype, 'instanceColor', {
      get: () => instanceColor,
      configurable: true
    });

    try {
      // Capture the effect callback to run it after render
      let capturedEffect: (() => void) | undefined;
      (React.useLayoutEffect as any).mockImplementation((effect: any) => {
        capturedEffect = effect;
      });

      const { container } = render(
          <FloorContainer teamId="team1" position={[0, 0, 0]} lodPosition={[0, 0, 0]} />
      );
      
      // Check if instancedMesh is in the output
      const mesh = container.querySelector('instancedMesh');
      expect(mesh).toBeDefined();
      expect(mesh).not.toBeNull();
      
      // Now run the effect (simulating layout effect firing after commit)
      // At this point refs should be attached
      if (capturedEffect) {
        capturedEffect();
      }
      
      // Validate behavior
      expect(setMatrixAtSpy).toHaveBeenCalledTimes(3);
      expect(setColorAtSpy).toHaveBeenCalledTimes(3);
      expect(instanceMatrix.needsUpdate).toBe(true);
      // The component checks if instanceColor exists before setting needsUpdate
      // Since we mocked it to exist, it should be set
      expect(instanceColor.needsUpdate).toBe(true);

    } finally {
      // Cleanup
      if (originalSetMatrixAt) (global.HTMLUnknownElement.prototype as any).setMatrixAt = originalSetMatrixAt;
      else delete (global.HTMLUnknownElement.prototype as any).setMatrixAt;
      
      if (originalSetColorAt) (global.HTMLUnknownElement.prototype as any).setColorAt = originalSetColorAt;
      else delete (global.HTMLUnknownElement.prototype as any).setColorAt;

      if (originalInstanceMatrix) Object.defineProperty(global.HTMLUnknownElement.prototype, 'instanceMatrix', originalInstanceMatrix);
      else delete (global.HTMLUnknownElement.prototype as any).instanceMatrix;

      if (originalInstanceColor) Object.defineProperty(global.HTMLUnknownElement.prototype, 'instanceColor', originalInstanceColor);
      else delete (global.HTMLUnknownElement.prototype as any).instanceColor;
    }
  });

  it('does not render anything if there are no services', () => {
    (useServiceDataModule.useServiceData as any).mockReturnValue({
      services: [],
      loading: false,
      error: null,
    });
    
    const { container } = render(
        <FloorContainer teamId="team1" position={[0, 0, 0]} lodPosition={[0, 0, 0]} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should pass animatedOpacity to ServiceFloor components in NEAR mode', () => {
    (useLODModule.useLOD as any).mockReturnValue(LODLevel.NEAR);
    // Mock useAnimatedOpacity to return a specific dimmed value
    (useAnimatedOpacityModule.useAnimatedOpacity as any).mockReturnValue(0.15);

    render(
        <FloorContainer teamId="team1" position={[0, 0, 0]} lodPosition={[0, 0, 0]} />
    );

    const floors = screen.getAllByTestId('service-floor');
    expect(floors).toHaveLength(3);

    // Every ServiceFloor should receive the animated opacity value
    floors.forEach((floor) => {
      expect(floor).toHaveAttribute('data-opacity', '0.15');
    });
  });

  it('should pass full opacity (1.0) to ServiceFloor components when nothing is selected', () => {
    (useLODModule.useLOD as any).mockReturnValue(LODLevel.NEAR);
    // When no building is selected, useAnimatedOpacity should be called with 1.0
    // We restore the default mock (returns the target unchanged)
    (useAnimatedOpacityModule.useAnimatedOpacity as any).mockReturnValue(1.0);

    render(
        <FloorContainer teamId="team1" position={[0, 0, 0]} lodPosition={[0, 0, 0]} />
    );

    const floors = screen.getAllByTestId('service-floor');
    floors.forEach((floor) => {
      expect(floor).toHaveAttribute('data-opacity', '1');
    });
  });

  it('should call useAnimatedOpacity with targetOpacity=1.0 when no building is selected (acceptance criterion #4)', () => {
    (useLODModule.useLOD as any).mockReturnValue(LODLevel.NEAR);
    // selectedBuildingId = null → target must be 1.0
    (selectionStoreModule.useSelectionStore as any).mockImplementation(
      (selector: (state: any) => any) => selector({ selectedBuildingId: null })
    );

    render(
        <FloorContainer teamId="team1" position={[0, 0, 0]} lodPosition={[0, 0, 0]} />
    );

    expect(useAnimatedOpacityModule.useAnimatedOpacity).toHaveBeenCalledWith(1.0);
  });

  it('should call useAnimatedOpacity with targetOpacity=1.0 when this building is selected (acceptance criterion #4)', () => {
    (useLODModule.useLOD as any).mockReturnValue(LODLevel.NEAR);
    // selectedBuildingId === teamId → this building is selected → target must be 1.0
    (selectionStoreModule.useSelectionStore as any).mockImplementation(
      (selector: (state: any) => any) => selector({ selectedBuildingId: 'team1' })
    );

    render(
        <FloorContainer teamId="team1" position={[0, 0, 0]} lodPosition={[0, 0, 0]} />
    );

    expect(useAnimatedOpacityModule.useAnimatedOpacity).toHaveBeenCalledWith(1.0);
  });

  it('should call useAnimatedOpacity with targetOpacity=0.15 when another building is selected (acceptance criterion #4)', () => {
    (useLODModule.useLOD as any).mockReturnValue(LODLevel.NEAR);
    // selectedBuildingId !== teamId → another building is selected → target must be 0.15
    (selectionStoreModule.useSelectionStore as any).mockImplementation(
      (selector: (state: any) => any) => selector({ selectedBuildingId: 'other-team' })
    );

    render(
        <FloorContainer teamId="team1" position={[0, 0, 0]} lodPosition={[0, 0, 0]} />
    );

    expect(useAnimatedOpacityModule.useAnimatedOpacity).toHaveBeenCalledWith(0.15);
  });
});

