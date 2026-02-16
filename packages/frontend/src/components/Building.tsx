import React, { useMemo } from 'react';
import { Team } from '@servicescape/shared';
import { Text } from '@react-three/drei';
import { generateColor } from '../utils/colorGenerator';

interface BuildingProps {
    team: Team;
    position: [number, number, number];
}

export const Building: React.FC<BuildingProps> = ({ team, position }) => {
    // Generate color only once
    const color = useMemo(() => generateColor(team.id), [team.id]);
    
    // Simple building geometry: Box
    // Use position passed from parent. Group position is already set, so children are relative to it if needed.
    // However, if position is passed as prop, we use it on group.
    
    return (
        <group position={position}>
            <mesh castShadow receiveShadow position={[0, 1.5, 0]}>
                <boxGeometry args={[2, 3, 2]} />
                <meshStandardMaterial color={color} />
            </mesh>
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
