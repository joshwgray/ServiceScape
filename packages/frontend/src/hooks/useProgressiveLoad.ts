import { useFrame } from '@react-three/fiber';
import { useVisibilityStore } from '../stores/visibilityStore';
import * as THREE from 'three';
import { useRef, useEffect } from 'react';
import type { Position3D } from '@servicescape/shared';

export interface VisibleObject {
    id: string;
    position: Position3D;
    radius?: number;
}

export function useProgressiveLoad(objects: VisibleObject[]) {
    // Select state methods
    const addVisibleDomain = useVisibilityStore((state) => state.addVisibleDomain);
    const removeVisibleDomain = useVisibilityStore((state) => state.removeVisibleDomain);

    const objectsRef = useRef(objects);
    const frustum = useRef(new THREE.Frustum());
    const projScreenMatrix = useRef(new THREE.Matrix4());
    const frameCount = useRef(0);

    // Update ref when objects change
    useEffect(() => {
        objectsRef.current = objects;
    }, [objects]);

    useFrame(({ camera }) => {
        frameCount.current++;
        // Check frequently enough but not every single frame if performance is concern.
        // Let's do every 10 frames (~6 times per second at 60fps)
        if (frameCount.current % 10 !== 0) return;

        // Update frustum
        projScreenMatrix.current.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        frustum.current.setFromProjectionMatrix(projScreenMatrix.current);

        objectsRef.current.forEach(obj => {
            const pos = new THREE.Vector3(obj.position.x, obj.position.y, obj.position.z);
            
            let isVisible = false;
            if (obj.radius) {
                const sphere = new THREE.Sphere(pos, obj.radius);
                isVisible = frustum.current.intersectsSphere(sphere);
            } else {
                isVisible = frustum.current.containsPoint(pos);
            }

            if (isVisible) {
                addVisibleDomain(obj.id);
            } else {
                removeVisibleDomain(obj.id);
            }
        });
    });
}
