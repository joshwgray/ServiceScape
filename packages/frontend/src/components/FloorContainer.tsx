
import React, { useMemo, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { useServiceData } from '../hooks/useServiceData';
import { useLOD } from '../hooks/useLOD';
import { LODLevel } from '../utils/lodLevels';
import { calculateFloorY } from '../utils/floorLayout';
import { updateInstanceMatrix } from '../utils/instancedGeometry';
import { generateColor } from '../utils/colorGenerator';
import { ServiceFloor } from './ServiceFloor';

interface FloorContainerProps {
  teamId: string;
  position?: [number, number, number];
  lodPosition: [number, number, number];
}

const FLOOR_HEIGHT = 0.5;
const FLOOR_SPACING = 0.1;

export const FloorContainer: React.FC<FloorContainerProps> = ({ teamId, position = [0, 0, 0], lodPosition }) => {
  const { services } = useServiceData(teamId);
  const posVector = useMemo(() => new THREE.Vector3(...lodPosition), [lodPosition]);
  const lod = useLOD(posVector);
  
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
      const y = calculateFloorY(index, FLOOR_HEIGHT, FLOOR_SPACING);
      
      // Update matrix using helper
      // Scale: [1.8, FLOOR_HEIGHT, 1.8] matches ServiceFloor box size
      updateInstanceMatrix(tempObject, matrix, 0, y, 0, [1.8, FLOOR_HEIGHT, 1.8]);
      meshRef.current!.setMatrixAt(index, matrix);
      
      tempColor.set(generateColor(service.id));
      meshRef.current!.setColorAt(index, tempColor);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    
  }, [services, lod]);

  if (services.length === 0) return null;

  // Render individual floors for NEAR LOD
  if (lod === LODLevel.NEAR) {
    return (
      <group position={position}>
        {services.map((service, index) => (
          <ServiceFloor
            key={service.id}
            service={service}
            position={[0, calculateFloorY(index, FLOOR_HEIGHT, FLOOR_SPACING), 0]}
            height={FLOOR_HEIGHT}
          />
        ))}
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
