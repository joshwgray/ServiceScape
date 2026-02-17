
import * as THREE from 'three';

/**
 * Updates a matrix with the position and scale, using a dummy Object3D helper
 * @param dummy The helper object
 * @param matrix The matrix to update
 * @param x The x position
 * @param y The y position
 * @param z The z position
 * @param scale Optional scale [x, y, z]
 */
export const updateInstanceMatrix = (
  dummy: THREE.Object3D,
  matrix: THREE.Matrix4,
  x: number,
  y: number,
  z: number,
  scale: [number, number, number] = [1, 1, 1]
): void => {
  dummy.position.set(x, y, z);
  dummy.scale.set(...scale);
  dummy.updateMatrix();
  matrix.copy(dummy.matrix);
};
