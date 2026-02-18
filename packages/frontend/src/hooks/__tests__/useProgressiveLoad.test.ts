import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProgressiveLoad } from '../useProgressiveLoad';
import * as THREE from 'three';

// Manually controlled mock for useFrame
let frameCallback: ((state: any, delta: number) => void) | null = null;

vi.mock('@react-three/fiber', () => ({
    useThree: () => ({
        camera: {
            projectionMatrix: new THREE.Matrix4(),
            matrixWorldInverse: new THREE.Matrix4(),
        }
    }),
    useFrame: (cb: any) => {
        frameCallback = cb;
    }
}));

// Mock THREE Frustum
vi.mock('three', async () => {
    const actual = await vi.importActual('three');
    return {
        ...actual,
        Frustum: class {
            setFromProjectionMatrix = vi.fn();
            containsPoint = vi.fn().mockReturnValue(true); // Default visible
            intersectsSphere = vi.fn().mockReturnValue(true); // Default visible
        },
        Matrix4: class {
            multiplyMatrices = vi.fn();
        },
        Vector3: class {
            constructor(public x: number, public y: number, public z: number) {}
        },
        Sphere: class {
            constructor(public center: any, public radius: number) {}
        }
    };
});

// Mock store
const mockAdd = vi.fn();
const mockRemove = vi.fn();
const mockClear = vi.fn();

const storeState = {
    addVisibleDomain: mockAdd,
    removeVisibleDomain: mockRemove,
    clearVisibility: mockClear,
    visibleDomains: new Set()
};

vi.mock('../../stores/visibilityStore', () => ({
    useVisibilityStore: (selector: any) => selector ? selector(storeState) : storeState
}));

describe('useProgressiveLoad', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        frameCallback = null;
    });

    it('should register checks in useFrame', () => {
        const domains = [{ id: 'd1', position: { x: 0, y: 0, z: 0 } }];
        renderHook(() => useProgressiveLoad(domains));
        expect(frameCallback).toBeDefined();
    });

    it('should add visible domains to store using Position3D objects', () => {
        const domains = [{ id: 'd1', position: { x: 100, y: 0, z: 50 } }];
        renderHook(() => useProgressiveLoad(domains));
        
        if (frameCallback) {
            // Simulate 10 frames to trigger check
            for(let i=0; i<10; i++) {
                frameCallback && frameCallback({ camera: { projectionMatrix: new THREE.Matrix4(), matrixWorldInverse: new THREE.Matrix4() } } as any, 0.1);
            }
        }
        
        expect(mockAdd).toHaveBeenCalledWith('d1');
    });

    it('should handle objects with radius using Position3D', () => {
        const domains = [{ id: 'd1', position: { x: 75, y: 10, z: 25 }, radius: 15 }];
        renderHook(() => useProgressiveLoad(domains));
        
        if (frameCallback) {
            for(let i=0; i<10; i++) {
                frameCallback && frameCallback({ camera: { projectionMatrix: new THREE.Matrix4(), matrixWorldInverse: new THREE.Matrix4() } } as any, 0.1);
            }
        }
        
        expect(mockAdd).toHaveBeenCalledWith('d1');
    });
});
