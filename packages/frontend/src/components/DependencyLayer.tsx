import React, { useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useSelectionStore } from '../stores/selectionStore';
import { useDependencies } from '../hooks/useDependencies';
import { useOrganization } from '../contexts/OrganizationContext';
import LegoDependencyPath from './LegoDependencyPath';
import { getDependencyStyle } from '../utils/edgeStyles';
import { DEPENDENCY_TYPES } from '@servicescape/shared';
import { calculateDoorPosition } from '../utils/servicePositionCalculator';

const DependencyLayer: React.FC = () => {
  const selectedServiceId = useSelectionStore((state) => state.selectedServiceId);
  const dependencyFilters = useSelectionStore((state) => state.dependencyFilters);
  const selectionLevel = useSelectionStore((state) => state.selectionLevel);
  
  const { services, renderedPositions } = useOrganization();
  const [visibleCount, setVisibleCount] = useState(0);
  
  // Determine filter type for API
  const filterType = useMemo(() => {
    if (dependencyFilters.declared && dependencyFilters.observed) return undefined;
    if (dependencyFilters.declared) return DEPENDENCY_TYPES.DECLARED;
    if (dependencyFilters.observed) return DEPENDENCY_TYPES.OBSERVED;
    return 'NONE'; // Special case to fetch nothing
  }, [dependencyFilters]);

  // Only run logic if we are at service level selection
  const isServiceSelection = selectionLevel === 'service';

  // Check if selected ID is actually a service
  const isService = useMemo(() => {
    if (!selectedServiceId) return false;
    return services.some(s => s.id === selectedServiceId);
  }, [selectedServiceId, services]);

  // If both filters are off or not service selection, we can skip fetching
  const queryServiceId = (filterType === 'NONE' || !isService || !isServiceSelection) ? null : selectedServiceId;

  const { dependencies } = useDependencies(queryServiceId, filterType);
  
  // Staggered animation effect
  useEffect(() => {
    // Reset when selected service changes or dependencies change, or selection mode changes
    // Using dependencies.length ensures we don't reset just because the array reference changed
    setVisibleCount(0);
  }, [queryServiceId, dependencies.length, filterType, isServiceSelection]);

  useEffect(() => {
    // Gating check: only animate if we are in service selection mode
    if (!isServiceSelection || !dependencies.length) return;
    
    // If we haven't shown all dependencies yet
    if (visibleCount < dependencies.length) {
      const timer = setTimeout(() => {
        setVisibleCount(prev => Math.min(prev + 1, dependencies.length));
      }, 100); // 100ms delay between each path starting
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [visibleCount, dependencies.length, isServiceSelection]);


  if (!selectedServiceId || !dependencies.length || !isServiceSelection) return null;

  // Only render up to visibleCount
  const visibleDependencies = dependencies.slice(0, visibleCount);

  return (
    <group>
      {visibleDependencies.map((dep) => {
        // Find positions
        const startRendered = renderedPositions[dep.fromServiceId];
        const endRendered = renderedPositions[dep.toServiceId];

        // Only use rendered positions, no fallback to layout
        const startRaw: [number, number, number] | null = startRendered || null;
        const endRaw: [number, number, number] | null = endRendered || null;

        if (!startRaw || !endRaw) return null;

        // Calculate door positions facing each other
        const startDoor = calculateDoorPosition(startRaw, endRaw);
        const endDoor = calculateDoorPosition(endRaw, startRaw);

        const startVector = new THREE.Vector3(...startDoor);
        const endVector = new THREE.Vector3(...endDoor);
        
        const style = getDependencyStyle(dep.type);

        return (
          <LegoDependencyPath
            key={dep.id}
            start={startVector}
            end={endVector}
            color={style.color}
          />
        );
      })}
    </group>
  );
};

export default DependencyLayer;
