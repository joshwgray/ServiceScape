import React, { useMemo } from 'react';
import { useOrganization } from '../contexts/OrganizationContext';
import { useProgressiveLoad, VisibleObject } from '../hooks/useProgressiveLoad';
import { Domain } from './Domain';

// For fallback positioning
const DEFAULT_POSITION: [number, number, number] = [0, 0, 0];

export const CityLayout: React.FC = () => {
    const { domains, loading, error } = useOrganization();
    
    // Transform domains for progressive load tracking
    const visibleObjects = useMemo<VisibleObject[]>(() => {
        return domains.map(d => ({
            id: d.id,
            position: (d.metadata?.position as [number, number, number]) || DEFAULT_POSITION,
            radius: 15 // Approx radius for intersection check (Domain is ~20 units)
        }));
    }, [domains]);

    useProgressiveLoad(visibleObjects);

    if (loading) return null;
    if (error) {
        console.error("Failed to load domains", error);
        return null; 
    }

    return (
        <group>
            {domains.map(domain => {
                const position = (domain.metadata?.position as [number, number, number]) || DEFAULT_POSITION;
                return (
                    <Domain 
                        key={domain.id} 
                        domain={domain} 
                        position={position} 
                    />
                );
            })}
        </group>
    );
};
