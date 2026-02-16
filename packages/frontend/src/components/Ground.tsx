import React from 'react';
import { DoubleSide } from 'three';

const Ground: React.FC = () => {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial color="#1a1a1a" side={DoubleSide} />
      </mesh>
      <gridHelper args={[2000, 100, '#444444', '#222222']} position={[0, 0, 0]} />
    </group>
  );
};

export default Ground;
