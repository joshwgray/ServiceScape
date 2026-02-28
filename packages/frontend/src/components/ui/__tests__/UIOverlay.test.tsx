/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
import { UIOverlay } from '../UIOverlay';
import { useSelectionStore } from '../../../stores/selectionStore';
import { useOrganization } from '../../../contexts/OrganizationContext';
import { useServiceDetails } from '../../../hooks/useServiceDetails';
import { useTeamMembers } from '../../../hooks/useTeamMembers';
import { useImpactAnalysis } from '../../../hooks/useImpactAnalysis';

// Mock all dependencies
vi.mock('../../../stores/selectionStore', () => ({
  useSelectionStore: vi.fn(),
}));
vi.mock('../../../contexts/OrganizationContext', () => ({
  useOrganization: vi.fn(),
}));
vi.mock('../../../hooks/useServiceDetails', () => ({
  useServiceDetails: vi.fn(),
}));
vi.mock('../../../hooks/useTeamMembers', () => ({
  useTeamMembers: vi.fn(),
}));
vi.mock('../../../hooks/useImpactAnalysis', () => ({
  useImpactAnalysis: vi.fn(),
}));

// Mock DetailsPanel
vi.mock('../DetailsPanel', () => ({
  DetailsPanel: ({ item, members, onClose, onAnalyzeImpact }: any) => (
    item ? (
      <div data-testid="details-panel">
        <div data-testid="panel-content">{item.name}</div>
        <div data-testid="panel-description">{item.description}</div>
        {members && members.length > 0 && (
            <div data-testid="panel-members">
                {members.map((m: any) => <span key={m.id}>{m.name}</span>)}
            </div>
        )}
        {onAnalyzeImpact ? <button onClick={onAnalyzeImpact} data-testid="details-analyze">Analyze</button> : null}
        <button onClick={onClose} data-testid="details-close">Close</button>
      </div>
    ) : null
  ),
}));

vi.mock('../../ImpactAnalysisPanel', () => ({
  ImpactAnalysisPanel: ({ analysis, loading }: any) => (
    analysis || loading ? <div data-testid="impact-panel">Impact Panel</div> : null
  ),
}));

describe('UIOverlay with DetailsPanel', () => {
    const mockSelectService = vi.fn();
    const mockClearSelection = vi.fn();

    const mockServices = [
      { id: 'service-1', name: 'Auth Service', teamId: 'team-1', description: 'Handles auth', type: 'service' },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        
        (useSelectionStore as any).mockImplementation((selector: any) => {
            const state = {
                selectedServiceId: null,
                selectService: mockSelectService,
                clearSelection: mockClearSelection
            };
            return selector(state);
        });

        (useOrganization as any).mockReturnValue({
            domains: [],
            teams: [],
            services: mockServices,
        });

        (useServiceDetails as any).mockReturnValue({ details: null });
        (useTeamMembers as any).mockReturnValue({ members: [], loading: false });
        (useImpactAnalysis as any).mockReturnValue({
            analysis: null,
            loading: false,
            error: null,
            analyzeImpact: vi.fn(),
            clearAnalysis: vi.fn(),
        });
    });

    it('renders DetailsPanel when service is selected', () => {
        // Setup selected service
        (useSelectionStore as any).mockImplementation((selector: any) => {
            const state = {
                selectedServiceId: 'service-1',
                selectService: mockSelectService,
                clearSelection: mockClearSelection
            };
            return selector(state);
        });

        render(<UIOverlay />);
        
        // Should show DetailsPanel
        expect(screen.getByTestId('details-panel')).toBeInTheDocument();
        expect(screen.getByText('Auth Service')).toBeInTheDocument();
    });

    it('integrates team members and enriched details into DetailsPanel', () => {
        const enrichedDetails = {
            description: 'Enriched Description',
            stats: { upstream: 2, downstream: 1 }
        };
        const mockMembers = [
            { id: 'u1', name: 'Alice', role: 'Lead' }
        ];

        // Setup selected service
        (useSelectionStore as any).mockImplementation((selector: any) => {
            const state = {
                selectedServiceId: 'service-1',
                selectService: mockSelectService,
                clearSelection: mockClearSelection
            };
            return selector(state);
        });

        // Mock enriched details
        (useServiceDetails as any).mockReturnValue({ details: enrichedDetails });
        
        // Mock team members
        (useTeamMembers as any).mockReturnValue({ members: mockMembers, loading: false });

        render(<UIOverlay />);

        expect(screen.getByTestId('details-panel')).toBeInTheDocument();
        // Check for enriched description
        expect(screen.getByTestId('panel-description')).toHaveTextContent('Enriched Description');
        // Check for team member
        expect(screen.getByTestId('panel-members')).toHaveTextContent('Alice');
        
        // Verify useTeamMembers was called with the correct teamId
        expect(useTeamMembers).toHaveBeenCalledWith('team-1');
    });

    it('calls clearSelection when DetailsPanel close button is clicked', () => {
        (useSelectionStore as any).mockImplementation((selector: any) => {
            const state = {
                selectedServiceId: 'service-1',
                selectService: mockSelectService,
                clearSelection: mockClearSelection
            };
            return selector(state);
        });

        render(<UIOverlay />);
        
        const closeBtn = screen.getByTestId('details-close');
        fireEvent.click(closeBtn);
        
        expect(mockClearSelection).toHaveBeenCalled();
    });

    it('triggers impact analysis for the selected service', () => {
        const analyzeImpact = vi.fn();
        (useSelectionStore as any).mockImplementation((selector: any) => {
            const state = {
                selectedServiceId: 'service-1',
                selectService: mockSelectService,
                clearSelection: mockClearSelection
            };
            return selector(state);
        });
        (useImpactAnalysis as any).mockReturnValue({
            analysis: null,
            loading: false,
            error: null,
            analyzeImpact,
            clearAnalysis: vi.fn(),
        });

        render(<UIOverlay />);

        fireEvent.click(screen.getByTestId('details-analyze'));
        expect(analyzeImpact).toHaveBeenCalledWith('service-1');
    });
});
