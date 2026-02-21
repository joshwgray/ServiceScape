
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { Domain } from '../Domain';
import { useSelectionStore } from '../../stores/selectionStore';
import { useLOD } from '../../hooks/useLOD';
import { LODLevel } from '../../utils/lodLevels';

// Mock hooks
vi.mock('../../hooks/useLOD');
vi.mock('../../stores/selectionStore');
vi.mock('../../contexts/OrganizationContext', () => ({
  useOrganization: () => ({ 
    layout: {},
    teams: [
      { id: 't1', name: 'Team 1', domainId: 'd1' },
      { id: 'other-team', name: 'Other Team', domainId: 'd2' }
    ]
  })
}));
vi.mock('../../stores/visibilityStore', () => ({
  useVisibilityStore: () => ({ isDomainVisible: () => true })
}));
vi.mock('../../hooks/useAnimatedOpacity', () => ({
  useAnimatedOpacity: (target: number) => target // Immediate update for testing
}));

// Mock THREE.js materials to spy on them
const mockMaterialConstructor = vi.fn();
// We'll use a simpler mock strategy: a singleton capturing the LATEST material created
let lastMaterialInstance: any = null;

vi.mock('three', async () => {
  const actual = await vi.importActual<typeof import('three')>('three');
  return {
    ...actual,
    MeshStandardMaterial: class {
      opacity: number;
      transparent: boolean;
      needsUpdate: boolean;
      color: any;

      constructor(args: any) {
        mockMaterialConstructor(args);
        this.transparent = args?.transparent || false;
        this.opacity = args?.opacity !== undefined ? args.opacity : 1;
        this.needsUpdate = false;
        this.color = new actual.Color();
        lastMaterialInstance = this;
      }
    },
    BoxGeometry: class { constructor() {} },
    // Mock other geometries/meshes if needed
    Group: class { constructor() {} },
    Mesh: class { constructor() {} } 
  };
});

describe('Domain FAR LOD Transparency', () => {
  const mockDomain = { id: 'd1', name: 'Domain 1', color: '#ff0000' };
  
  beforeEach(() => {
    vi.clearAllMocks();
    lastMaterialInstance = null;
    
    // Default to FAR LOD
    (useLOD as any).mockReturnValue(LODLevel.FAR);
  });

  it('should render opaque when nothing selected', () => {
    (useSelectionStore as any).mockImplementation((selector: any) => selector({
      selectedBuildingId: null
    }));

    render(<Domain domain={mockDomain} position={[0, 0, 0]} />);
    
    expect(lastMaterialInstance).not.toBeNull();
    if(lastMaterialInstance) {
        expect(lastMaterialInstance.opacity).toBe(1);
        expect(lastMaterialInstance.transparent).toBe(false);
    }
  });

  it('should render with reduced opacity when another building is selected', () => {
    (useSelectionStore as any).mockImplementation((selector: any) => selector({
      selectedBuildingId: 'other-team'
    }));

    render(<Domain domain={mockDomain} position={[0, 0, 0]} />);
    
    expect(lastMaterialInstance).not.toBeNull();
    if(lastMaterialInstance) {
        expect(lastMaterialInstance.opacity).toBeLessThan(1);
        expect(lastMaterialInstance.transparent).toBe(true);
    }
  });

  it('should remain opaque when a building IN THIS DOMAIN is selected', () => {
      (useSelectionStore as any).mockImplementation((selector: any) => selector({
        selectedBuildingId: 't1' // t1 belongs to d1 in mock
      }));
  
      render(<Domain domain={mockDomain} position={[0, 0, 0]} />);
      
      expect(lastMaterialInstance).not.toBeNull();
      if(lastMaterialInstance) {
          expect(lastMaterialInstance.opacity).toBe(1);
          expect(lastMaterialInstance.transparent).toBe(false); // assuming opaque means transparent=false but check logic
      }
  });
});
