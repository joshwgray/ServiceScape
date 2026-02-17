
import React, { useMemo } from 'react';
import { Service } from '@servicescape/shared';
import { Text } from '@react-three/drei';
import { generateColor } from '../utils/colorGenerator';

interface ServiceFloorProps {
  service: Service;
  position: [number, number, number];
  height?: number;
}

export const ServiceFloor: React.FC<ServiceFloorProps> = ({ service, position, height = 1 }) => {
  const color = useMemo(() => generateColor(service.id), [service.id]);

  return (
    <group position={position}>
      {/* Service Geometry: Box */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.8, height, 1.8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text
        position={[0, height / 2 + 0.1, 0.9]}
        fontSize={0.2}
        color="black"
        anchorX="center"
        anchorY="bottom"
      >
        {service.name}
      </Text>
    </group>
  );
};
