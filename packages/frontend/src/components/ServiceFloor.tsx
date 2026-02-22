
import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Service } from '@servicescape/shared';
import type { Dependency } from '@servicescape/shared';
import { Text } from '@react-three/drei';
import { generateColor } from '../utils/colorGenerator';
import { useSelectionStore } from '../stores/selectionStore';
import { useInteraction } from '../hooks/useInteraction';
import { useAnimatedOpacity } from '../hooks/useAnimatedOpacity';
import { useOrganization } from '../contexts/OrganizationContext';
import { tokens } from '../styles/tokens';
import { LegoBrick } from './LegoBrick';
import { getStudVariant } from '../utils/legoGeometry';
import { labelStyles } from '../utils/labelStyles';
import { isServiceInDependencyChain } from '../utils/dependencyHelpers';
import { SERVICE_WIDTH, SERVICE_DEPTH } from '../utils/servicePositionCalculator';

const TEXT_Y_OFFSET_FACTOR = 0.5;
const TEXT_Y_OFFSET_FIXED = 0.1;

export interface ServiceFloorProps {
  service: Service;
  position: [number, number, number];
  height?: number;
  /** Building-level opacity passed from FloorContainer. */
  opacity?: number;
  /** The teamId / building this service belongs to (used for service-level opacity). */
  buildingId?: string;
  /** Dependencies of the currently selected service (passed from FloorContainer). */
  dependencies?: Dependency[];
}

export const ServiceFloor: React.FC<ServiceFloorProps> = ({
  service,
  position,
  height = 1,
  opacity = 1.0,
  buildingId,
  dependencies = [],
}) => {
  const color = useMemo(() => generateColor(service.id), [service.id]);
  const selectedServiceId = useSelectionStore((state) => state.selectedServiceId);
  const selectedBuildingId = useSelectionStore((state) => state.selectedBuildingId);
  const selectionLevel = useSelectionStore((state) => state.selectionLevel);
  const { handleClick, handlePointerOver, handlePointerOut, hoveredId } = useInteraction();
  const { registerServicePosition } = useOrganization();
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (groupRef.current && typeof groupRef.current.updateMatrixWorld === 'function') {
        groupRef.current.updateMatrixWorld(true);
        const worldPos = new THREE.Vector3();
        groupRef.current.getWorldPosition(worldPos);
        registerServicePosition(service.id, [worldPos.x, worldPos.y, worldPos.z]);
    }
  }, [position, service.id, registerServicePosition]);

  const isSelected = selectedServiceId === service.id;
  const isHovered = hoveredId === service.id;

  // Calculate service-level target opacity.
  // When a specific service is selected within this building, fade out unrelated siblings.
  const targetOpacity = useMemo(() => {
    const inSelectedBuilding =
      buildingId !== undefined &&
      selectedBuildingId === buildingId &&
      selectionLevel === 'service' &&
      selectedServiceId !== null;

    if (!inSelectedBuilding) {
      // Defer to building-level opacity
      return opacity;
    }

    // This service IS the selected one
    if (service.id === selectedServiceId) return 1.0;

    // This service is directly connected to the selected one
    if (isServiceInDependencyChain(service.id, selectedServiceId!, dependencies)) return 1.0;

    // Unrelated sibling within the selected building
    return 0.2;
  }, [
    buildingId,
    selectedBuildingId,
    selectionLevel,
    selectedServiceId,
    service.id,
    dependencies,
    opacity,
  ]);

  const animatedOpacity = useAnimatedOpacity(targetOpacity);

  let displayColor = color;
  if (isSelected) displayColor = tokens.colors.primary;
  if (isHovered && !isSelected) displayColor = tokens.colors.primaryHover;

  return (
    <group
      ref={groupRef}
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
        opacity={animatedOpacity}
        transparent={animatedOpacity < 1.0}
      />
      <Text
        position={[0, height * TEXT_Y_OFFSET_FACTOR + TEXT_Y_OFFSET_FIXED, labelStyles.service.zOffset]}
        fontSize={labelStyles.service.fontSize}
        color="black"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={labelStyles.service.outlineWidth}
        outlineColor={labelStyles.service.outlineColor}
      >
        {service.name}
      </Text>
    </group>
  );
};
