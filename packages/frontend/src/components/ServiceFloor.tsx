
import React, { useMemo } from 'react';
import { Service } from '@servicescape/shared';
import { Text } from '@react-three/drei';
import { generateColor } from '../utils/colorGenerator';
import { useSelectionStore } from '../stores/selectionStore';
import { useInteraction } from '../hooks/useInteraction';
import { tokens } from '../styles/tokens';
import { LegoBrick } from './LegoBrick';
import { getStudVariant } from '../utils/legoGeometry';

const SERVICE_WIDTH = 1.8;
const SERVICE_DEPTH = 1.8;
const TEXT_Z_OFFSET = 0.9;
const TEXT_Y_OFFSET_FACTOR = 0.5;
const TEXT_Y_OFFSET_FIXED = 0.1;

export interface ServiceFloorProps {
  service: Service;
  position: [number, number, number];
  height?: number;
}

export const ServiceFloor: React.FC<ServiceFloorProps> = ({ service, position, height = 1 }) => {
  const color = useMemo(() => generateColor(service.id), [service.id]);
  const selectedServiceId = useSelectionStore((state) => state.selectedServiceId);
  const { handleClick, handlePointerOver, handlePointerOut, hoveredId } = useInteraction();
  
  const isSelected = selectedServiceId === service.id;
  const isHovered = hoveredId === service.id;
  
  let displayColor = color;
  if (isSelected) displayColor = tokens.colors.primary;
  if (isHovered && !isSelected) displayColor = tokens.colors.primaryHover;

  return (
    <group 
      position={position} 
      onClick={handleClick(service.id)}
      onPointerOver={handlePointerOver(service.id)}
      onPointerOut={handlePointerOut}
    >
      {/* Service Geometry: LEGO Brick */}
      <LegoBrick
        width={SERVICE_WIDTH}
        height={height}
        depth={SERVICE_DEPTH}
        color={displayColor}
        studVariant={getStudVariant(service.id)}
        castShadow
        receiveShadow
      />
      <Text
        position={[0, height * TEXT_Y_OFFSET_FACTOR + TEXT_Y_OFFSET_FIXED, TEXT_Z_OFFSET]}
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
