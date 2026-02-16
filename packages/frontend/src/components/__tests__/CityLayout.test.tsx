import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CityLayout } from '../CityLayout';
import * as useOrgData from '../../hooks/useOrganizationData';
import * as useProgLoad from '../../hooks/useProgressiveLoad';

// Mock hooks
vi.mock('../../hooks/useOrganizationData');
vi.mock('../../hooks/useProgressiveLoad');

// Mock Domain
vi.mock('../Domain', () => ({
    Domain: ({ domain }: { domain: any }) => <div data-testid="domain">{domain.name}</div>
}));

// Mock R3F
vi.mock('@react-three/fiber', () => ({
    useFrame: vi.fn(),
    useThree: () => ({ camera: {} }) 
}));

describe('CityLayout', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows loading state', () => {
        vi.mocked(useOrgData.useOrganizationData).mockReturnValue({ loading: true, domains: [], error: null });
        vi.mocked(useProgLoad.useProgressiveLoad).mockReturnValue();

        render(<CityLayout />);
        expect(screen.queryByTestId('domain')).toBeNull();
    });

    it('renders domains when loaded', () => {
        const domains = [{ id: 'd1', name: 'Domain 1', metadata: { position: [10,0,10] } }];
        vi.mocked(useOrgData.useOrganizationData).mockReturnValue({ loading: false, domains: domains as any, error: null });
        vi.mocked(useProgLoad.useProgressiveLoad).mockReturnValue();

        render(<CityLayout />);
        expect(screen.getByTestId('domain')).toHaveTextContent('Domain 1');
    });

    it('calls progressive load hook with domains', () => {
        // Clear mocks first to ensure clean state
        vi.clearAllMocks();
        
        const domains = [
            { id: 'd1', name: 'Domain 1', metadata: { position: [10,0,10] } }
        ];
        
        // Setup mocks
        vi.mocked(useOrgData.useOrganizationData).mockReturnValue({ 
            loading: false, 
            domains: domains as any,
            error: null 
        });
        
        render(<CityLayout />);
        
        // Assert: Check if useProgressiveLoad was called with the correct transformed array
        expect(useProgLoad.useProgressiveLoad).toHaveBeenCalled();
        
        const calls = (useProgLoad.useProgressiveLoad as any).mock.calls;
        const lastCallArgs = calls[calls.length - 1][0];
        
        expect(lastCallArgs).toHaveLength(1);
        expect(lastCallArgs[0]).toMatchObject({
            id: 'd1',
            position: [10, 0, 10]
        });
    });
});
