import React from 'react';
import { OrbitControls } from '@react-three/drei';
import { useOrganization } from '../contexts/OrganizationContext';
import { useCameraFocus } from '../hooks/useCameraFocus';

const CameraController: React.FC = () => {
  const { layout } = useOrganization();
  
  // Hook up camera focus logic
  useCameraFocus(layout);

  return (
    <OrbitControls 
      minDistance={10} 
      maxDistance={800} 
      maxPolarAngle={Math.PI / 2 - 0.1} // Prevent going below ground
      makeDefault // Ensure these controls are the default for the scene
    />
  );
};

export default CameraController;
