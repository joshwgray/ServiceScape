import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { RiskLevel } from '../hooks/useGraphMetrics';

interface RiskOverlayProps {
  riskLevel: RiskLevel;
  glowIntensity: number;
  totalHeight: number;
}

const RISK_COLORS: Record<Exclude<RiskLevel, 'none'>, string> = {
  amber: '#f59e0b',
  red: '#ef4444',
};

export const RiskOverlay: React.FC<RiskOverlayProps> = ({
  riskLevel,
  glowIntensity,
  totalHeight,
}) => {
  const color = useMemo(
    () => (riskLevel === 'none' ? null : RISK_COLORS[riskLevel]),
    [riskLevel]
  );

  if (!color || glowIntensity <= 0) {
    return null;
  }

  return (
    <mesh position={[0, Math.max(0.8, totalHeight / 2), 0]}>
      <boxGeometry args={[4.8, Math.max(1.2, totalHeight + 0.6), 2.8]} />
      <meshStandardMaterial
        color={new THREE.Color(color)}
        emissive={new THREE.Color(color)}
        emissiveIntensity={glowIntensity}
        transparent
        opacity={0.18}
        depthWrite={false}
      />
    </mesh>
  );
};
