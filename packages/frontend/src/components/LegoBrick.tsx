import React, { useMemo } from 'react';
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
}

export const LegoBrick: React.FC<LegoBrickProps> = ({
  width = 1.8,
  height = 0.5,
  depth = 1.8,
  color,
  studVariant = '2x2',
  castShadow = false,
  receiveShadow = false,
}) => {
  const studPositions = getStudPositions(studVariant, width, depth);
  const material = useMemo(() => createLegoPlasticMaterial({ color }), [color]);

  return (
    <group>
      {/* Brick body */}
      <mesh castShadow={castShadow} receiveShadow={receiveShadow}>
        <boxGeometry args={[width, height, depth]} />
        <primitive object={material} attach="material" />
      </mesh>

      {/* Studs on top */}
      {studPositions.map(([x, , z], index) => (
        <mesh
          key={index}
          position={[x, height / 2 + LEGO_STUD_HEIGHT / 2, z]}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
        >
          <cylinderGeometry args={[LEGO_STUD_RADIUS, LEGO_STUD_RADIUS, LEGO_STUD_HEIGHT, 16]} />
          <primitive object={material} attach="material" />
        </mesh>
      ))}
    </group>
  );
};
