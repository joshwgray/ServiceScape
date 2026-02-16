import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Team } from '@servicescape/shared';
import { Building } from '../Building';

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

describe('Building Component', () => {
    const mockTeam: Team = { id: 't1', domainId: 'd1', name: 'Team 1' };

    it('renders building mesh', () => {
        // Just verify it renders without crashing
        const { container } = render(<Building team={mockTeam} position={[0,0,0]} />);
        // JSDOM will render custom elements for mesh
        // We can inspect container.innerHTML to see if it emitted something
        expect(container.innerHTML).toBeTruthy();
    });
});
