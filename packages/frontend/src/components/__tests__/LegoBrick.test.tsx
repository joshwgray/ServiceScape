import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
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
