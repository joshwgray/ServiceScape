import React, { useMemo } from 'react';
import { useOrganization } from '../contexts/OrganizationContext';
import { calculateTreePositions } from '../utils/treePlacement';
import { LegoTree } from './LegoTree';

export const TreeLayer: React.FC = () => {
    const { layout, loading } = useOrganization();

    const trees = useMemo(() => {
        if (loading || !layout || !layout.domains) return [];
        return calculateTreePositions(layout.domains, 600);
    }, [layout, loading]);

    if (loading || !layout) return null;

    return (
        <group>
            {trees.map((tree) => (
                <LegoTree 
                    key={tree.seed} 
                    position={tree.position} 
                    seed={tree.seed} 
                />
            ))}
        </group>
    );
};
