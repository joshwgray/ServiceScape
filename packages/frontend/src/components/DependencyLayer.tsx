import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useSelectionStore } from '../stores/selectionStore';
import { useDependencies } from '../hooks/useDependencies';
import { useOrganization } from '../contexts/OrganizationContext';
import DependencyEdge from './DependencyEdge';
import { getDependencyStyle } from '../utils/edgeStyles';
import { DEPENDENCY_TYPES } from '@servicescape/shared';

const DependencyLayer: React.FC = () => {
  const { selectedServiceId, dependencyFilters } = useSelectionStore();
  const { services, layout } = useOrganization();
  
  // Determine filter type for API
  const filterType = useMemo(() => {
    if (dependencyFilters.declared && dependencyFilters.observed) return undefined;
    if (dependencyFilters.declared) return DEPENDENCY_TYPES.DECLARED;
    if (dependencyFilters.observed) return DEPENDENCY_TYPES.OBSERVED;
    return 'NONE'; // Special case to fetch nothing
  }, [dependencyFilters]);

  // Check if selected ID is actually a service
  const isService = useMemo(() => {
    if (!selectedServiceId) return false;
    return services.some(s => s.id === selectedServiceId);
  }, [selectedServiceId, services]);

  // If both filters are off, we can skip fetching or pass a dummy valid type/null
  // Current useDependencies hook fetches if serviceId is present.
  // We can pass null serviceId if we want to skip.
  const queryServiceId = (filterType === 'NONE' || !isService) ? null : selectedServiceId;

  const { dependencies } = useDependencies(queryServiceId, filterType);

  if (!selectedServiceId || !layout || !dependencies.length) return null;

  return (
    <group>
      {dependencies.map((dep) => {
        // Find positions
        const startPos = layout.services[dep.fromServiceId];
        const endPos = layout.services[dep.toServiceId];

        if (!startPos || !endPos) return null;

        const startVector = new THREE.Vector3(startPos.x, startPos.y, startPos.z);
        const endVector = new THREE.Vector3(endPos.x, endPos.y, endPos.z);
        
        const style = getDependencyStyle(dep.type);

        return (
          <DependencyEdge
            key={dep.id}
            start={startVector}
            end={endVector}
            color={style.color}
            dashed={style.dashed}
            opacity={style.opacity}
          />
        );
      })}
    </group>
  );
};

export default DependencyLayer;
