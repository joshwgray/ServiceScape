import { useState, useCallback, useEffect } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { useSelectionStore } from '../stores/selectionStore';

export const useInteraction = () => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const selectService = useSelectionStore((state) => state.selectService);
  const clearSelection = useSelectionStore((state) => state.clearSelection);

  const handleClick = useCallback(
    (id: string) => (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      selectService(id);
    },
    [selectService]
  );
  
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
    },
    [clearSelection]
  );

  return {
    hoveredId,
    handleClick,
    handlePointerOver,
    handlePointerOut,
    handleBackgroundClick,
  };
};
