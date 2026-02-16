import React from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import Ground from './Ground';
import CameraController from './CameraController';

const Scene: React.FC = () => {
  return (
    <Canvas shadows className="canvas-container">
      <PerspectiveCamera makeDefault position={[100, 100, 100]} />
      <CameraController />
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[100, 200, 100]} 
        intensity={1} 
        castShadow 
        shadow-mapSize={[2048, 2048]} 
      />
      <Ground />
      <fog attach="fog" args={['#111', 100, 1000]} />
    </Canvas>
  );
};

export default Scene;
