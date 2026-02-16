import { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { LODLevel, LOD_THRESHOLDS } from '../utils/lodLevels';

export const useLOD = (position: Vector3): LODLevel => {
  const [lod, setLod] = useState<LODLevel>(LODLevel.NEAR);
  const lodRef = useRef<LODLevel>(LODLevel.NEAR);

  useFrame(({ camera }) => {
    if (!position) return;
    
    const distance = camera.position.distanceTo(position);
    
    let newLod = LODLevel.FAR;
    if (distance < LOD_THRESHOLDS.NEAR) {
      newLod = LODLevel.NEAR;
    } else if (distance <= LOD_THRESHOLDS.MEDIUM) {
      newLod = LODLevel.MEDIUM;
    }

    if (newLod !== lodRef.current) {
      lodRef.current = newLod;
      setLod(newLod);
    }
  });

  return lod;
};
