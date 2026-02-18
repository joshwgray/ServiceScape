import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import DependencyEdge from '../DependencyEdge';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';

describe('DependencyEdge', () => {
  it('should render without crashing', () => {
    const start = new THREE.Vector3(0, 0, 0);
    const end = new THREE.Vector3(10, 0, 0);
    
    render(
      <Canvas>
        <DependencyEdge 
          start={start} 
          end={end} 
          color="#ff0000" 
          dashed={false} 
          opacity={1} 
        />
      </Canvas>
    );
  });
});
