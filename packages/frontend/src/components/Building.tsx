import React, { useMemo } from 'react';
import { Team } from '@servicescape/shared';
import { Text } from '@react-three/drei';
import { FloorContainer } from './FloorContainer';
import { useServiceData } from '../hooks/useServiceData';
import { useInteraction } from '../hooks/useInteraction';
import type { LayoutPositions } from '../services/apiClient';
import { labelStyles } from '../utils/labelStyles';

interface BuildingProps {
    team: Team;
    position: [number, number, number];
    domainPosition?: [number, number, number];
    layout?: LayoutPositions;
}

const FLOOR_HEIGHT = 0.5;
const FLOOR_SPACING = 0.1;

export const Building: React.FC<BuildingProps> = ({ team, position, domainPosition = [0, 0, 0], layout }) => {
    // Calculate world position for LOD.
    // Y uses domain Y only (not + position[1]) so that FloorContainer computes
    // service relative-Y from domain ground level (absPos.y - domainY), not from
    // plate-top. The building group is still visually raised to PLATE_TOP via
    // its 'position' prop; lodPosition Y just drives the service offset math.
    const worldPosition: [number, number, number] = useMemo(() => [
        domainPosition[0] + position[0],
        domainPosition[1],
        domainPosition[2] + position[2]
    ], [domainPosition, position]);
    
    // Get services to determine building height for hitbox
    const { services } = useServiceData(team.id);
    const { handleBuildingClick } = useInteraction();
    
    const totalHeight = useMemo(() => {
        if (!services.length) return 1; // Minimum height
        return services.length * (FLOOR_HEIGHT + FLOOR_SPACING);
    }, [services.length]);

    return (
        <group position={position}>
            {/* Invisible Ground-Level Hitbox for Building Selection */}
            {/* Thin plate at base to allow service clicks to pass through above */}
            <mesh 
                position={[0, 0.05, 0]} 
                onClick={handleBuildingClick(team.id)}
                renderOrder={-1}
            >
                <boxGeometry args={[4.2, 0.1, 2.2]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            
            <FloorContainer 
                teamId={team.id} 
                position={[0, 0, 0]} 
                lodPosition={worldPosition}
                layout={layout}
            />
            <Text
                position={[0, totalHeight + 0.5, 0]} // Adjusted label position to be above building
                fontSize={labelStyles.building.fontSize}
                color="black"
                anchorX="center"
                anchorY="bottom"
                outlineWidth={labelStyles.building.outlineWidth}
                outlineColor={labelStyles.building.outlineColor}
            >
                {team.name}
            </Text>
        </group>
    );
};
