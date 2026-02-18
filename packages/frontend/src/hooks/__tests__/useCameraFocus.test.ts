import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import * as THREE from 'three';
// @ts-ignore
import { useCameraFocus, getTargetPosition } from '../useCameraFocus';
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
    const mockControls = {
        target: new THREE.Vector3(0, 0, 0),
        update: vi.fn(),
    };

    beforeEach(async () => {
        vi.clearAllMocks();
        const fiber = await import('@react-three/fiber');
        // @ts-ignore
        fiber.useThree.mockReturnValue({ camera: mockCamera, controls: mockControls });

        (useSelectionStore as any).mockImplementation((selector: any) => {
             const state = { selectedServiceId: 'service-1' };
             return selector ? selector(state) : state;
        });
    });

    it('getTargetPosition calculates correct position', () => {
        const layoutCoordinates = {
            services: { 'service-1': { x: 10, y: 0, z: 10 } }, 
        } as any;
        const pos = getTargetPosition('service-1', layoutCoordinates);
        expect(pos).toEqual(new THREE.Vector3(10, 0, 10));
    });

    it('returns null if service not found', () => {
        const layoutCoordinates = { services: {} } as any;
        const pos = getTargetPosition('service-999', layoutCoordinates);
        expect(pos).toBeNull();
    });

    it('hook calls useThree to get camera and controls', async () => {
        const fiber = await import('@react-three/fiber');
        const layoutCoordinates = { services: { 'service-1': { x: 10, y: 0, z: 10 } } } as any;
        
        renderHook(() => useCameraFocus(layoutCoordinates));
        
        expect(fiber.useThree).toHaveBeenCalled();
    });
});
