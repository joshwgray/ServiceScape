
import { useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useSelectionStore } from '../stores/selectionStore';
import { useBubblePositionStore } from '../stores/bubblePositionStore';
import { useOrganization } from '../contexts/OrganizationContext';
import { projectToScreen } from '../utils/projection';

export const PositionTracker = () => {
  const { camera, size } = useThree();
  const selectedServiceId = useSelectionStore((state) => state.selectedServiceId);
  const { layout } = useOrganization();
  
  const setAnchor = useBubblePositionStore((state) => state.setAnchor);
  const setScreenPosition = useBubblePositionStore((state) => state.setScreenPosition);
  const setVisibility = useBubblePositionStore((state) => state.setVisibility);
  const clearAnchor = useBubblePositionStore((state) => state.clearAnchor);

  // Keep track of previous state to avoid redundant updates if needed, 
  // though for continuous projection (camera moving) we need to update every frame anyway.
  
  // We need to handle cleanup when unmounting or when selection is cleared
  useEffect(() => {
    if (!selectedServiceId) {
      clearAnchor();
    }
  }, [selectedServiceId, clearAnchor]);

  useFrame(() => {
    if (!layout) {
      clearAnchor();
      return;
    }

    if (!selectedServiceId) {
       // Already handled by useEffect, but safe to ignore
       return;
    }

    // Try to find position in services, teams, or domains
    const entityPos = 
      layout.services[selectedServiceId] || 
      layout.teams[selectedServiceId] || 
      layout.domains?.[selectedServiceId]; // Optional chaining for domains if not guaranteed
    
    // Determine the anchor position
    let worldPos: Vector3 | null = null;

    if (entityPos) {
       // Assuming layout positions are absolute world coordinates
       worldPos = new Vector3(entityPos.x, entityPos.y, entityPos.z);
    }

    if (worldPos) {
      // Update store
      // Update Anchor (World Position)
      setAnchor(worldPos);
      
      // Project to Screen
      const projection = projectToScreen(worldPos, camera, size.width, size.height);
      
      // Position bubble: Fixed at bottom corner, offset from edges
      const BUBBLE_MARGIN_BOTTOM = 100; // Space from bottom for bubble
      const BUBBLE_MARGIN_SIDE = 20;    // Space from left/right edge
      const BUBBLE_WIDTH = 300;          // Speech bubble width from SpeechBubble.tsx
      
      // Place bubble at bottom-left or bottom-right based on building position
      // If building is on left half of screen, bubble goes to bottom-right corner
      // If building is on right half of screen, bubble goes to bottom-left corner
      const isLeftSide = projection.x < size.width / 2;
      const bubbleX = isLeftSide 
        ? size.width - BUBBLE_WIDTH - BUBBLE_MARGIN_SIDE  // Bottom-right
        : BUBBLE_MARGIN_SIDE;                            // Bottom-left
      
      // Pin Y to bottom of screen
      const bubbleY = size.height - BUBBLE_MARGIN_BOTTOM;
      
      // Always update screen position every frame so bubble tracks the building
      setScreenPosition({ x: bubbleX, y: bubbleY });
      
      // Check if visible (NDC z-clip AND viewport x/y bounds)
      const isVisible = 
        projection.visible && 
        projection.x >= 0 && 
        projection.x <= size.width && 
        projection.y >= 0 && 
        projection.y <= size.height;

      // Update visibility flag for fade-out behavior
      setVisibility(isVisible);
    } else {
        // Selected item not found in layout
        setVisibility(false);
    }
  });

  return null;
};
