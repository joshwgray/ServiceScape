import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Team } from '@servicescape/shared';
import { Building } from '../Building';
import * as useLOD from '../../hooks/useLOD';
import * as useServiceData from '../../hooks/useServiceData';
import { LODLevel } from '../../utils/lodLevels';

// Mock R3F
vi.mock('@react-three/fiber', () => ({
    useFrame: vi.fn(),
    extend: vi.fn(),
    useThree: () => ({ camera: { position: { distanceTo: vi.fn() } } })
}));

// Mock Drei
vi.mock('@react-three/drei', () => ({
    Text: () => <div data-testid="drei-text">Text</div>
}));

// Mock hooks
vi.mock('../../hooks/useLOD', () => ({
    useLOD: vi.fn(),
}));
vi.mock('../../hooks/useServiceData', () => ({
    useServiceData: vi.fn(),
}));

describe('Building Component', () => {
    const mockTeam: Team = { id: 't1', domainId: 'd1', name: 'Team 1' };

    it('renders building mesh', () => {
        (useLOD.useLOD as any).mockReturnValue(LODLevel.FAR);
        (useServiceData.useServiceData as any).mockReturnValue({
            services: [],
            loading: false,
            error: null,
        });

        // Just verify it renders without crashing
        const { container } = render(<Building team={mockTeam} position={[0,0,0]} domainPosition={[0,0,0]} />);
        expect(container.innerHTML).toBeTruthy();
    });
});
