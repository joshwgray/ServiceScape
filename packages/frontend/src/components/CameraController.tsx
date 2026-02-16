import React from 'react';
import { OrbitControls } from '@react-three/drei';

const CameraController: React.FC = () => {
  return (
    <OrbitControls 
      minDistance={10} 
      maxDistance={800} 
      maxPolarAngle={Math.PI / 2 - 0.1} // Prevent going below ground
    />
  );
};

export default CameraController;
