
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { FloorContainer } from '../FloorContainer';
import { useSelectionStore } from '../../stores/selectionStore';
import { useLOD } from '../../hooks/useLOD';
import { LODLevel } from '../../utils/lodLevels';
import * as THREE from 'three';

// Mock simple hooks
vi.mock('../../hooks/useServiceData', () => ({
  useServiceData: () => ({
    services: [
      { id: 's1', name: 'Service 1' },
      { id: 's2', name: 'Service 2' }
    ]
  })
}));
vi.mock('../../hooks/useDependencies', () => ({
  useDependencies: () => ({ dependencies: [] })
}));
vi.mock('../../hooks/useLOD', () => ({
  useLOD: vi.fn()
}));
vi.mock('../../stores/selectionStore', () => ({
  useSelectionStore: vi.fn()
}));
vi.mock('../../hooks/useAnimatedOpacity', () => ({
  useAnimatedOpacity: (target: number) => target // Immediate update for test
}));

// Mock React useLayoutEffect to avoid JSDOM issues with refs
vi.mock('react', async () => {
    const actual = await vi.importActual<any>('react');
    return {
        ...actual,
        useLayoutEffect: (_effect: any, _deps: any) => {}, // No-op
    };
});

// Mock THREE.js
vi.mock('three', async () => {
  const actual = await vi.importActual<typeof import('three')>('three');
  
  const MeshStandardMaterial = class {
      static lastInstance: any = null;
      opacity: number;
      transparent: boolean;
      needsUpdate: boolean;
      vertexColors: boolean;
      
      constructor(args?: any) {
        this.opacity = 1;
        this.transparent = false;
        this.needsUpdate = false;
        this.vertexColors = false;
        if (args) Object.assign(this, args);
        // @ts-ignore
        (this.constructor as any).lastInstance = this;
      }
  } as any;

  return {
    ...actual,
    BoxGeometry: class { constructor() {} },
    MeshStandardMaterial: MeshStandardMaterial,
    InstancedMesh: class {
      instanceMatrix = { needsUpdate: false };
      instanceColor = { needsUpdate: false };
      constructor() {}
      setMatrixAt() {}
      setColorAt() {} 
      dispose() {}
    },
    Object3D: class {
      position = { set: vi.fn() };
      scale = { set: vi.fn() };
      rotation = { set: vi.fn() };
      quaternion = { setFromEuler: vi.fn() };
      updateMatrix = vi.fn();
      matrix = { clone: vi.fn(), copy: vi.fn() };
      constructor() {}
    },
    Color: class { set() {} },
    Matrix4: class { constructor() {} copy() { return this; } },
    Vector3: class { constructor() {} set() { return this; } }
  };
});



// Suppress console warnings
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) return;
    originalConsoleError(...args);
  };
});

afterEach(() => {
  console.error = originalConsoleError;
});

describe('FloorContainer FAR LOD Transparency', () => {
  const mockTeamId = 'team-1';

  beforeEach(() => {
    vi.clearAllMocks();
    (useLOD as any).mockReturnValue(LODLevel.FAR);
    // Reset captured material
    (THREE as any).MeshStandardMaterial.lastInstance = null;
  });
  
  const getLastMaterial = () => {
    // access the mocked module via import
    return (THREE as any).MeshStandardMaterial.lastInstance;
  };

  it('should be opaque when no building is selected', () => {
    (useSelectionStore as any).mockImplementation((selector: any) => selector({
      selectedBuildingId: null
    }));

    render(
      <FloorContainer 
        teamId={mockTeamId} 
        lodPosition={[0, 0, 0]} 
        position={[0, 0, 0]} 
      />
    );

    const mat = getLastMaterial();
    expect(mat).not.toBeNull();
    if (mat) {
      expect(mat.opacity).toBe(1);
      // Depending on logic, but usually transparent=false if opaque
      expect(mat.transparent).toBe(false);
    }
  });

  it('should be opaque when THIS building is selected', () => {
    (useSelectionStore as any).mockImplementation((selector: any) => selector({
      selectedBuildingId: mockTeamId
    }));

    render(
      <FloorContainer 
        teamId={mockTeamId} 
        lodPosition={[0, 0, 0]} 
        position={[0, 0, 0]} 
      />
    );

    const mat = getLastMaterial();
    expect(mat).not.toBeNull();
    if (mat) {
      expect(mat.opacity).toBe(1);
      expect(mat.transparent).toBe(false);
    }
  });

  it('should be transparent with low opacity when ANOTHER building is selected', () => {
    (useSelectionStore as any).mockImplementation((selector: any) => selector({
      selectedBuildingId: 'other-team'
    }));

    render(
      <FloorContainer 
        teamId={mockTeamId} 
        lodPosition={[0, 0, 0]} 
        position={[0, 0, 0]} 
      />
    );

    const mat = getLastMaterial();
    expect(mat).not.toBeNull();
    if (mat) {
      expect(mat.opacity).toBe(0.15); // Matches target logic
      expect(mat.transparent).toBe(true);
    }
  });
});
