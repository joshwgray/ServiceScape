import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UIOverlay } from '../UIOverlay';
import { ProviderRegistry } from '../../../providers/details/ProviderRegistry';
import { useSelectionStore } from '../../../stores/selectionStore';
import { useBubblePositionStore } from '../../../stores/bubblePositionStore';
import { useOrganization } from '../../../contexts/OrganizationContext';
import { useServiceDetails } from '../../../hooks/useServiceDetails';
import { useTeamMembers } from '../../../hooks/useTeamMembers';

// Mock all dependencies
vi.mock('../../../stores/selectionStore', () => ({
  useSelectionStore: vi.fn(),
}));
vi.mock('../../../stores/bubblePositionStore', () => ({
  useBubblePositionStore: vi.fn(),
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

// Mock SpeechBubble to easily test its presence and props
vi.mock('../SpeechBubble', () => ({
  SpeechBubble: ({ children, onClose, x, y }: any) => (
    <div data-testid="speech-bubble">
      <button onClick={onClose} data-testid="close-button">Close</button>
      <div data-testid="bubble-position">{`x:${x},y:${y}`}</div>
      {children}
    </div>
  ),
}));

describe('UIOverlay', () => {
    const mockSelectService = vi.fn();
    const mockClearSelection = vi.fn();
    const mockSetScreenPosition = vi.fn();
    const mockClearAnchor = vi.fn();

    // Sample data
    const mockDomains = [{ id: 'domain-1', name: 'Platform', type: 'domain' }];
    const mockTeams = [{ id: 'team-1', domainId: 'domain-1', name: 'Core Team', type: 'team' }];
    const mockServices = [
      { id: 'service-1', name: 'Auth Service', teamId: 'team-1', description: 'Handles auth', type: 'service' },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Setup default selection store mocks
        (useSelectionStore as any).mockImplementation((selector: any) => {
            const state = {
                selectedServiceId: null,
                selectService: mockSelectService,
                clearSelection: mockClearSelection
            };
            return selector(state);
        });

        // Setup default bubble position store mocks
        (useBubblePositionStore as any).mockImplementation((selector: any) => {
            const state = {
                screenPosition: null,
                isVisible: false,
                setScreenPosition: mockSetScreenPosition,
                clearAnchor: mockClearAnchor,
            };
            return selector(state);
        });

        // Setup organization context
        (useOrganization as any).mockReturnValue({
            domains: mockDomains,
            teams: mockTeams,
            services: mockServices,
        });

        // Default useServiceDetails mock
        (useServiceDetails as any).mockReturnValue({
             details: null,
             loading: false,
             error: null
        });

        // Default useTeamMembers mock
        (useTeamMembers as any).mockReturnValue({
          members: [],
          loading: false,
          error: null,
        });
        
        // Mock ProviderRegistry methods
        const mockRegistry = {
            register: vi.fn(),
            unregister: vi.fn()
        };
        // @ts-ignore
        vi.spyOn(ProviderRegistry, 'getInstance').mockReturnValue(mockRegistry);
    });

    it('renders nothing when no item is selected', () => {
        render(<UIOverlay />);
        expect(screen.queryByTestId('speech-bubble')).not.toBeInTheDocument();
    });

    it('unmounts SpeechBubble when screenPosition is null (no anchor)', () => {
        (useSelectionStore as any).mockImplementation((selector: any) => {
             const state = {
                selectedServiceId: 'service-1',
                selectService: mockSelectService,
                clearSelection: mockClearSelection
             };
             return selector(state);
        });

        (useBubblePositionStore as any).mockImplementation((selector: any) => {
             const state = {
                screenPosition: null, // No anchor at all
                isVisible: false,
                setScreenPosition: mockSetScreenPosition,
                clearAnchor: mockClearAnchor,
             };
             return selector(state);
        });
        
        render(<UIOverlay />);
        expect(screen.queryByTestId('speech-bubble')).not.toBeInTheDocument();
    });

    it('keeps SpeechBubble mounted when screenPosition exists but isVisible is false', () => {
        (useSelectionStore as any).mockImplementation((selector: any) => {
             const state = {
                selectedServiceId: 'service-1',
                selectService: mockSelectService,
                clearSelection: mockClearSelection
             };
             return selector(state);
        });

        (useBubblePositionStore as any).mockImplementation((selector: any) => {
             const state = {
                screenPosition: { x: 100, y: 200 },
                isVisible: false, // Fading out but still has a position anchor
                setScreenPosition: mockSetScreenPosition,
                clearAnchor: mockClearAnchor,
             };
             return selector(state);
        });
        
        render(<UIOverlay />);
        // SpeechBubble must remain mounted so its fade-out animation can play
        expect(screen.getByTestId('speech-bubble')).toBeInTheDocument();
    });

    it('renders SpeechBubble when an item is selected and screen position is available', () => {
        (useSelectionStore as any).mockImplementation((selector: any) => {
             const state = {
                selectedServiceId: 'service-1',
                selectService: mockSelectService,
                clearSelection: mockClearSelection
             };
             return selector(state);
        });

        (useBubblePositionStore as any).mockImplementation((selector: any) => {
             const state = {
                screenPosition: { x: 100, y: 200 },
                isVisible: true,
                setScreenPosition: mockSetScreenPosition,
                clearAnchor: mockClearAnchor,
             };
             return selector(state);
        });
        
        render(<UIOverlay />);
        
        expect(screen.getByTestId('speech-bubble')).toBeInTheDocument();
        expect(screen.getByText('Auth Service')).toBeInTheDocument();
        expect(screen.getByTestId('bubble-position')).toHaveTextContent('x:100,y:200');
    });

    it('calls clearSelection and clearAnchor when close button is clicked', () => {
        (useSelectionStore as any).mockImplementation((selector: any) => {
             const state = {
                selectedServiceId: 'service-1',
                selectService: mockSelectService,
                clearSelection: mockClearSelection
             };
             return selector(state);
        });
        (useBubblePositionStore as any).mockImplementation((selector: any) => {
             const state = {
                screenPosition: { x: 100, y: 200 },
                isVisible: true,
                setScreenPosition: mockSetScreenPosition,
                clearAnchor: mockClearAnchor,
             };
             return selector(state);
        });

        render(<UIOverlay />);
        
        const closeBtn = screen.getByTestId('close-button');
        fireEvent.click(closeBtn);
        
        expect(mockClearSelection).toHaveBeenCalled();
        expect(mockClearAnchor).toHaveBeenCalled();
    });

    // Test pass-through for background dismissal
    it('has pointer-events: none on container to allow clicks to reach the scene for dismissal', () => {
        (useSelectionStore as any).mockImplementation((selector: any) => {
             const state = {
                selectedServiceId: 'service-1', // Selection active
                selectService: mockSelectService,
                clearSelection: mockClearSelection
             };
             return selector(state);
        });
        
        // Mock showing bubble
        (useBubblePositionStore as any).mockImplementation((selector: any) => {
             const state = {
                screenPosition: { x: 100, y: 200 },
                isVisible: true,
                setScreenPosition: mockSetScreenPosition,
                clearAnchor: mockClearAnchor,
             };
             return selector(state);
        });

        render(<UIOverlay />);
        
        const container = screen.getByTestId('ui-overlay-container');
        
        // CRITICAL: The overlay must allow clicks to pass through to the Canvas underneath.
        // The Canvas handles 'onPointerMissed' to dismiss the selection.
        expect(container).toHaveStyle({ pointerEvents: 'none' });

        // Verify that UIOverlay itself does NOT intercept the click
        fireEvent.click(container);
        expect(mockClearSelection).not.toHaveBeenCalled();
    });
});
