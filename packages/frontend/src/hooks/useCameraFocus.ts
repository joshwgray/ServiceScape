import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3, MathUtils } from 'three';
import { useSelectionStore } from '../stores/selectionStore';
import { LayoutPositions } from '../services/apiClient';

/**
 * Calculates the target position for the camera controls based on the selected object type.
 * Priority order: Services -> Teams -> Domains
 */
export const getTargetPosition = (id: string, layout: LayoutPositions): Vector3 | null => {
  // Check services
  const servicePos = layout.services?.[id];
  if (servicePos) return new Vector3(servicePos.x, servicePos.y, servicePos.z);
  
  // Check teams (optional if focus on teams is desired)
  const teamPos = layout.teams?.[id];
  if (teamPos) return new Vector3(teamPos.x + 1.5, teamPos.y, teamPos.z + 1.5);
  
  // Check domains (optional)
  const domainPos = layout.domains?.[id];
  if (domainPos) return new Vector3(domainPos.x + 10, domainPos.y, domainPos.z + 10);

  return null;
};

/**
 * Calculates the ideal camera position based on the target position and object type.
 * Uses fixed offsets from the target to determine "distance".
 * 
 * Priority order: Services -> Teams -> Domains
 * 
 * Offsets:
 * - Services: (0, 20, 20)
 * - Teams: (0, 40, 50)
 * - Domains: (0, 100, 150)
 */
export const getIdealCameraPosition = (id: string, layout: LayoutPositions, target: Vector3): Vector3 | null => {
  // Check services first to ensure consistent priority with getTargetPosition
  if (layout.services?.[id]) {
      return target.clone().add(new Vector3(0, 20, 20));
  }
  if (layout.teams?.[id]) {
      return target.clone().add(new Vector3(0, 40, 50));
  }
  if (layout.domains?.[id]) {
      return target.clone().add(new Vector3(0, 100, 150));
  }
  return null;
};

/**
 * Calculates the ideal camera position for a building-level selection.
 * Uses a (0, 30, 35) offset — less zoomed than service but more than team/domain.
 */
export const getBuildingCameraPosition = (buildingId: string, layout: LayoutPositions, target: Vector3): Vector3 | null => {
  if (layout.teams?.[buildingId]) {
    return target.clone().add(new Vector3(0, 30, 35));
  }
  return null;
};

export const useCameraFocus = (layout: LayoutPositions | null) => {
  const { controls } = useThree() as any; // Cast because controls might not be on default type
  const selectedServiceId = useSelectionStore((state) => state.selectedServiceId);
  const selectedBuildingId = useSelectionStore((state) => state.selectedBuildingId);
  const selectionLevel = useSelectionStore((state) => state.selectionLevel);
  
  // Target position to animate towards
  const targetRef = useRef<Vector3 | null>(null);
  const cameraPosRef = useRef<Vector3 | null>(null);
  
  useEffect(() => {
    if (selectionLevel === 'service' && selectedServiceId && layout) {
      const target = getTargetPosition(selectedServiceId, layout);
      if (target) {
        targetRef.current = target;
        const idealPos = getIdealCameraPosition(selectedServiceId, layout, target);
        if (idealPos) {
          cameraPosRef.current = idealPos;
        }
      }
    } else if (selectionLevel === 'building' && selectedBuildingId && layout) {
      const target = getTargetPosition(selectedBuildingId, layout);
      if (target) {
        targetRef.current = target;
        const idealPos = getBuildingCameraPosition(selectedBuildingId, layout, target);
        if (idealPos) {
          cameraPosRef.current = idealPos;
        }
      }
    } else {
        // Optional: clear target or reset view logic
        // targetRef.current = null; 
        // Keeping it focused on last selection is usually better UX than snap back
    }
  }, [selectedServiceId, selectedBuildingId, selectionLevel, layout]);

  useFrame((state, delta) => {
    // Clamp step to [0, 1] to avoid overshoot on frame drops
    const step = MathUtils.clamp(2 * delta, 0, 1);
    
    // Animate target
    if (targetRef.current && controls) {
      controls.target.lerp(targetRef.current, step);
      controls.update();
    }
    
    // Animate camera position
    if (cameraPosRef.current) {
        state.camera.position.lerp(cameraPosRef.current, step);
        
        // Stop animating position if close enough to allow user control taking over
        if (state.camera.position.distanceTo(cameraPosRef.current) < 0.1) {
            cameraPosRef.current = null;
        }
    }
  });
};
