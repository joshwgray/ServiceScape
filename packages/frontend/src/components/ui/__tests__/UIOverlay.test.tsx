
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { UIOverlay } from '../UIOverlay';
import { ProviderRegistry } from '../../../providers/details/ProviderRegistry';
import * as useServiceDetailsHook from '../../../hooks/useServiceDetails';

// Mock dependencies
vi.mock('../../../stores/selectionStore', () => ({
  useSelectionStore: vi.fn(),
}));
vi.mock('../../../contexts/OrganizationContext', () => ({
  useOrganization: vi.fn(),
}));
vi.mock('../../../hooks/useServiceDetails', () => ({
  useServiceDetails: vi.fn(),
}));

import { useSelectionStore } from '../../../stores/selectionStore';
import { useOrganization } from '../../../contexts/OrganizationContext';
import { useServiceDetails } from '../../../hooks/useServiceDetails';
import { BaseServiceDetailsProvider } from '../../../providers/details/BaseServiceDetailsProvider';
import { DependencyStatsProvider } from '../../../providers/details/DependencyStatsProvider';

describe('UIOverlay Enrichment', () => {
    const mockSelectService = vi.fn();
    const mockClearSelection = vi.fn();
    
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Setup default store mocks
        (useSelectionStore as any).mockImplementation((selector: any) => {
            const state = {
                selectedServiceId: null,
                selectService: mockSelectService,
                clearSelection: mockClearSelection
            };
            return selector(state);
        });

        // Setup organization context
        (useOrganization as any).mockReturnValue({
            domains: [],
            teams: [],
            services: [
                { id: 's1', name: 'Service 1', type: 'service' }
            ]
        });

        // Default useServiceDetails to always return "loading" or empty
        (useServiceDetails as any).mockReturnValue({
             details: null,
             loading: false,
             error: null
        });
        
        // Mock ProviderRegistry methods
        const mockRegistry = {
            register: vi.fn(),
            unregister: vi.fn()
        };
        vi.spyOn(ProviderRegistry, 'getInstance').mockReturnValue(mockRegistry as any);
    });

    it('registers providers on mount', () => {
        render(<UIOverlay />);

        const instance = ProviderRegistry.getInstance();
        expect(instance.register).toHaveBeenCalledTimes(2);
        // We can inspect arguments if we exported the provider classes but we don't need to be overly specific here unless we mock them too.
        // We just ensure it calls register for Base and Dependency providers.
    });

    it('uses useServiceDetails hook when a service is selected', () => {
        // Setup selection
        (useSelectionStore as any).mockImplementation((selector: any) => {
             const state = {
                 selectedServiceId: 's1',
                 selectService: mockSelectService,
                 clearSelection: mockClearSelection
             };
             return selector(state);
        });

        // Setup hooks return
        (useServiceDetails as any).mockReturnValue({
             details: { id: 's1', name: 'Service 1 Enriched', description: 'Enriched desc' },
             loading: false,
             error: null
        });

        render(<UIOverlay />);
        
        // Check if hook was called with correct ID
        expect(useServiceDetails).toHaveBeenCalledWith('s1');

        // Check if enriched details are displayed
        // Wait, UIOverlay passes item to DetailsPanel. 
        // DetailsPanel renders "Details" heading always.
        // If passed enriched item, it should render enriched name.
        expect(screen.getByText('Service 1 Enriched')).toBeInTheDocument();
        expect(screen.getByText('Enriched desc')).toBeInTheDocument();
    });

    it('does not use useServiceDetails for non-service items', () => {
        // Setup selection for a team
        (useSelectionStore as any).mockImplementation((selector: any) => {
             const state = {
                 selectedServiceId: 't1', 
                 selectService: mockSelectService,
                 clearSelection: mockClearSelection
             };
             return selector(state);
        });

        // Context with a team
        (useOrganization as any).mockReturnValue({
            domains: [],
            teams: [{ id: 't1', name: 'Team 1', type: 'team' }],
            services: []
        });

        render(<UIOverlay />);

        // Should be called with null or skipped
        expect(useServiceDetails).toHaveBeenCalledWith(null);
        
        expect(screen.getByText('Team 1')).toBeInTheDocument();
    });

    it('unregisters providers on unmount', () => {
        const { unmount } = render(<UIOverlay />);
        const instance = ProviderRegistry.getInstance();
        
        // Should have been registered
        expect(instance.register).toHaveBeenCalledTimes(2);
        
        unmount();
        
        // Should be unregistered
        expect(instance.unregister).toHaveBeenCalledTimes(2);
    });
});
