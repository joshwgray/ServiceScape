import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Domain } from '../Domain';
import { LODLevel } from '../../utils/lodLevels';
import * as apiClient from '../../services/apiClient';

// Mock R3F hooks
vi.mock('@react-three/fiber', () => ({
    useFrame: vi.fn(),
    extend: vi.fn(),
    useThree: () => ({ camera: { position: { distanceTo: vi.fn() } } })
}));

// Mock Drei
vi.mock('@react-three/drei', () => ({
    Text: () => <div data-testid="drei-text">Text</div>
}));

// Mock useLOD
const mockUseLOD = vi.fn();
vi.mock('../../hooks/useLOD', () => ({
    useLOD: () => mockUseLOD()
}));

// Mock Visibility Store
const mockIsDomainVisible = vi.fn();
vi.mock('../../stores/visibilityStore', () => ({
    useVisibilityStore: (selector: any) => {
        const state = {
            isDomainVisible: mockIsDomainVisible,
            visibleDomains: new Set()
        };
        return selector(state);
    }
}));

// Mock API
vi.mock('../../services/apiClient', () => ({
    getTeams: vi.fn().mockResolvedValue([{ id: 't1', name: 'Team 1' }])
}));

// Mock Building
vi.mock('../Building', () => ({
    Building: () => <div data-testid="building">Building</div>
}));

describe('Domain Component', () => {
    const mockDomain = { id: 'd1', name: 'Domain 1', metadata: { position: [0, 0, 0] } };

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseLOD.mockReturnValue(LODLevel.FAR);
        mockIsDomainVisible.mockReturnValue(false);
    });

    it('renders simple representation at LOD FAR (no buildings)', () => {
        render(<Domain domain={mockDomain} position={[0,0,0]} />);
        // At FAR, we expect a simple box (mesh)
        // Since we can't easily check for mesh in JSDOM, let's just check no buildings are rendered initially
        expect(screen.queryByTestId('building')).toBeNull();
    });

    it('does NOT fetch teams when visible but LODLevel.FAR', async () => {
        mockIsDomainVisible.mockReturnValue(true);
        mockUseLOD.mockReturnValue(LODLevel.FAR);
        
        render(<Domain domain={mockDomain} position={[0,0,0]} />);
        
        // Wait to ensure useEffect runs and DOES NOT call getTeams
        await new Promise(resolve => setTimeout(resolve, 0));
        
        expect(apiClient.getTeams).not.toHaveBeenCalled();
    });

    it('fetches teams when visible', async () => {
        mockIsDomainVisible.mockReturnValue(true);
        mockUseLOD.mockReturnValue(LODLevel.MEDIUM);
        
        render(<Domain domain={mockDomain} position={[0,0,0]} />);
        
        await waitFor(() => {
            expect(apiClient.getTeams).toHaveBeenCalledWith('d1');
        });
    });

    it('renders buildings when visible and teams loaded', async () => {
        mockIsDomainVisible.mockReturnValue(true);
        mockUseLOD.mockReturnValue(LODLevel.MEDIUM);
        
        render(<Domain domain={mockDomain} position={[0,0,0]} />);
        
        await waitFor(() => {
            expect(screen.getByTestId('building')).toBeInTheDocument();
        });
    });
});
