
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { updateInstanceMatrix } from '../instancedGeometry';

describe('instancedGeometry', () => {
  it('should update the matrix with correct position', () => {
    const dummy = new THREE.Object3D();
    const matrix = new THREE.Matrix4();
    const x = 10;
    const y = 20;
    const z = 30;

    updateInstanceMatrix(dummy, matrix, x, y, z);

    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    matrix.decompose(position, rotation, scale);

    expect(position.x).toBe(10);
    expect(position.y).toBe(20);
    expect(position.z).toBe(30);
  });

  it('should optionally handle scale', () => {
    const dummy = new THREE.Object3D();
    const matrix = new THREE.Matrix4();
    const scale = [2, 2, 2] as [number, number, number];

    updateInstanceMatrix(dummy, matrix, 0, 0, 0, scale);

    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const outputScale = new THREE.Vector3();
    matrix.decompose(position, rotation, outputScale);

    expect(outputScale.x).toBe(2);
    expect(outputScale.y).toBe(2);
    expect(outputScale.z).toBe(2);
  });
});
