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
      minDistance={5}
      maxDistance={2000}
      maxPolarAngle={Math.PI / 2 - 0.05}
      enableDamping
      dampingFactor={0.06}
      panSpeed={1.2}
      rotateSpeed={0.6}
      screenSpacePanning={false}
      makeDefault
    />
  );
};

export default CameraController;
