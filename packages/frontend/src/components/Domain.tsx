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
import { calculateTreePositions } from '../utils/treePlacement';

/**
 * Simple hash function to generate a seed from a string
 */
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

/**
 * Seeded random number generator
 */
function createSeededRandom(seed: number) {
    let state = seed;
    return () => {
        state = (state * 1103515245 + 12345) & 0x7fffffff;
        return (state / 0x7fffffff);
    };
}

/**
 * Check if two positions are within a given radius
 */
function checkCollision(
    x1: number, z1: number, 
    x2: number, z2: number, 
    minDistance: number
): boolean {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const distance = Math.sqrt(dx * dx + dz * dz);
    return distance < minDistance;
}

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
    const farGeometry = useMemo(() => new THREE.BoxGeometry(10, 2, 10), []);

    // Calculate team positions with collision detection
    const teamPositions = useMemo(() => {
        if (teams.length === 0 || !layout?.domains) return new Map<string, [number, number, number]>();
        
        const DOMAIN_SIZE = 20;
        const MARGIN = 2; // 2-stud margin from edges
        const TEAM_SIZE = 3; // Approximate team building size
        const TREE_RADIUS = 1; // Approximate tree radius
        // For 2 visible studs between edges: building_radius (1.5) + clearance (2) + tree_radius (1) = 4.5
        const MIN_CENTER_DISTANCE = TEAM_SIZE / 2 + 2 + TREE_RADIUS; // Minimum center-to-center distance
        const MIN_BUILDING_DISTANCE = TEAM_SIZE + 2; // Minimum distance between building centers (3 + 2 = 5)
        const PLATE_TOP = 0.4;
        const MAX_ATTEMPTS = 50; // Maximum placement attempts per building
        
        // Get tree positions for this domain (relative to domain origin)
        const domainPos = layout.domains[domain.id] || { x: position[0], y: position[1], z: position[2] };
        const allTrees = calculateTreePositions(layout.domains, 600);
        const domainTrees = allTrees.filter(tree => {
            const [tx, , tz] = tree.position;
            // Check if tree is within this domain's bounds
            return tx >= domainPos.x && tx <= domainPos.x + DOMAIN_SIZE &&
                   tz >= domainPos.z && tz <= domainPos.z + DOMAIN_SIZE;
        }).map(tree => {
            // Convert to relative coordinates
            const [tx, , tz] = tree.position;
            return { x: tx - position[0], z: tz - position[2] };
        });
        
        const positions = new Map<string, [number, number, number]>();
        const placedBuildings: { x: number; z: number }[] = [];
        
        teams.forEach(team => {
            const seed = hashString(`${domain.id}-${team.id}`);
            const random = createSeededRandom(seed);
            let placed = false;
            
            for (let attempt = 0; attempt < MAX_ATTEMPTS && !placed; attempt++) {
                // Generate random position within safe bounds
                const randomX = MARGIN + random() * (DOMAIN_SIZE - 2 * MARGIN - TEAM_SIZE);
                const randomZ = MARGIN + random() * (DOMAIN_SIZE - 2 * MARGIN - TEAM_SIZE);
                
                // Check collision with trees
                let collidesTrees = false;
                for (const tree of domainTrees) {
                    if (checkCollision(randomX + TEAM_SIZE/2, randomZ + TEAM_SIZE/2, tree.x, tree.z, MIN_CENTER_DISTANCE)) {
                        collidesTrees = true;
                        break;
                    }
                }
                
                if (collidesTrees) continue;
                
                // Check collision with other buildings
                let collidesBuildings = false;
                for (const building of placedBuildings) {
                    if (checkCollision(randomX + TEAM_SIZE/2, randomZ + TEAM_SIZE/2, building.x, building.z, MIN_BUILDING_DISTANCE)) {
                        collidesBuildings = true;
                        break;
                    }
                }
                
                if (collidesBuildings) continue;
                
                // Valid position found
                placedBuildings.push({ x: randomX + TEAM_SIZE/2, z: randomZ + TEAM_SIZE/2 });
                positions.set(team.id, [randomX, PLATE_TOP, randomZ]);
                placed = true;
            }
            
            // Fallback if no position found after max attempts (shouldn't happen often)
            if (!placed) {
                const fallbackX = MARGIN + random() * (DOMAIN_SIZE - 2 * MARGIN - TEAM_SIZE);
                const fallbackZ = MARGIN + random() * (DOMAIN_SIZE - 2 * MARGIN - TEAM_SIZE);
                positions.set(team.id, [fallbackX, PLATE_TOP, fallbackZ]);
            }
        });
        
        return positions;
    }, [teams, domain.id, position, layout]);

    // LOD Rendering Logic
    if (lod === LODLevel.FAR) {
        // Simple Box
        return (
            <mesh position={position} geometry={farGeometry}>
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
            {teams.map((team) => {
                const teamPosition = teamPositions.get(team.id) || [0, 0.4, 0];
                
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
