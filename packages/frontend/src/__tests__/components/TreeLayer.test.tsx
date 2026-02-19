import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { TreeLayer } from '../../components/TreeLayer.tsx';
import * as OrganizationContext from '../../contexts/OrganizationContext';
import * as TreePlacement from '../../utils/treePlacement';
import { LegoTreeProps } from '../../components/LegoTree';

// Mock dependencies
vi.mock('../../contexts/OrganizationContext', () => ({
  useOrganization: vi.fn(),
}));

vi.mock('../../utils/treePlacement', () => ({
  calculateTreePositions: vi.fn(),
}));

// Mock LegoTree to verify props passed
vi.mock('../../components/LegoTree', () => ({
  LegoTree: (props: LegoTreeProps) => (
    <div data-testid="lego-tree" data-position={props.position.join(',')} data-seed={props.seed} />
  ),
}));

describe('TreeLayer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders nothing while loading', () => {
        vi.mocked(OrganizationContext.useOrganization).mockReturnValue({
            layout: null,
            loading: true,
            domains: [],
            teams: [],
            services: [],
            error: null
        });

        const { queryByTestId } = render(<TreeLayer />);
        expect(queryByTestId('lego-tree')).toBeNull();
    });

    it('renders trees when layout is loaded', () => {
        const mockLayout = {
            domains: { 'd1': { x: 0, y: 0, z: 0 } }
        };
        const mockTrees = [
            { position: [10, 0, 10] as [number, number, number], seed: 'seed1' },
            { position: [-20, 0, -20] as [number, number, number], seed: 'seed2' }
        ];

        vi.mocked(OrganizationContext.useOrganization).mockReturnValue({
            layout: mockLayout as any,
            loading: false,
            domains: [],
            teams: [],
            services: [],
            error: null
        });

        vi.mocked(TreePlacement.calculateTreePositions).mockReturnValue(mockTrees);

        const { getAllByTestId } = render(<TreeLayer />);
        
        const trees = getAllByTestId('lego-tree');
        expect(trees).toHaveLength(2);
        expect(TreePlacement.calculateTreePositions).toHaveBeenCalledWith(mockLayout.domains, 600);
        
        expect(trees[0]).toHaveAttribute('data-position', '10,0,10');
        expect(trees[0]).toHaveAttribute('data-seed', 'seed1');
        
        expect(trees[1]).toHaveAttribute('data-position', '-20,0,-20');
        expect(trees[1]).toHaveAttribute('data-seed', 'seed2');
    });

    it('renders nothing if layout is null', () => {
        vi.mocked(OrganizationContext.useOrganization).mockReturnValue({
            layout: null,
            loading: false,
            domains: [],
            teams: [],
            services: [],
            error: null
        });

        const { queryByTestId } = render(<TreeLayer />);
        expect(queryByTestId('lego-tree')).toBeNull();
    });
});
