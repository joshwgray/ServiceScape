import { renderHook, act } from '@testing-library/react';
import { useLOD } from '../useLOD';
import { Vector3 } from 'three';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LODLevel } from '../../utils/lodLevels';

// Mock camera
const mockCamera = { position: new Vector3(0, 0, 0) };

// Store the frame callback to call it manually
let frameCallback: (state: any) => void = () => {};

vi.mock('@react-three/fiber', () => ({
  useThree: () => ({
    camera: mockCamera
  }),
  useFrame: (cb: any) => {
    frameCallback = cb;
  },
}));

describe('useLOD', () => {
    beforeEach(() => {
        mockCamera.position.set(0, 0, 0);
        frameCallback = () => {};
    });

    it('updates LOD based on distance', () => {
        // Target object at origin
        const { result } = renderHook(() => useLOD(new Vector3(0, 0, 0)));
        
        // let currentState = { camera: mockCamera };
        // const currentState = { camera: mockCamera };
        const trigger = (camObj: any) => {
            if(frameCallback) frameCallback(camObj);
        };

        // 1. Check NEAR (distance 0)
        mockCamera.position.set(0, 0, 0);
        act(() => trigger({ camera: mockCamera }));
        expect(result.current).toBe(LODLevel.NEAR);

        // 2. Check MEDIUM (distance 200)
        mockCamera.position.set(200, 0, 0);
        act(() => trigger({ camera: mockCamera }));
        expect(result.current).toBe(LODLevel.MEDIUM);

        // 3. Check FAR (distance 600)
        mockCamera.position.set(600, 0, 0);
        act(() => trigger({ camera: mockCamera }));
        expect(result.current).toBe(LODLevel.FAR);
    });

    it('handles boundary conditions correctly', () => {
        const { result } = renderHook(() => useLOD(new Vector3(0, 0, 0)));
        
        const trigger = (camObj: any) => {
            if(frameCallback) frameCallback(camObj);
        };

        // Exact 100 -> MEDIUM (since < 100 is NEAR)
        mockCamera.position.set(100, 0, 0);
        act(() => trigger({ camera: mockCamera }));
        expect(result.current).toBe(LODLevel.MEDIUM);

        // Exact 500 -> MEDIUM (threshold should be inclusive)
        mockCamera.position.set(500, 0, 0);
        act(() => trigger({ camera: mockCamera }));
        expect(result.current).toBe(LODLevel.MEDIUM);

        // 501 -> FAR
        mockCamera.position.set(501, 0, 0);
        act(() => trigger({ camera: mockCamera }));
        expect(result.current).toBe(LODLevel.FAR);
    });
});
