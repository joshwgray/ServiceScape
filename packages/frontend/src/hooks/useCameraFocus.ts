import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useSelectionStore } from '../stores/selectionStore';
import { LayoutPositions } from '../services/apiClient';

export const getTargetPosition = (id: string, layout: LayoutPositions): Vector3 | null => {
  // Check services
  const servicePos = layout.services?.[id];
  if (servicePos) return new Vector3(servicePos.x, servicePos.y, servicePos.z);
  
  // Check teams (optional if focus on teams is desired)
  const teamPos = layout.teams?.[id];
  if (teamPos) return new Vector3(teamPos.x, teamPos.y, teamPos.z);
  
  // Check domains (optional)
  const domainPos = layout.domains?.[id];
  if (domainPos) return new Vector3(domainPos.x, domainPos.y, domainPos.z);

  return null;
};

export const useCameraFocus = (layout: LayoutPositions | null) => {
  const { controls } = useThree() as any; // Cast because controls might not be on default type
  const selectedServiceId = useSelectionStore((state) => state.selectedServiceId);
  
  // Target position to animate towards
  const targetRef = useRef<Vector3 | null>(null);
  
  useEffect(() => {
    if (selectedServiceId && layout) {
      const target = getTargetPosition(selectedServiceId, layout);
      if (target) {
        targetRef.current = target;
      }
    } else {
        // Optional: clear target or reset view logic
        // targetRef.current = null; 
        // Keeping it focused on last selection is usually better UX than snap back
    }
  }, [selectedServiceId, layout]);

  useFrame((_, delta) => {
    if (targetRef.current && controls) {
      const step = 2 * delta; // speed
      
      // Move controls target to object position
      controls.target.lerp(targetRef.current, step);
      controls.update();
    }
  });
};
