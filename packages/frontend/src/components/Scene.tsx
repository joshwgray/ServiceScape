import React from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import Ground from './Ground';
import { TreeLayer } from './TreeLayer';
import CameraController from './CameraController';
import { CityLayout } from './CityLayout';
import DependencyLayer from './DependencyLayer';
import { PositionTracker } from './PositionTracker';
import { useSelectionStore } from '../stores/selectionStore';
import { useBubblePositionStore } from '../stores/bubblePositionStore';

const Scene: React.FC = () => {
  const clearSelection = useSelectionStore((state) => state.clearSelection);
  const clearAnchor = useBubblePositionStore((state) => state.clearAnchor);

  const handlePointerMissed = () => {
    clearSelection();
    clearAnchor();
  };

  return (
    <Canvas
      shadows
      className="canvas-container"
      onPointerMissed={handlePointerMissed}
      gl={{ antialias: true }}
      scene={{ background: new THREE.Color('#E8F4FD') }}
    >
      <PerspectiveCamera makeDefault position={[100, 100, 100]} near={0.5} far={5000} />
      <CameraController />

      {/* Bright ambient to eliminate dark undersides */}
      <ambientLight intensity={0.8} color="#ffffff" />

      {/* Strong key light from upper-left — creates crisp LEGO toy shadows */}
      <directionalLight
        position={[150, 300, 100]}
        intensity={2.0}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-near={1}
        shadow-camera-far={2000}
        shadow-camera-left={-300}
        shadow-camera-right={300}
        shadow-camera-top={300}
        shadow-camera-bottom={-300}
        shadow-bias={-0.0005}
      />

      {/* Soft fill light from opposite side to reduce harsh shadows */}
      <directionalLight
        position={[-100, 150, -100]}
        intensity={0.6}
        color="#cce8ff"
      />

      <Ground />
      <TreeLayer />
      <CityLayout />
      <DependencyLayer />
      <PositionTracker />
      {/* No fog — LEGO toys are photographed in clean studio light */}
    </Canvas>
  );
};

export default Scene;
