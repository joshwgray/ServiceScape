import React, { useMemo } from 'react';
import * as THREE from 'three';
import { generateLegoPath } from '../utils/legoPathGenerator';
import { usePathAnimation } from '../hooks/usePathAnimation';
import { createLegoPlasticMaterial } from '../utils/legoMaterials';

/** World-unit side length of each path brick */
const BRICK_SIZE = 1.0;

/** Height of each path brick - tall enough to be visible above ground plate */
const BRICK_HEIGHT = 0.8;

/** Slight gap between bricks for a tile-like look */
const BRICK_VISUAL_SCALE = 0.85;

export interface LegoDependencyPathProps {
  /** Starting position of the dependency path */
  start: THREE.Vector3;
  /** Ending position of the dependency path */
  end: THREE.Vector3;
  /** Hex color for the path bricks (from edgeStyles / getDependencyStyle) */
  color: string;
}

/**
 * Renders an animated LEGO-brick-style dependency path between two 3D points.
 *
 * The path is:
 * - Stepped / blocky (L-shaped, axis-aligned) — not a smooth curve
 * - Made of small 1×1 LEGO-plastic brick segments
 * - Revealed brick-by-brick with a ~20 ms delay per brick
 */
const LegoDependencyPath: React.FC<LegoDependencyPathProps> = ({ start, end, color }) => {
  // Stable string key derived from coordinate primitives.
  // Using primitive deps (not object identity) means this updates correctly even
  // when the caller mutates a Vector3 in-place between renders (common in Three.js).
  const pathVersion = `${start.x},${start.y},${start.z}:${end.x},${end.y},${end.z}`;

  // Generate stepped path segments — deps are coordinate primitives so the path
  // recalculates whenever any individual coordinate changes, not just on new objects.
  const segments = useMemo(
    () =>
      generateLegoPath(
        { x: start.x, y: start.y, z: start.z },
        { x: end.x, y: end.y, z: end.z },
        BRICK_SIZE
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [start.x, start.y, start.z, end.x, end.y, end.z]
  );

  // Animate brick-by-brick reveal; pathVersion ensures a reset when coordinates
  // change even if the total segment count happens to be the same.
  const { visibleBricks } = usePathAnimation(segments.length, pathVersion);

  // Shared geometry and material (created once per unique color)
  const brickGeometry = useMemo(
    () =>
      new THREE.BoxGeometry(
        BRICK_SIZE * BRICK_VISUAL_SCALE,
        BRICK_HEIGHT,
        BRICK_SIZE * BRICK_VISUAL_SCALE
      ),
    []
  );

  const brickMaterial = useMemo(() => createLegoPlasticMaterial({ color }), [color]);

  // Only slice the visible bricks for rendering
  const visibleSegments = segments.slice(0, visibleBricks);

  return (
    <group>
      {visibleSegments.map((seg, index) => (
        <mesh
          key={index}
          geometry={brickGeometry}
          position={seg.position}
        >
          <primitive object={brickMaterial} attach="material" />
        </mesh>
      ))}
    </group>
  );
};

export default LegoDependencyPath;
