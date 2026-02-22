import { Vector3 } from 'three';

export const SERVICE_WIDTH = 1.8;
export const SERVICE_DEPTH = 1.8;

/**
 * Calculates the "door" position on the surface of a service block that faces a target position.
 * The door is placed on the bounding box edge closest to the target.
 * 
 * @param position Center position of the service [x, y, z]
 * @param targetPosition Target position to face [x, y, z]
 * @returns The calculate door position [x, y, z]
 */
export function calculateDoorPosition(
    position: [number, number, number],
    targetPosition?: [number, number, number]
): [number, number, number] {
    if (!targetPosition) {
        return position;
    }

    const start = new Vector3(...position);
    const end = new Vector3(...targetPosition);
    const direction = new Vector3().subVectors(end, start);
    
    // Flatten direction to XZ plane if we assume doors are on walls
    direction.y = 0;

    if (direction.lengthSq() < 0.0001) {
        // Target is essentially same position
        return position;
    }

    direction.normalize();

    // Box dimensions (full width/depth)
    const HALF_WIDTH = SERVICE_WIDTH / 2;
    const HALF_DEPTH = SERVICE_DEPTH / 2;

    // We want to find the intersection of the ray (start, direction) with the AABB.
    // The intersection distance t along the ray is determined by the closest face.
    // t_x is distance to X-face, t_z is distance to Z-face.

    // Avoid division by zero
    const tx = direction.x !== 0 ? Math.abs(HALF_WIDTH / direction.x) : Infinity;
    const tz = direction.z !== 0 ? Math.abs(HALF_DEPTH / direction.z) : Infinity;

    // The actual distance to the boundary is the minimum of these two
    const t = Math.min(tx, tz);

    // Calculate offset
    const offset = direction.clone().multiplyScalar(t);
    
    // Final position
    const doorPos = start.clone().add(offset);

    return [doorPos.x, doorPos.y, doorPos.z];
}
