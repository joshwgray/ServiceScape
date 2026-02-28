import React, { useMemo } from 'react';
import { useOrganization } from '../contexts/OrganizationContext';
import { useDomainHealth } from '../hooks/useDomainHealth';
import { useGraphMetrics } from '../hooks/useGraphMetrics';
import { useProgressiveLoad, VisibleObject } from '../hooks/useProgressiveLoad';
import { Domain } from './Domain';
import type { Position3D } from '@servicescape/shared';
import { useSelectionStore } from '../stores/selectionStore';

// For fallback positioning
const DEFAULT_POSITION: [number, number, number] = [0, 0, 0];

/**
 * Convert Position3D object to Three.js position tuple
 */
const toTuple = (pos: Position3D): [number, number, number] => [pos.x, pos.y, pos.z];

export const CityLayout: React.FC = () => {
    const { domains, services, loading, error, layout } = useOrganization();
    const metricsMode = useSelectionStore((state) => state.metricsMode);
    const { domainHealthMap } = useDomainHealth(Boolean(metricsMode));
    const { teamRiskMap } = useGraphMetrics(metricsMode ? services : []);
    
    // Transform domains for progressive load tracking
    const visibleObjects = useMemo<VisibleObject[]>(() => {
        if (!layout) {
            // Fallback: use default positions for progressive load tracking
            return domains.map(d => ({
                id: d.id,
                position: { x: 0, y: 0, z: 0 },
                radius: 15
            }));
        }
        
        return domains.map(d => ({
            id: d.id,
            position: layout.domains[d.id] || { x: 0, y: 0, z: 0 },
            radius: 15 // Approx radius for intersection check (Domain is ~20 units)
        }));
    }, [domains, layout]);

    useProgressiveLoad(visibleObjects);

    if (loading) return null;
    if (error) {
        console.error("Failed to load domains", error);
        return null; 
    }

    return (
        <group>
            {domains.map(domain => {
                const position = (layout && layout.domains[domain.id])
                    ? toTuple(layout.domains[domain.id]) 
                    : DEFAULT_POSITION;
                return (
                    <Domain 
                        key={domain.id} 
                        domain={domain} 
                        position={position}
                        layout={layout || undefined}
                        teamRiskMap={teamRiskMap}
                        domainHealth={metricsMode ? domainHealthMap[domain.id] : undefined}
                    />
                );
            })}
        </group>
    );
};
