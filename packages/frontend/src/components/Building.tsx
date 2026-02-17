import React, { useMemo } from 'react';
import { Team } from '@servicescape/shared';
import { Text } from '@react-three/drei';
import { FloorContainer } from './FloorContainer';

interface BuildingProps {
    team: Team;
    position: [number, number, number];
    domainPosition?: [number, number, number];
}

export const Building: React.FC<BuildingProps> = ({ team, position, domainPosition = [0, 0, 0] }) => {
    // Calculate world position for LOD
    // Building is at 'position' relative to 'domainPosition'
    const worldPosition: [number, number, number] = useMemo(() => [
        domainPosition[0] + position[0],
        domainPosition[1] + position[1],
        domainPosition[2] + position[2]
    ], [domainPosition, position]);
    
    return (
        <group position={position}>
            <FloorContainer 
                teamId={team.id} 
                position={[0, 0, 0]} 
                lodPosition={worldPosition} 
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
