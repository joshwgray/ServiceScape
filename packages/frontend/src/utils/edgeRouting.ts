import * as THREE from 'three';

// Increased minimum height to better avoid building collisions
// TODO: Implement proper collision detection with buildings in future phase
const MIN_HEIGHT = 50; 
const HEIGHT_FACTOR = 0.5;

export const getSkywayHeight = (start: THREE.Vector3, end: THREE.Vector3): number => {
  const distance = start.distanceTo(end);
  return Math.max(MIN_HEIGHT, distance * HEIGHT_FACTOR);
};

export const generateCurvePoints = (start: THREE.Vector3, end: THREE.Vector3, segments: number = 20): THREE.Vector3[] => {
  const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const height = getSkywayHeight(start, end);
  midPoint.y += height;

  const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);
  return curve.getPoints(segments);
};
