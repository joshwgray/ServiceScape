import React, { useState, useEffect, useMemo } from 'react';
import { Domain as DomainType, Team } from '@servicescape/shared';
import { useLOD } from '../hooks/useLOD';
import { LODLevel } from '../utils/lodLevels';
import { useVisibilityStore } from '../stores/visibilityStore';
import { useOrganization } from '../contexts/OrganizationContext';
import { getTeams } from '../services/apiClient';
import type { LayoutPositions } from '../services/apiClient';
import { generateColor } from '../utils/colorGenerator';
import { getLegoPlateColor } from '../utils/legoColors';
import { Building } from './Building.tsx';
import { LegoBaseplate } from './LegoBaseplate';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

interface DomainProps {
    domain: DomainType;
    position: [number, number, number];
    layout?: LayoutPositions;
}

export const Domain: React.FC<DomainProps> = ({ domain, position, layout: layoutProp }) => {
    const vecPosition = useMemo(() => new THREE.Vector3(...position), [position]);
    const lod = useLOD(vecPosition);
    const { layout: contextLayout } = useOrganization();
    
    // Use prop layout if provided, otherwise use context layout
    const layout = layoutProp || contextLayout;
    
    // Visibility check using selector
    const isVisible = useVisibilityStore((state) => state.isDomainVisible(domain.id));
    
    const [teams, setTeams] = useState<Team[]>([]);
    const [teamsLoaded, setTeamsLoaded] = useState(false);

    useEffect(() => {
        let mounted = true;
        // Only fetch teams if visible AND LOD allows details (MEDIUM or NEAR)
        const shouldFetchTeams = isVisible && !teamsLoaded && (lod === LODLevel.MEDIUM || lod === LODLevel.NEAR);
        
        if (shouldFetchTeams) {
            getTeams(domain.id).then((data) => {
                if(mounted) {
                    setTeams(data);
                    setTeamsLoaded(true);
                }
            }).catch(console.error);
        }
        return () => { mounted = false; };
    }, [isVisible, teamsLoaded, domain.id, lod]);

    const color = generateColor(domain.id);

    // LOD Rendering Logic
    if (lod === LODLevel.FAR) {
        // Simple Box
        return (
            <mesh position={position}>
                <boxGeometry args={[10, 2, 10]} />
                <meshStandardMaterial color={color} />
            </mesh>
        );
    }

    // MEDIUM+ : LEGO snap-on domain plate
    return (
        <group position={position}>
            {/* Domain Snap-on Plate — offset to cover the +x/+z quadrant where buildings actually sit */}
            <LegoBaseplate
                width={20}
                depth={20}
                thickness={0.4}
                color={getLegoPlateColor(domain.id)}
                position={[10, 0.2, 10]}
            />

            {/* Label */}
            <Text 
                position={[10, 2, 10]} 
                fontSize={0.5} 
                color="black"
                anchorX="center"
                anchorY="middle"
            >
                {domain.name}
            </Text>

            {/* Buildings (Teams) */}
            {teams.map((team, index) => {
                let teamPosition: [number, number, number] = [0, 0, 0];
                
                // Plate top is at y=0.4 (thickness=0.4, center at 0.2, top at 0.4)
                const PLATE_TOP = 0.4;
                if (layout?.teams[team.id]) {
                    const absPos = layout.teams[team.id];
                    // Calculate relative position since group is already at domain position
                    // Y uses PLATE_TOP so buildings sit on top of the domain plate
                    teamPosition = [
                        absPos.x - position[0],
                        PLATE_TOP,
                        absPos.z - position[2]
                    ];
                } else {
                    // Fallback to circular arrangement if layout missing
                    const angle = (index / teams.length) * Math.PI * 2;
                    teamPosition = [Math.cos(angle) * 20 + 50, PLATE_TOP, Math.sin(angle) * 20 + 50];
                }
                
                return (
                    <Building 
                        key={team.id} 
                        team={team} 
                        position={teamPosition}
                        domainPosition={position}
                        layout={layout || undefined}
                    />
                );
            })}
        </group>
    );
};
