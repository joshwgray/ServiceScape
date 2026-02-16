import React, { useState, useEffect, useMemo } from 'react';
import { Domain as DomainType, Team } from '@servicescape/shared';
import { useLOD } from '../hooks/useLOD';
import { LODLevel } from '../utils/lodLevels';
import { useVisibilityStore } from '../stores/visibilityStore';
import { getTeams } from '../services/apiClient';
import { generateColor } from '../utils/colorGenerator';
import { Building } from './Building.tsx';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

interface DomainProps {
    domain: DomainType;
    position: [number, number, number];
}

export const Domain: React.FC<DomainProps> = ({ domain, position }) => {
    const vecPosition = useMemo(() => new THREE.Vector3(...position), [position]);
    const lod = useLOD(vecPosition);
    
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
                <boxGeometry args={[10, 5, 10]} />
                <meshStandardMaterial color={color} />
            </mesh>
        );
    }

    // MEDIUM+ : Detailed Plane with Border
    return (
        <group position={position}>
            {/* Ground Plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[20, 20]} />
                <meshStandardMaterial color={color} opacity={0.5} transparent />
            </mesh>
            
            {/* Border */}
            <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(20, 1, 20)]} />
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
                // Determine position for team/building within domain.
                // For now, simple grid or random based on index
                // Assuming team metadata has position or we calculate simple offset.
                // Let's do simple circle arrangement for now or grid.
                const offset = 5;
                const angle = (index / teams.length) * Math.PI * 2;
                const x = Math.cos(angle) * offset;
                const z = Math.sin(angle) * offset;
                
                return (
                    <Building 
                        key={team.id} 
                        team={team} 
                        position={[x, 0, z]} 
                    />
                );
            })}
        </group>
    );
};
