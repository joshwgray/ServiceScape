import { useState, useCallback, useEffect } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useSelectionStore } from '../stores/selectionStore';
import { useBubblePositionStore } from '../stores/bubblePositionStore';
import { useOrganization } from '../contexts/OrganizationContext';

export const useInteraction = () => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const selectService = useSelectionStore((state) => state.selectService);
  const clearSelection = useSelectionStore((state) => state.clearSelection);
  const setAnchor = useBubblePositionStore((state) => state.setAnchor);
  const clearAnchor = useBubblePositionStore((state) => state.clearAnchor);
  const { layout, services } = useOrganization();
  const selectedBuildingId = useSelectionStore((state) => state.selectedBuildingId);
  const selectBuilding = useSelectionStore((state) => state.selectBuilding);
  
  const handleBuildingClick = useCallback(
    (buildingId: string) => (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      selectBuilding(buildingId);
      
      const entity = layout?.teams[buildingId];
      if (entity) {
          setAnchor(new Vector3(entity.x, entity.y, entity.z));
      }
    },
    [selectBuilding, layout, setAnchor]
  );
  
  const handleServiceClick = useCallback(
    (serviceId: string) => (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      
      // Auto-selection logic:
      // Find service team
      const service = services.find(s => s.id === serviceId);
      const buildingId = service?.teamId;

      if (buildingId && buildingId !== selectedBuildingId) {
        // If building is not focused, select building first
        selectBuilding(buildingId);
        
        // Update anchor to building position
        const teamEntity = layout?.teams[buildingId];
        if (teamEntity) {
            setAnchor(new Vector3(teamEntity.x, teamEntity.y, teamEntity.z));
        }
      } else {
        // Otherwise select the service (if building focused or no building found/fallback)
        selectService(serviceId);
        
        // Set anchor to service position
        const entity = layout?.services[serviceId];
        if (entity) {
            setAnchor(new Vector3(entity.x, entity.y, entity.z));
        }
      }
    },
    [services, selectedBuildingId, selectBuilding, selectService, layout, setAnchor]
  );
  
  const handleClick = handleServiceClick;

  useEffect(() => {
    return () => {
      document.body.style.cursor = 'auto'; // Reset cursor on unmount
    };
  }, []);

  const handlePointerOver = useCallback(
    (id: string) => (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (hoveredId !== id) {
        setHoveredId(id);
        // Change cursor to pointer
        document.body.style.cursor = 'pointer';
      }
    },
    [hoveredId]
  );

  const handlePointerOut = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setHoveredId(null);
      document.body.style.cursor = 'auto';
    },
    []
  );

  const handleBackgroundClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      // Only clear if clicked on background directly, not propagated
      // R3F handles raycasting, so usually a click on background won't have intersections with other objects if setup correctly.
      // But here usually we attach onClick to a ground plane or handle misses.
      // This function can be used for that.
      e.stopPropagation(); // Prevent propagation if nested
      clearSelection();
      clearAnchor();
    },
    [clearSelection, clearAnchor]
  );

  return {
    hoveredId,
    handleClick,
    handlePointerOver,
    handlePointerOut,
    handleBackgroundClick,
    handleBuildingClick,
    handleServiceClick,
  };
};
