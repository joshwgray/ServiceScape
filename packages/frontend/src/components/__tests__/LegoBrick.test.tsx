import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { LegoBrick } from '../LegoBrick';

// Module-level store survives vi.mock hoisting
const materialStore: { instance: Record<string, any> | null } = { instance: null };

vi.mock('../../utils/legoMaterials', () => ({
  createLegoPlasticMaterial: (options: { color: string }) => {
    const mat = {
      color: options.color,
      opacity: 1.0,
      transparent: false,
      needsUpdate: false,
      type: 'MeshStandardMaterial',
    };
    materialStore.instance = mat;
    return mat;
  },
}));

// Mock THREE components for testing
vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn(),
}));

describe('LegoBrick', () => {
  beforeEach(() => {
    materialStore.instance = null;
  });

  it('renders correctly with basic props', () => {
    const { container } = render(
      <LegoBrick color="#ff0000" />
    );
    expect(container).toBeTruthy();
  });

  it('should apply opacity prop to material', () => {
    render(<LegoBrick color="#ff0000" opacity={0.5} />);

    expect(materialStore.instance).not.toBeNull();
    expect(materialStore.instance!.opacity).toBe(0.5);
    // opacity < 1.0 → transparent must be true
    expect(materialStore.instance!.transparent).toBe(true);
  });

  it('should apply transparent prop to material', () => {
    render(<LegoBrick color="#ff0000" transparent={true} />);

    expect(materialStore.instance).not.toBeNull();
    // Even with default opacity 1.0, explicit transparent=true should set it
    expect(materialStore.instance!.transparent).toBe(true);
  });

  it('should use full opacity and non-transparent when no opacity/transparent props are provided', () => {
    render(<LegoBrick color="#ff0000" />);

    expect(materialStore.instance).not.toBeNull();
    expect(materialStore.instance!.opacity).toBe(1.0);
    expect(materialStore.instance!.transparent).toBe(false);
  });

  it('should apply both opacity and transparent props to material', () => {
    render(<LegoBrick color="#ff0000" opacity={0.15} transparent={true} />);

    expect(materialStore.instance).not.toBeNull();
    expect(materialStore.instance!.opacity).toBe(0.15);
    expect(materialStore.instance!.transparent).toBe(true);
  });

  it('should not recreate material when only opacity changes (same color)', () => {
    const { rerender } = render(<LegoBrick color="#ff0000" opacity={1.0} />);
    const firstInstance = materialStore.instance;

    // Change opacity without changing color — material object must be the same instance
    rerender(<LegoBrick color="#ff0000" opacity={0.15} />);
    expect(materialStore.instance).toBe(firstInstance);

    // But opacity/transparent must be updated on the existing instance
    expect(materialStore.instance!.opacity).toBe(0.15);
    expect(materialStore.instance!.transparent).toBe(true);
  });
});

describe('LegoBrick material attachment (direct prop vs primitive)', () => {
  beforeEach(() => {
    materialStore.instance = null;
  });

  it('LegoBrick applies material to brick body correctly', () => {
    let root: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      root = ReactTestRenderer.create(<LegoBrick color="#ff0000" />);
    });

    // Find the brick body mesh (first mesh in the group)
    const meshNodes = root!.root.findAll(node => node.type === 'mesh');
    expect(meshNodes.length).toBeGreaterThanOrEqual(1);

    // Brick body (first mesh) must have material as a direct prop
    const brickBody = meshNodes[0];
    expect(brickBody.props.material).toBe(materialStore.instance);
  });

  it('LegoBrick applies material to all studs correctly', () => {
    let root: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      root = ReactTestRenderer.create(<LegoBrick color="#ff0000" studVariant="2x2" />);
    });

    const meshNodes = root!.root.findAll(node => node.type === 'mesh');

    // 2x2 variant → 4 studs + 1 brick body = 5 meshes total
    expect(meshNodes.length).toBe(5);

    // Every mesh must carry material as a direct prop (not via <primitive> children)
    meshNodes.forEach((mesh, idx) => {
      expect(mesh.props.material, `mesh[${idx}] should have direct material prop`).toBe(
        materialStore.instance
      );
    });
  });

  it('hover color applied to entire brick and all studs', () => {
    let root: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      root = ReactTestRenderer.create(<LegoBrick color="#ff0000" studVariant="2x2" />);
    });

    const initialMaterial = materialStore.instance;

    // Simulate parent changing the color prop on hover (yellow = hover highlight)
    act(() => {
      root.update(<LegoBrick color="#ffff00" studVariant="2x2" />);
    });

    // New material must have been created for the new color
    expect(materialStore.instance).not.toBe(initialMaterial);
    expect(materialStore.instance!.color).toBe('#ffff00');

    // All meshes (body + all studs) must reference the new material via direct prop
    const meshNodes = root!.root.findAll(node => node.type === 'mesh');
    expect(meshNodes.length).toBe(5);
    meshNodes.forEach((mesh, idx) => {
      expect(mesh.props.material, `mesh[${idx}] should have updated hover material`).toBe(
        materialStore.instance
      );
    });
  });
});
