import React, { useMemo } from 'react';
import * as THREE from 'three';
import { createLegoPlasticMaterial } from '../utils/legoMaterials';
import { LEGO_COLOR_BRIGHT_GREEN, LEGO_COLOR_REDDISH_BROWN } from '../utils/legoColors';
import { 
  getTreeVariant, 
  getFoliageType, 
  TREE_DIMENSIONS
} from '../utils/treeGeometry';

export interface LegoTreeProps {
  position: [number, number, number];
  seed: string;
}

// Colors from legoColors.ts
const TRUNK_COLOR = LEGO_COLOR_REDDISH_BROWN;
const FOLIAGE_COLOR = LEGO_COLOR_BRIGHT_GREEN;

export const LegoTree: React.FC<LegoTreeProps> = ({ position, seed }) => {
  const variant = useMemo(() => getTreeVariant(seed), [seed]);
  const foliageType = useMemo(() => getFoliageType(seed), [seed]);
  
  const dimensions = TREE_DIMENSIONS[variant];
  
  const trunkMaterial = useMemo(() => createLegoPlasticMaterial({ color: TRUNK_COLOR }), []);
  const foliageMaterial = useMemo(() => createLegoPlasticMaterial({ color: FOLIAGE_COLOR }), []);
  
  const trunkGeometry = useMemo(
    () => new THREE.BoxGeometry(dimensions.trunkWidth, dimensions.trunkHeight, dimensions.trunkWidth),
    [dimensions.trunkWidth, dimensions.trunkHeight]
  );
  const coneGeometry = useMemo(
    () => new THREE.ConeGeometry(dimensions.foliageRadius, dimensions.foliageHeight, 4),
    [dimensions.foliageRadius, dimensions.foliageHeight]
  );
  const sphereGeometry = useMemo(
    () => new THREE.SphereGeometry(dimensions.foliageRadius, 16, 16),
    [dimensions.foliageRadius]
  );

  // Trunk geometry: A simple box scaled to resemble stacked bricks
  // Position needs to be careful: the mesh origin is center.
  // We want position prop to be the bottom center of the tree.
  const trunkY = dimensions.trunkHeight / 2;
  
  // Foliage sits on top of trunk
  // For cone: height is total height, center is at height/2. Base starts at trunk top.
  // For sphere: center is at trunk top + radius? Or slightly lower to look attached.
  // Let's place foliage center appropriately.
  
  let foliageMesh;
  const foliageY = dimensions.trunkHeight; // Base of foliage starts at top of trunk

  if (foliageType === 'cone') {
    // Cone geometry: radius, height, radialSegments
    // Default ConeGeometry pivot is center of height.
    // So if we place at foliageY + height/2, the bottom is at foliageY.
    const centerY = foliageY + dimensions.foliageHeight / 2;
    foliageMesh = (
      <mesh 
        position={[0, centerY, 0]} 
        geometry={coneGeometry}
        material={foliageMaterial}
        castShadow 
        receiveShadow
        raycast={() => null}
      />
    );
  } else {
    // Rounded/Sphere
    const centerY = foliageY + dimensions.foliageRadius * 0.8; // Overlap slightly
    foliageMesh = (
      <mesh 
        position={[0, centerY, 0]} 
        geometry={sphereGeometry}
        material={foliageMaterial}
        castShadow 
        receiveShadow
        raycast={() => null}
      />
    );
  }

  return (
    <group position={position}>
      {/* Trunk */}
      <mesh 
        position={[0, trunkY, 0]} 
        geometry={trunkGeometry}
        material={trunkMaterial}
        castShadow 
        receiveShadow
        raycast={() => null}
      />
      
      {/* Foliage */}
      {foliageMesh}
    </group>
  );
};

export default LegoTree;
