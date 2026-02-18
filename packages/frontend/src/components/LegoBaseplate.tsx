import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { LEGO_STUD_RADIUS, LEGO_STUD_HEIGHT } from '../utils/legoGeometry';
import { createLegoPlasticMaterial } from '../utils/legoMaterials';

export interface LegoBaseplateProps {
  width: number;
  depth: number;
  thickness?: number;
  color: string;
  studColor?: string;
  position?: [number, number, number];
  studSpacing?: number;  // units between studs, default 1.0
  maxStudCap?: number;   // max studs per axis, default 2000 (effectively uncapped)
}

export function calculateStudGrid(
  width: number,
  depth: number,
  spacing: number,
  maxCap: number
): { cols: number; rows: number } {
  const cols = Math.min(Math.floor(width / spacing), maxCap);
  const rows = Math.min(Math.floor(depth / spacing), maxCap);
  return { cols, rows };
}

/**
 * A LEGO baseplate with a flat box body and an instanced mesh of cylindrical studs.
 */
export const LegoBaseplate: React.FC<LegoBaseplateProps> = ({
  width,
  depth,
  thickness = 0.25,
  color,
  studColor,
  position,
  studSpacing = 1.0,
  maxStudCap = 2000,
}) => {
  const studMeshRef = useRef<THREE.InstancedMesh>(null);

  const plateMaterial = useMemo(() => createLegoPlasticMaterial({ color }), [color]);
  const studMaterial = useMemo(
    () => createLegoPlasticMaterial({ color: studColor ?? color }),
    [color, studColor]
  );
  const plateGeometry = useMemo(() => new THREE.BoxGeometry(width, thickness, depth), [width, thickness, depth]);
  const studGeometry = useMemo(
    () => new THREE.CylinderGeometry(LEGO_STUD_RADIUS, LEGO_STUD_RADIUS, LEGO_STUD_HEIGHT, 12),
    []
  );

  const { cols, rows } = calculateStudGrid(width, depth, studSpacing, maxStudCap);
  const studCount = cols * rows;

  // Position studs on top of the plate
  const studY = thickness / 2 + LEGO_STUD_HEIGHT / 2;

  useLayoutEffect(() => {
    const mesh = studMeshRef.current;
    if (!mesh || studCount === 0 || typeof mesh.setMatrixAt !== 'function') return;

    const dummy = new THREE.Object3D();
    // Start so the grid is centered on the plate
    const xStart = -((cols - 1) / 2) * studSpacing;
    const zStart = -((rows - 1) / 2) * studSpacing;

    let index = 0;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        dummy.position.set(
          xStart + c * studSpacing,
          studY,
          zStart + r * studSpacing
        );
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
        index++;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [cols, rows, studY, studCount, studSpacing]);

  const pos = position ?? [0, 0, 0];

  return (
    <group position={pos}>
      {/* Plate body */}
      <mesh receiveShadow geometry={plateGeometry} material={plateMaterial} />

      {/* Stud grid */}
      {studCount > 0 && (
        <instancedMesh
          ref={studMeshRef}
          args={[studGeometry, studMaterial, studCount]}
          castShadow
        />
      )}
    </group>
  );
};

export default LegoBaseplate;
