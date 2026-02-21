import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Scene from '../Scene';

// Mock zustand stores
const mockClearSelection = vi.fn();
const mockClearAnchor = vi.fn();

vi.mock('../../stores/selectionStore', () => ({
  useSelectionStore: (selector: any) => selector({ clearSelection: mockClearSelection }),
}));

vi.mock('../../stores/bubblePositionStore', () => ({
  useBubblePositionStore: (selector: any) => selector({ clearAnchor: mockClearAnchor }),
}));

// Mock Scene children components to simplify test
vi.mock('../Ground', () => ({ default: () => null }));
vi.mock('../TreeLayer', () => ({ TreeLayer: () => null }));
vi.mock('../CameraController', () => ({ default: () => null }));
vi.mock('../CityLayout', () => ({ CityLayout: () => null }));
vi.mock('../DependencyLayer', () => ({ default: () => null }));
vi.mock('../PositionTracker', () => ({ PositionTracker: () => null }));

// Mock Canvas to test onPointerMissed
// We render a div that calls onPointerMissed when clicked
vi.mock('@react-three/fiber', async () => {
    return {
        // We need to define Canvas as a default export or just Canvas depending on how it's imported
        // The Scene component imports: `import { Canvas } from '@react-three/fiber';`
        Canvas: ({ onPointerMissed, children, ...props }: any) => (
            <div data-testid="canvas-container" onClick={() => onPointerMissed?.()} {...props}>
                {children}
            </div>
        ),
    };
});

// Mock drei
vi.mock('@react-three/drei', () => ({
    PerspectiveCamera: () => null,
}));

describe('Scene', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders without crashing', () => {
        render(<Scene />);
        expect(screen.getByTestId('canvas-container')).toBeDefined();
    });

    it('calls clearSelection and clearAnchor on background click (pointer missed)', () => {
        render(<Scene />);
        
        const canvas = screen.getByTestId('canvas-container');
        fireEvent.click(canvas);
        
        expect(mockClearSelection).toHaveBeenCalled();
        expect(mockClearAnchor).toHaveBeenCalled();
    });
});
