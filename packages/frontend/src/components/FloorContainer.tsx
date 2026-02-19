
import React, { useMemo, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { useServiceData } from '../hooks/useServiceData';
import { useLOD } from '../hooks/useLOD';
import { LODLevel } from '../utils/lodLevels';
import { calculateFloorY } from '../utils/floorLayout';
import { updateInstanceMatrix } from '../utils/instancedGeometry';
import { generateColor } from '../utils/colorGenerator';
import { ServiceFloor } from './ServiceFloor';
import type { LayoutPositions } from '../services/apiClient';

interface FloorContainerProps {
  teamId: string;
  position?: [number, number, number];
  lodPosition: [number, number, number];
  layout?: LayoutPositions;
}

const FLOOR_HEIGHT = 0.5;
const FLOOR_SPACING = 0.1;

export const FloorContainer: React.FC<FloorContainerProps> = ({ teamId, position = [0, 0, 0], lodPosition, layout }) => {
  const { services } = useServiceData(teamId);
  const posVector = useMemo(() => new THREE.Vector3(...lodPosition), [lodPosition]);
  const lod = useLOD(posVector);
  
  // Helper to get relative position for a service (converts absolute world coords to relative)
  const getServicePosition = (index: number): [number, number, number] => {
    // Calculate floor Y position for vertical stacking
    const floorY = calculateFloorY(index, FLOOR_HEIGHT, FLOOR_SPACING);
    
    // Floors stack directly on top of each other with no horizontal offset
    return [0, floorY, 0];
  };
  
  // Helper to get y position for a service (for backwards compatibility)
  // Kept for potential future use
  // const getServiceY = (serviceId: string, index: number): number => {
  //   return getServicePosition(serviceId, index)[1];
  // };
  
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Memoize geometry and material
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true }), []);

  // Update instances when services change or component mounts in FAR mode
  useLayoutEffect(() => {
    if (lod !== LODLevel.FAR || !meshRef.current || services.length === 0) return;

    const tempObject = new THREE.Object3D();
    const tempColor = new THREE.Color();
    const matrix = new THREE.Matrix4();

    services.forEach((service, index) => {
      const [x, y, z] = getServicePosition(index);
      
      // Update matrix using helper
      // Scale: [1.8, FLOOR_HEIGHT, 1.8] matches ServiceFloor box size
      updateInstanceMatrix(tempObject, matrix, x, y, z, [1.8, FLOOR_HEIGHT, 1.8]);
      meshRef.current!.setMatrixAt(index, matrix);
      
      tempColor.set(generateColor(service.id));
      meshRef.current!.setColorAt(index, tempColor);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    
  }, [services, lod, layout]);

  if (services.length === 0) return null;

  // Render individual floors for NEAR LOD
  if (lod === LODLevel.NEAR) {
    return (
      <group position={position}>
        {services.map((service, index) => {
          const servicePos = getServicePosition(index);
          return (
            <ServiceFloor
              key={service.id}
              service={service}
              position={servicePos}
              height={FLOOR_HEIGHT}
            />
          );
        })}
      </group>
    );
  }

  // Render instanced mesh for FAR LOD
  return (
    <group position={position}>
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, services.length]}
        castShadow
        receiveShadow
      />
    </group>
  );
};
