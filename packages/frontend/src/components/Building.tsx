import React, { useMemo } from 'react';
import { Team } from '@servicescape/shared';
import { Text } from '@react-three/drei';
import { FloorContainer } from './FloorContainer';
import type { LayoutPositions } from '../services/apiClient';

interface BuildingProps {
    team: Team;
    position: [number, number, number];
    domainPosition?: [number, number, number];
    layout?: LayoutPositions;
}

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
    
    return (
        <group position={position}>
            <FloorContainer 
                teamId={team.id} 
                position={[0, 0, 0]} 
                lodPosition={worldPosition}
                layout={layout}
            />
            <Text
                position={[0, 3.5, 0]}
                fontSize={0.5}
                color="black"
                anchorX="center"
                anchorY="bottom"
            >
                {team.name}
            </Text>
        </group>
    );
};
