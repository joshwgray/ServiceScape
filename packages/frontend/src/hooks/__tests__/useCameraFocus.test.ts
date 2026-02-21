import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import * as THREE from 'three';
// @ts-ignore
import { useCameraFocus, getTargetPosition, getIdealCameraPosition, getBuildingCameraPosition } from '../useCameraFocus';
import { useSelectionStore } from '../../stores/selectionStore';

// Mock dependencies
vi.mock('@react-three/fiber', () => ({
  useThree: vi.fn(),
  useFrame: vi.fn(),
}));

vi.mock('../../stores/selectionStore', () => ({
  useSelectionStore: vi.fn(),
}));

describe('useCameraFocus', () => {
    const mockCamera = {
        position: new THREE.Vector3(0, 50, 50),
        lookAt: vi.fn(),
    };
    
    // Spy on lerp
    vi.spyOn(mockCamera.position, 'lerp');

    const mockControls = {
        target: new THREE.Vector3(0, 0, 0),
        update: vi.fn(),
    };
    vi.spyOn(mockControls.target, 'lerp');

    beforeEach(async () => {
        vi.clearAllMocks();
        const fiber = await import('@react-three/fiber');
        // @ts-ignore
        fiber.useThree.mockReturnValue({ camera: mockCamera, controls: mockControls });

        (useSelectionStore as any).mockImplementation((selector: any) => {
             const state = { selectedServiceId: 'service-1' };
             return selector ? selector(state) : state;
        });

        // Reset camera position for each test
        mockCamera.position.set(0, 50, 50);
        mockControls.target.set(0, 0, 0);
    });

    describe('getTargetPosition', () => {
        it('calculates correct position for services', () => {
            const layout = {
                services: { 's1': { x: 10, y: 0, z: 10 } }, 
            } as any;
            const pos = getTargetPosition('s1', layout);
            expect(pos).toEqual(new THREE.Vector3(10, 0, 10));
        });

        it('calculates correct position for teams', () => {
            const layout = {
                teams: { 't1': { x: 10, y: 0, z: 10 } },
            } as any;
            const pos = getTargetPosition('t1', layout);
            expect(pos).toEqual(new THREE.Vector3(11.5, 0, 11.5)); // +1.5 offset
        });

        it('calculates correct position for domains', () => {
            const layout = {
                domains: { 'd1': { x: 10, y: 0, z: 10 } },
            } as any;
            const pos = getTargetPosition('d1', layout);
            expect(pos).toEqual(new THREE.Vector3(20, 0, 20)); // +10 offset
        });

        it('prioritizes services over teams', () => {
            const layout = {
                services: { 'id1': { x: 10, y: 0, z: 10 } }, 
                teams: { 'id1': { x: 20, y: 0, z: 20 } },
            } as any;
            const pos = getTargetPosition('id1', layout);
            expect(pos).toEqual(new THREE.Vector3(10, 0, 10));
        });
    });

    describe('getIdealCameraPosition', () => {
        const target = new THREE.Vector3(10, 0, 10);

        it('calculates correct offset for services', () => {
            const layout = { services: { 's1': { x: 0, y: 0, z: 0 } } } as any;
            const pos = getIdealCameraPosition('s1', layout, target);
            // Offset (0, 20, 20) -> Target (10, 0, 10) + (0, 20, 20) = (10, 20, 30)
            expect(pos).toEqual(new THREE.Vector3(10, 20, 30)); 
        });

        it('calculates correct offset for teams', () => {
            const layout = { teams: { 't1': { x: 0, y: 0, z: 0 } } } as any;
            const pos = getIdealCameraPosition('t1', layout, target);
            // Offset (0, 40, 50) -> Target (10, 0, 10) + (0, 40, 50) = (10, 40, 60)
            expect(pos).toEqual(new THREE.Vector3(10, 40, 60)); 
        });

        it('calculates correct offset for domains', () => {
            const layout = { domains: { 'd1': { x: 0, y: 0, z: 0 } } } as any;
            const pos = getIdealCameraPosition('d1', layout, target);
            // Offset (0, 100, 150) -> Target (10, 0, 10) + (0, 100, 150) = (10, 100, 160)
            expect(pos).toEqual(new THREE.Vector3(10, 100, 160)); 
        });

        it('prioritizes services over teams', () => {
            const layout = { 
                services: { 'id1': { x: 0, y: 0, z: 0 } },
                teams: { 'id1': { x: 0, y: 0, z: 0 } }
            } as any;
            const pos = getIdealCameraPosition('id1', layout, target);
            expect(pos).toEqual(new THREE.Vector3(10, 20, 30)); // Service offset
        });
    });

    describe('useCameraFocus hook interactions', () => {
        let frameCallback: any;

        beforeEach(async () => {
             const fiber = await import('@react-three/fiber');
             // @ts-ignore
             fiber.useFrame.mockImplementation((cb: any) => { frameCallback = cb; });
        });

        it('lerps camera to correct position for domain selection', async () => {
            const layout = { domains: { 'domain-1': { x: 0, y: 0, z: 0 } } } as any;
            (useSelectionStore as any).mockImplementation((selector: any) => {
                 const state = { selectedServiceId: 'domain-1', selectedBuildingId: null, selectionLevel: 'service' }; 
                 return selector ? selector(state) : state;
            });

            renderHook(() => useCameraFocus(layout));
            
            // Expected target: (0+10, 0, 0+10) = (10, 0, 10)
            const expectedTargetPos = new THREE.Vector3(10, 0, 10);
            // Expected camera pos: target + (0, 100, 150) = (10, 100, 160)
            const expectedCameraPos = new THREE.Vector3(10, 100, 160);

            // Trigger frame with delta 0.1
            if (frameCallback) frameCallback({ camera: mockCamera }, 0.1);
            
            // Step = 2 * 0.1 = 0.2
            expect(mockControls.target.lerp).toHaveBeenCalledWith(expectedTargetPos, 0.2);
            expect(mockCamera.position.lerp).toHaveBeenCalledWith(expectedCameraPos, 0.2);
        });

        it('lerps camera to correct position for team selection', async () => {
            const layout = { teams: { 'team-1': { x: 10, y: 0, z: 10 } } } as any;
            (useSelectionStore as any).mockImplementation((selector: any) => {
                 const state = { selectedServiceId: 'team-1', selectedBuildingId: null, selectionLevel: 'service' }; 
                 return selector ? selector(state) : state;
            });

            renderHook(() => useCameraFocus(layout));
            
            // Expected target: (10+1.5, 0, 10+1.5) = (11.5, 0, 11.5)
            const expectedTargetPos = new THREE.Vector3(11.5, 0, 11.5);
            // Expected camera pos: target + (0, 40, 50) = (11.5, 40, 61.5)
            const expectedCameraPos = new THREE.Vector3(11.5, 40, 61.5);

            // Trigger frame with delta 0.1
            if (frameCallback) frameCallback({ camera: mockCamera }, 0.1);
            
            // Step = 2 * 0.1 = 0.2
            expect(mockControls.target.lerp).toHaveBeenCalledWith(expectedTargetPos, 0.2);
            expect(mockCamera.position.lerp).toHaveBeenCalledWith(expectedCameraPos, 0.2);
        });

        it('lerps camera to correct position for service selection', async () => {
            const layout = { services: { 's1': { x: 50, y: 0, z: 50 } } } as any;
            (useSelectionStore as any).mockImplementation((selector: any) => {
                 const state = { selectedServiceId: 's1', selectedBuildingId: null, selectionLevel: 'service' }; 
                 return selector ? selector(state) : state;
            });

            renderHook(() => useCameraFocus(layout));
            
            // Expected target: (50, 0, 50)
            const expectedTargetPos = new THREE.Vector3(50, 0, 50);
            // Expected camera pos: target + (0, 20, 20) = (50, 20, 70)
            const expectedCameraPos = new THREE.Vector3(50, 20, 70);

            if (frameCallback) frameCallback({ camera: mockCamera }, 0.1);
            
            expect(mockControls.target.lerp).toHaveBeenCalledWith(expectedTargetPos, 0.2);
            expect(mockCamera.position.lerp).toHaveBeenCalledWith(expectedCameraPos, 0.2);
        });

        it('clamps lerp alpha to 1', async () => {
            const layout = { services: { 's1': { x: 0, y: 0, z: 0 } } } as any;
            (useSelectionStore as any).mockImplementation((selector: any) => {
                 const state = { selectedServiceId: 's1', selectedBuildingId: null, selectionLevel: 'service' }; 
                 return selector ? selector(state) : state;
            });
            
            renderHook(() => useCameraFocus(layout));
            
            const expectedTargetPos = new THREE.Vector3(0, 0, 0);
            const expectedCameraPos = new THREE.Vector3(0, 20, 20); // target(0)+offset(20)

            // Trigger frame with large delta
            if (frameCallback) frameCallback({ camera: mockCamera }, 10.0);
            
            // Step = 2 * 10 = 20, clamped to 1
            expect(mockControls.target.lerp).toHaveBeenCalledWith(expectedTargetPos, 1);
            expect(mockCamera.position.lerp).toHaveBeenCalledWith(expectedCameraPos, 1);
        });
    });

    describe('building-level camera focus', () => {
        let frameCallback: any;

        beforeEach(async () => {
            const fiber = await import('@react-three/fiber');
            // @ts-ignore
            fiber.useFrame.mockImplementation((cb: any) => { frameCallback = cb; });
        });

        it('useCameraFocus should use building offset when selectedBuildingId is set', async () => {
            const layout = { teams: { 'team-1': { x: 10, y: 0, z: 10 } } } as any;
            (useSelectionStore as any).mockImplementation((selector: any) => {
                const state = {
                    selectedServiceId: null,
                    selectedBuildingId: 'team-1',
                    selectionLevel: 'building',
                };
                return selector ? selector(state) : state;
            });

            renderHook(() => useCameraFocus(layout));

            // Team target: (10+1.5, 0, 10+1.5) = (11.5, 0, 11.5)
            const expectedTargetPos = new THREE.Vector3(11.5, 0, 11.5);
            // Building camera offset (0, 30, 35): (11.5, 30, 46.5)
            const expectedCameraPos = new THREE.Vector3(11.5, 30, 46.5);

            if (frameCallback) frameCallback({ camera: mockCamera }, 0.1);

            expect(mockControls.target.lerp).toHaveBeenCalledWith(expectedTargetPos, 0.2);
            expect(mockCamera.position.lerp).toHaveBeenCalledWith(expectedCameraPos, 0.2);
        });

        it('building camera offset should be less zoomed than service offset', () => {
            const layout = {
                services: { 's1': { x: 0, y: 0, z: 0 } },
                teams: { 't1': { x: 0, y: 0, z: 0 } },
            } as any;
            const target = new THREE.Vector3(0, 0, 0);

            const servicePos = getIdealCameraPosition('s1', layout, target);
            const buildingPos = getBuildingCameraPosition('t1', layout, target);

            // Building (0,30,35) should be farther (less zoomed) than service (0,20,20)
            expect(buildingPos).not.toBeNull();
            expect(buildingPos!.z).toBeGreaterThan(servicePos!.z);
            expect(buildingPos!.y).toBeGreaterThan(servicePos!.y);
        });

        it('service selection should override building camera position', async () => {
            const layout = {
                services: { 's1': { x: 50, y: 0, z: 50 } },
                teams: { 'team-1': { x: 10, y: 0, z: 10 } },
            } as any;
            (useSelectionStore as any).mockImplementation((selector: any) => {
                const state = {
                    selectedServiceId: 's1',
                    selectedBuildingId: 'team-1',
                    selectionLevel: 'service',
                };
                return selector ? selector(state) : state;
            });

            renderHook(() => useCameraFocus(layout));

            // Service target: (50, 0, 50)
            const expectedTargetPos = new THREE.Vector3(50, 0, 50);
            // Service camera offset (0, 20, 20): (50, 20, 70)
            const expectedCameraPos = new THREE.Vector3(50, 20, 70);

            if (frameCallback) frameCallback({ camera: mockCamera }, 0.1);

            expect(mockControls.target.lerp).toHaveBeenCalledWith(expectedTargetPos, 0.2);
            expect(mockCamera.position.lerp).toHaveBeenCalledWith(expectedCameraPos, 0.2);
        });
    });
});
