import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { generateCurvePoints } from '../utils/edgeRouting';

interface DependencyEdgeProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: string;
  dashed?: boolean;
  opacity?: number;
}

const DependencyEdge: React.FC<DependencyEdgeProps> = ({
  start,
  end,
  color,
  dashed = false,
  opacity = 1,
}) => {
  const points = useMemo(() => generateCurvePoints(start, end, 50), [start, end]);

  return (
    <Line
      points={points}
      color={color}
      lineWidth={2}
      dashed={dashed}
      opacity={opacity}
      transparent
    />
  );
};

export default DependencyEdge;
