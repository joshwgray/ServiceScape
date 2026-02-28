import React from 'react';
import { Text } from '@react-three/drei';
import type { DomainHealthScore, DomainHealthStatus } from '@servicescape/shared';

export const DOMAIN_HEALTH_COLORS: Record<DomainHealthStatus, string> = {
  healthy: '#4ade80',
  'at-risk': '#fbbf24',
  fragile: '#ef4444',
};

export function getDomainHealthColor(status: DomainHealthStatus): string {
  return DOMAIN_HEALTH_COLORS[status];
}

interface HealthBadgeProps {
  health: DomainHealthScore;
  position?: [number, number, number];
}

export const HealthBadge: React.FC<HealthBadgeProps> = ({
  health,
  position = [16.5, 1.5, 3.5],
}) => {
  const scorePercent = Math.round(health.score * 100);
  const badgeColor = getDomainHealthColor(health.status);

  return (
    <group position={position}>
      <mesh renderOrder={3}>
        <planeGeometry args={[3.6, 1.4]} />
        <meshBasicMaterial color={badgeColor} transparent opacity={0.9} depthWrite={false} />
      </mesh>
      <Text
        position={[0, 0, 0.05]}
        fontSize={0.45}
        color="black"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.015}
        outlineColor="#ffffff"
      >
        {`${scorePercent}%`}
      </Text>
    </group>
  );
};
