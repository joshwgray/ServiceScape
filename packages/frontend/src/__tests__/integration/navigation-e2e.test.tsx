
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UIOverlay } from '../../components/ui/UIOverlay';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock the context and store
const mockSelectService = vi.fn();
const mockUseSelectionStore = vi.fn();

vi.mock('../../stores/selectionStore', () => ({
  useSelectionStore: (selector: any) => mockUseSelectionStore(selector),
}));

// Mock bubblePositionStore to prevent infinite re-render from inline selector
vi.mock('../../stores/bubblePositionStore', () => ({
  useBubblePositionStore: (selector: any) => {
    const state = {
      screenPosition: null,
      isVisible: false,
      clearAnchor: vi.fn(),
    };
    return selector ? selector(state) : state;
  },
}));

// Mock service detail hooks to avoid real async/API calls
vi.mock('../../hooks/useServiceDetails', () => ({
  useServiceDetails: () => ({ details: null, loading: false, error: null }),
}));

vi.mock('../../hooks/useTeamMembers', () => ({
  useTeamMembers: () => ({ members: [], loading: false, error: null }),
}));

// Mock apiClient to prevent real HTTP requests during ProviderRegistry setup
vi.mock('../../services/apiClient', () => ({
  getDependencies: vi.fn().mockResolvedValue([]),
  getTeamById: vi.fn().mockResolvedValue({ members: [] }),
}));

const mockDomains = [
  { id: 'd1', name: 'Domain 1', type: 'domain' },
  { id: 'd2', name: 'Domain 2', type: 'domain' }
];
const mockTeams = [
  { id: 't1', name: 'Team 1', domainId: 'd1', type: 'team' }
];
const mockServices = [
  { id: 's1', name: 'Service 1', teamId: 't1', type: 'service' }
];

vi.mock('../../contexts/OrganizationContext', () => ({
  useOrganization: () => ({
    domains: mockDomains,
    teams: mockTeams,
    services: mockServices,
    loading: false,
  }),
}));

describe('Navigation Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock store implementation
        mockUseSelectionStore.mockImplementation((selector: any) => {
            const state = {
                selectedServiceId: null,
                selectService: mockSelectService,
                clearSelection: vi.fn(),
            };
            return selector ? selector(state) : state;
        });
    });

    it('renders NavigationMenu toggle button initially', () => {
        render(<UIOverlay />);
        expect(screen.getByLabelText('Open Navigation Menu')).toBeInTheDocument();
    });

    it('toggles menu visibility with "N" key', async () => {
        render(<UIOverlay />);
        
        // Initial state: menu closed
        expect(screen.queryByText('Domain 1')).not.toBeInTheDocument();
        
        // Press 'N'
        fireEvent.keyDown(window, { key: 'n', code: 'KeyN' });
        
        // Wait for menu to appear
        await waitFor(() => {
            expect(screen.getByText('Domain 1')).toBeInTheDocument();
        });
        
        // Press 'N' again to close
        fireEvent.keyDown(window, { key: 'n', code: 'KeyN' });
        
        await waitFor(() => {
             expect(screen.queryByText('Domain 1')).not.toBeInTheDocument();
        });
    });

    it('navigates menu items with arrow keys', async () => {
        render(<UIOverlay />);
        
        // Open menu
        fireEvent.keyDown(window, { key: 'n', code: 'KeyN' });
        await waitFor(() => expect(screen.getByText('Domain 1')).toBeInTheDocument());
        
        // Initially, first item should be focused
        const d1 = screen.getByTestId('nav-item-d1');
        expect(d1).toHaveAttribute('data-focused', 'true');
        
        // Arrow Down -> d2
        fireEvent.keyDown(window, { key: 'ArrowDown', code: 'ArrowDown' });
        expect(screen.getByTestId('nav-item-d2')).toHaveAttribute('data-focused', 'true');
        expect(screen.getByTestId('nav-item-d1')).toHaveAttribute('data-focused', 'false');

        // Arrow Up -> d1
        fireEvent.keyDown(window, { key: 'ArrowUp', code: 'ArrowUp' });
        expect(screen.getByTestId('nav-item-d1')).toHaveAttribute('data-focused', 'true');
    });

    it('selects item with Enter key', async () => {
        render(<UIOverlay />);
        
        // Open menu
        fireEvent.keyDown(window, { key: 'n', code: 'KeyN' });
        await waitFor(() => expect(screen.getByText('Domain 1')).toBeInTheDocument());
        
        // Focus is on d1
        fireEvent.keyDown(window, { key: 'Enter', code: 'Enter' });
        
        expect(mockSelectService).toHaveBeenCalledWith('d1');
    });

    it('closes menu with Escape key', async () => {
        render(<UIOverlay />);
        
        // Open menu
        fireEvent.keyDown(window, { key: 'n', code: 'KeyN' });
        await waitFor(() => expect(screen.getByText('Domain 1')).toBeInTheDocument());

        // Press Escape
        fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
        
        await waitFor(() => {
             expect(screen.queryByText('Domain 1')).not.toBeInTheDocument();
        });
    });

    it('expands item with ArrowRight', async () => {
        render(<UIOverlay />);
        
        // Open menu
        fireEvent.keyDown(window, { key: 'n', code: 'KeyN' });
        await waitFor(() => expect(screen.getByText('Domain 1')).toBeInTheDocument());
        
        // First item (d1) is focused. It has children (Team 1). It is collapsed.
        // Press ArrowRight to expand
        fireEvent.keyDown(window, { key: 'ArrowRight', code: 'ArrowRight' });
        
        // Wait for Team 1 (child) to appear
        await waitFor(() => {
            expect(screen.getByText('Team 1')).toBeInTheDocument();
        });
        
        // Press ArrowDown to verify we can navigate to child
        fireEvent.keyDown(window, { key: 'ArrowDown', code: 'ArrowDown' });
        expect(screen.getByTestId('nav-item-t1')).toHaveAttribute('data-focused', 'true');
    });
});
