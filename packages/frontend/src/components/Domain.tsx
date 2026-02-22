import React, { useState, useEffect, useMemo } from 'react';
import { Domain as DomainType, Team } from '@servicescape/shared';
import { useLOD } from '../hooks/useLOD';
import { useAnimatedOpacity } from '../hooks/useAnimatedOpacity';
import { useSelectionStore } from '../stores/selectionStore';
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
import { labelStyles } from '../utils/labelStyles';

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
 * Check if two positions are within a given radius (circular collision)
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

/**
 * Check if a rectangle (building) collides with a point (tree center) with minimum clearance
 */
function checkRectanglePointCollision(
    rectX: number, rectZ: number, 
    rectWidth: number, rectDepth: number,
    pointX: number, pointZ: number,
    minClearance: number
): boolean {
    // Expand rectangle by minClearance in all directions
    const expandedMinX = rectX - minClearance;
    const expandedMaxX = rectX + rectWidth + minClearance;
    const expandedMinZ = rectZ - minClearance;
    const expandedMaxZ = rectZ + rectDepth + minClearance;
    
    // Check if point is inside expanded rectangle
    return pointX >= expandedMinX && pointX <= expandedMaxX &&
           pointZ >= expandedMinZ && pointZ <= expandedMaxZ;
}

/**
 * Check if two rectangles (buildings) collide with minimum clearance
 */
function checkRectangleCollision(
    rect1X: number, rect1Z: number, rect1Width: number, rect1Depth: number,
    rect2X: number, rect2Z: number, rect2Width: number, rect2Depth: number,
    minClearance: number
): boolean {
    // Expand first rectangle by minClearance
    const expanded1MinX = rect1X - minClearance;
    const expanded1MaxX = rect1X + rect1Width + minClearance;
    const expanded1MinZ = rect1Z - minClearance;
    const expanded1MaxZ = rect1Z + rect1Depth + minClearance;
    
    // Check AABB collision
    return !(rect2X + rect2Width < expanded1MinX || 
             rect2X > expanded1MaxX ||
             rect2Z + rect2Depth < expanded1MinZ ||
             rect2Z > expanded1MaxZ);
}

interface DomainProps {
    domain: DomainType;
    position: [number, number, number];
    layout?: LayoutPositions;
}

export const Domain: React.FC<DomainProps> = ({ domain, position, layout: layoutProp }) => {
    const vecPosition = useMemo(() => new THREE.Vector3(...position), [position]);
    const lod = useLOD(vecPosition);
    const { layout: contextLayout, teams: allTeams } = useOrganization();
    
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
    const farMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color(color) }), [color]);

    // Handle Selection & Transparency
    const selectedBuildingId = useSelectionStore((state) => state.selectedBuildingId);
    
    const targetOpacity = useMemo(() => {
        if (!selectedBuildingId) return 1.0;

        // Check if selected building belongs to this domain using GLOBAL data
        // This ensures correct behavior even if local teams aren't loaded (FAR LOD)
        const selectedTeam = allTeams?.find(t => t.id === selectedBuildingId);
        if (selectedTeam && selectedTeam.domainId === domain.id) {
            return 1.0;
        }
        
        // Default to fading if another building is selected 
        return 0.15;
    }, [selectedBuildingId, allTeams, domain.id]);

    const animatedOpacity = useAnimatedOpacity(targetOpacity);

    useEffect(() => {
        if (!farMaterial) return;
        const newTransparent = animatedOpacity < 1.0;
        const transparentChanged = farMaterial.transparent !== newTransparent;
        farMaterial.opacity = animatedOpacity;
        farMaterial.transparent = newTransparent;
        if (transparentChanged) {
            farMaterial.needsUpdate = true;
        }
    }, [farMaterial, animatedOpacity]);

    // Calculate team positions with collision detection
    const teamPositions = useMemo(() => {
        if (teams.length === 0 || !layout?.domains) return new Map<string, [number, number, number]>();
        
        const DOMAIN_SIZE = 20;
        const MARGIN = 2; // 2-stud margin from domain edges
        const BUILDING_WIDTH = 4; // Building width (4 studs)
        const BUILDING_DEPTH = 2; // Building depth (2 studs)
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
                // Account for building dimensions: 4-wide (X) and 2-deep (Z)
                const randomX = MARGIN + random() * (DOMAIN_SIZE - 2 * MARGIN - BUILDING_WIDTH);
                const randomZ = MARGIN + random() * (DOMAIN_SIZE - 2 * MARGIN - BUILDING_DEPTH);
                
                // Check collision with trees (trees are points with radius)
                let collidesTrees = false;
                for (const tree of domainTrees) {
                    if (checkRectanglePointCollision(
                        randomX, randomZ, 
                        BUILDING_WIDTH, BUILDING_DEPTH,
                        tree.x, tree.z,
                        2 // 2-stud minimum clearance
                    )) {
                        collidesTrees = true;
                        break;
                    }
                }
                
                if (collidesTrees) continue;
                
                // Check collision with other buildings (rectangle-to-rectangle)
                let collidesBuildings = false;
                for (const building of placedBuildings) {
                    if (checkRectangleCollision(
                        randomX, randomZ, BUILDING_WIDTH, BUILDING_DEPTH,
                        building.x, building.z, building.width, building.depth,
                        2 // 2-stud minimum clearance  
                    )) {
                        collidesBuildings = true;
                        break;
                    }
                }
                
                if (collidesBuildings) continue;
                
                // Valid position found
                placedBuildings.push({ 
                    x: randomX, 
                    z: randomZ,
                    width: BUILDING_WIDTH,
                    depth: BUILDING_DEPTH
                });
                positions.set(team.id, [randomX, PLATE_TOP, randomZ]);
                placed = true;
            }
            
            // Fallback if no position found after max attempts (shouldn't happen often)
            if (!placed) {
                const fallbackX = MARGIN + random() * (DOMAIN_SIZE - 2 * MARGIN - BUILDING_WIDTH);
                const fallbackZ = MARGIN + random() * (DOMAIN_SIZE - 2 * MARGIN - BUILDING_DEPTH);
                positions.set(team.id, [fallbackX, PLATE_TOP, fallbackZ]);
            }
        });
        
        return positions;
    }, [teams, domain.id, position, layout]);

    // LOD Rendering Logic
    if (lod === LODLevel.FAR) {
        // Simple Box
        return (
            <mesh position={position} geometry={farGeometry} material={farMaterial}>
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
                fontSize={labelStyles.domain.fontSize} 
                color="black"
                anchorX="center"
                anchorY="middle"
                outlineWidth={labelStyles.domain.outlineWidth}
                outlineColor={labelStyles.domain.outlineColor}
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
