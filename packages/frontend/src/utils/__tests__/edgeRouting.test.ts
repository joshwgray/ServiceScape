import { describe, it, expect } from 'vitest';
import { generateCurvePoints, getSkywayHeight } from '../edgeRouting';
import * as THREE from 'three';

describe('edgeRouting', () => {
  it('should generate points for a curve', () => {
    const start = new THREE.Vector3(0, 0, 0);
    const end = new THREE.Vector3(10, 0, 10);
    const points = generateCurvePoints(start, end);
    
    expect(points.length).toBeGreaterThan(2);
    expect(points[0].equals(start)).toBe(true);
    expect(points[points.length - 1].equals(end)).toBe(true);
  });

  it('should calculate skyway height based on distance', () => {
    const start = new THREE.Vector3(0, 0, 0);
    const end = new THREE.Vector3(100, 0, 0);
    const height = getSkywayHeight(start, end);
    
    expect(height).toBeGreaterThan(20); // Minimum height
  });

  it('should create quadratic bezier curve with height', () => {
    const start = new THREE.Vector3(0, 0, 0);
    const end = new THREE.Vector3(10, 0, 0);
    const points = generateCurvePoints(start, end);
    
    // Check middle point height
    const midIndex = Math.floor(points.length / 2);
    const midPoint = points[midIndex];
    expect(midPoint.y).toBeGreaterThan(0);
  });
});
