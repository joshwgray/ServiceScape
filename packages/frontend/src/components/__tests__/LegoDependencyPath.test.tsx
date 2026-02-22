import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import * as THREE from 'three';

// --- Mocks (must be declared before imports of the modules they mock) ---

vi.mock('../../utils/legoMaterials', () => ({
  createLegoPlasticMaterial: vi.fn((opts: { color: string }) => ({
    color: opts.color,
    type: 'MeshStandardMaterial',
  })),
}));

vi.mock('../../utils/legoPathGenerator', () => ({
  generateLegoPath: vi.fn(() => [
    { position: [0, 0.5, 0] as [number, number, number] },
    { position: [1, 0.5, 0] as [number, number, number] },
    { position: [2, 0.5, 0] as [number, number, number] },
    { position: [3, 0.5, 0] as [number, number, number] },
    { position: [4, 0.5, 0] as [number, number, number] },
  ]),
}));

vi.mock('../../hooks/usePathAnimation', () => ({
  usePathAnimation: vi.fn(() => ({ visibleBricks: 5, isComplete: true })),
}));

// --- Import after vi.mock ---
import LegoDependencyPath from '../LegoDependencyPath';
import { generateLegoPath } from '../../utils/legoPathGenerator';
import { createLegoPlasticMaterial } from '../../utils/legoMaterials';
import { usePathAnimation } from '../../hooks/usePathAnimation';

describe('LegoDependencyPath', () => {
  const mockStart = new THREE.Vector3(0, 0.5, 0);
  const mockEnd = new THREE.Vector3(5, 0.5, 0);

  beforeEach(() => {
    vi.clearAllMocks();

    (generateLegoPath as ReturnType<typeof vi.fn>).mockReturnValue([
      { position: [0, 0.5, 0] as [number, number, number] },
      { position: [1, 0.5, 0] as [number, number, number] },
      { position: [2, 0.5, 0] as [number, number, number] },
      { position: [3, 0.5, 0] as [number, number, number] },
      { position: [4, 0.5, 0] as [number, number, number] },
    ]);

    (usePathAnimation as ReturnType<typeof vi.fn>).mockReturnValue({
      visibleBricks: 5,
      isComplete: true,
    });

    (createLegoPlasticMaterial as ReturnType<typeof vi.fn>).mockImplementation(
      (opts: { color: string }) => ({ color: opts.color, type: 'MeshStandardMaterial' })
    );
  });

  it('should render without crashing', () => {
    const { container } = render(
      <LegoDependencyPath start={mockStart} end={mockEnd} color="#3b82f6" />
    );
    expect(container).toBeTruthy();
  });

  it('should render multiple brick segments along path', () => {
    render(<LegoDependencyPath start={mockStart} end={mockEnd} color="#3b82f6" />);

    expect(generateLegoPath).toHaveBeenCalledWith(
      expect.objectContaining({ x: 0, y: 0.5, z: 0 }),
      expect.objectContaining({ x: 5, y: 0.5, z: 0 }),
      expect.any(Number)
    );
  });

  it('should use LEGO material with appropriate color', () => {
    render(<LegoDependencyPath start={mockStart} end={mockEnd} color="#f97316" />);

    expect(createLegoPlasticMaterial).toHaveBeenCalledWith(
      expect.objectContaining({ color: '#f97316' })
    );
  });

  it('should pass total path length to usePathAnimation', () => {
    render(<LegoDependencyPath start={mockStart} end={mockEnd} color="#3b82f6" />);

    // generateLegoPath returns 5 segments, so usePathAnimation is called with 5 + pathVersion string
    expect(usePathAnimation).toHaveBeenCalledWith(5, expect.any(String));
  });

  it('should animate appearance brick-by-brick using visibleBricks count', () => {
    // Only 2 bricks visible
    (usePathAnimation as ReturnType<typeof vi.fn>).mockReturnValue({
      visibleBricks: 2,
      isComplete: false,
    });

    const { container } = render(
      <LegoDependencyPath start={mockStart} end={mockEnd} color="#3b82f6" />
    );

    // Only visibleBricks (2) out of 5 should be rendered
    expect(usePathAnimation).toHaveBeenCalledWith(5, expect.any(String));
    // Core acceptance criterion: rendered mesh count === visibleBricks
    expect(container.querySelectorAll('mesh')).toHaveLength(2);
  });

  it('should use declared dependency color when color prop is blue', () => {
    const declaredColor = '#3b82f6';
    render(<LegoDependencyPath start={mockStart} end={mockEnd} color={declaredColor} />);

    expect(createLegoPlasticMaterial).toHaveBeenCalledWith(
      expect.objectContaining({ color: declaredColor })
    );
  });

  it('should use observed dependency color when color prop is orange', () => {
    const observedColor = '#f97316';
    render(<LegoDependencyPath start={mockStart} end={mockEnd} color={observedColor} />);

    expect(createLegoPlasticMaterial).toHaveBeenCalledWith(
      expect.objectContaining({ color: observedColor })
    );
  });
});
