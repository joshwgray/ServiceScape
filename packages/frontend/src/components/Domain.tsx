import React, { useState, useEffect, useMemo } from 'react';
import { Domain as DomainType, Team } from '@servicescape/shared';
import { useLOD } from '../hooks/useLOD';
import { LODLevel } from '../utils/lodLevels';
import { useVisibilityStore } from '../stores/visibilityStore';
import { useOrganization } from '../contexts/OrganizationContext';
import { getTeams } from '../services/apiClient';
import type { LayoutPositions } from '../services/apiClient';
import { generateColor } from '../utils/colorGenerator';
import { Building } from './Building.tsx';
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
                <boxGeometry args={[50, 5, 50]} />
                <meshStandardMaterial color={color} />
            </mesh>
        );
    }

    // MEDIUM+ : Detailed Plane with Border
    return (
        <group position={position}>
            {/* Ground Plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[100, 100]} />
                <meshStandardMaterial color={color} opacity={0.5} transparent />
            </mesh>
            
            {/* Border */}
            <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(100, 1, 100)]} />
                <lineBasicMaterial color="white" />
            </lineSegments>

            {/* Label */}
            <Text 
                position={[0, 2, 0]} 
                fontSize={1} 
                color="black"
                anchorX="center"
                anchorY="middle"
            >
                {domain.name}
            </Text>

            {/* Buildings (Teams) */}
            {teams.map((team, index) => {
                let teamPosition: [number, number, number] = [0, 0, 0];
                
                if (layout?.teams[team.id]) {
                    const absPos = layout.teams[team.id];
                    // Calculate relative position since group is already at domain position
                    teamPosition = [
                        absPos.x - position[0],
                        absPos.y - position[1],
                        absPos.z - position[2]
                    ];
                } else {
                    // Fallback to circular arrangement if layout missing
                    const offset = 5;
                    const angle = (index / teams.length) * Math.PI * 2;
                    const x = Math.cos(angle) * offset;
                    const z = Math.sin(angle) * offset;
                    teamPosition = [x, 0, z];
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
