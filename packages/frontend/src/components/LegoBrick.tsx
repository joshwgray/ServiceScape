import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import {
  LEGO_STUD_RADIUS,
  LEGO_STUD_HEIGHT,
  getStudPositions,
  type StudVariant,
} from '../utils/legoGeometry';
import { createLegoPlasticMaterial } from '../utils/legoMaterials';

interface LegoBrickProps {
  width?: number;
  height?: number;
  depth?: number;
  color: string;
  studVariant?: StudVariant;
  castShadow?: boolean;
  receiveShadow?: boolean;
  opacity?: number;
  transparent?: boolean;
}

export const LegoBrick: React.FC<LegoBrickProps> = ({
  width = 1.8,
  height = 0.5,
  depth = 1.8,
  color,
  studVariant = '2x2',
  castShadow = false,
  receiveShadow = false,
  opacity = 1.0,
  transparent = false,
}) => {
  const studPositions = getStudPositions(studVariant, width, depth);
  // Create material once per unique color; do NOT include opacity/transparent in deps
  // to avoid recreating (and leaking) a new GPU material object on every opacity change.
  const material = useMemo(() => {
    return createLegoPlasticMaterial({ color });
  }, [color]);

  // Imperatively update opacity and transparent so we never recreate the material.
  // Only set needsUpdate when `transparent` changes to avoid per-frame shader recompilation.
  useEffect(() => {
    const needsTransparent = transparent || opacity < 1.0;
    const transparentChanged = material.transparent !== needsTransparent;
    material.opacity = opacity;
    material.transparent = needsTransparent;
    if (transparentChanged) {
      material.needsUpdate = true;
    }
  }, [material, opacity, transparent]);
  const brickGeometry = useMemo(() => new THREE.BoxGeometry(width, height, depth), [width, height, depth]);
  const studGeometry = useMemo(() => new THREE.CylinderGeometry(LEGO_STUD_RADIUS, LEGO_STUD_RADIUS, LEGO_STUD_HEIGHT, 16), []);

  return (
    <group>
      {/* Brick body */}
      <mesh castShadow={castShadow} receiveShadow={receiveShadow} geometry={brickGeometry} material={material} />

      {/* Studs on top */}
      {studPositions.map(([x, , z], index) => (
        <mesh
          key={index}
          position={[x, height / 2 + LEGO_STUD_HEIGHT / 2, z]}
          geometry={studGeometry}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
          material={material}
        />
      ))}
    </group>
  );
};
