import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NavigationMenu } from '../NavigationMenu';
import { useOrganization } from '../../../contexts/OrganizationContext';
import { useSelectionStore } from '../../../stores/selectionStore';
import { Domain, Team, Service } from '@servicescape/shared';

// Mock the context and store
vi.mock('../../../contexts/OrganizationContext', () => ({
  useOrganization: vi.fn(),
}));

vi.mock('../../../stores/selectionStore', () => ({
  useSelectionStore: vi.fn(),
}));

// Mock NavigationMenuItem to simplify the test
vi.mock('../../../components/ui/NavigationMenuItem', () => ({
  NavigationMenuItem: (props: any) => (
    <div
      data-testid={`menu-item-${props.id}`}
      data-level={props.level}
    >
      {props.hasChildren && (
        <button
          data-testid={`toggle-${props.id}`}
          onClick={(e) => {
            e.stopPropagation();
            props.onToggle && props.onToggle();
          }}
        >
          {props.isExpanded ? 'Collapse' : 'Expand'}
        </button>
      )}
      <span data-testid={`content-${props.id}`}>
        {props.name}
      </span>
      {props.isSelected && <span data-testid="selected-indicator">(Selected)</span>}
    </div>
  ),
}));

describe('NavigationMenu', () => {
  const mockDomains: Domain[] = [
    { id: 'domain-1', name: 'Domain 1' },
    { id: 'domain-2', name: 'Domain 2' },
  ];
  const mockTeams: Team[] = [
    { id: 'team-1', name: 'Team 1', domainId: 'domain-1' },
    { id: 'team-2', name: 'Team 2', domainId: 'domain-1' },
    { id: 'team-3', name: 'Team 3', domainId: 'domain-2' },
  ];
  const mockServices: Service[] = [
    { id: 'service-1', name: 'Service 1', teamId: 'team-1' },
    { id: 'service-2', name: 'Service 2', teamId: 'team-1' },
    { id: 'service-3', name: 'Service 3', teamId: 'team-2' },
  ];

  const mockSelectService = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useOrganization as any).mockReturnValue({
      domains: mockDomains,
      teams: mockTeams,
      services: mockServices,
      loading: false,
      error: null,
    });
    // Mock the selector pattern
    (useSelectionStore as any).mockImplementation((selector: any) => {
        if (!selector) return { selectedServiceId: null, selectService: mockSelectService };
        const state = { selectedServiceId: null, selectService: mockSelectService };
        return selector(state);
    });
  });

  it('renders domain list initially', () => {
    render(<NavigationMenu />);
    fireEvent.click(screen.getByText('☰'));
    expect(screen.getByText('Domain 1')).toBeInTheDocument();
    expect(screen.getByText('Domain 2')).toBeInTheDocument();
    expect(screen.queryByText('Team 1')).not.toBeInTheDocument();
  });

  it('expands domain to show teams when toggle is clicked', () => {
    render(<NavigationMenu />);
    fireEvent.click(screen.getByText('☰'));
    
    const toggle = screen.getByTestId('toggle-domain-1');
    fireEvent.click(toggle);
    
    // Check if Team 1 (child of Domain 1) appears
    expect(screen.getByText('Team 1')).toBeInTheDocument();
    // Team 3 (child of Domain 2) should NOT appear
    expect(screen.queryByText('Team 3')).not.toBeInTheDocument();
  });

  it('expands team to show services when toggle is clicked', () => {
    render(<NavigationMenu />);
    fireEvent.click(screen.getByText('☰'));
    
    // Click toggle for Domain 1
    fireEvent.click(screen.getByTestId('toggle-domain-1'));
    // Click toggle for Team 1
    fireEvent.click(screen.getByTestId('toggle-team-1'));
    
    // Check if Service 1 (child of Team 1) appears
    expect(screen.getByText('Service 1')).toBeInTheDocument();
  });

  it('handles empty domains gracefully', () => {
    const emptyDomains = [{ id: 'empty-domain', name: 'Empty Domain' }];
    (useOrganization as any).mockReturnValue({
      domains: emptyDomains,
      teams: [],
      services: [],
      loading: false,
      error: null,
    });
    
    render(<NavigationMenu />);
    fireEvent.click(screen.getByText('☰'));
    expect(screen.getByText('Empty Domain')).toBeInTheDocument();
    // Should not have toggle if no children
    expect(screen.queryByTestId('toggle-empty-domain')).not.toBeInTheDocument();
  });

  it('passes isSelected prop correctly', () => {
    (useSelectionStore as any).mockImplementation((selector: any) => {
        const state = { selectedServiceId: 'domain-1', selectService: mockSelectService };
        return selector(state);
    });
    
    render(<NavigationMenu />);
    fireEvent.click(screen.getByText('☰'));
    
    const domainItem = screen.getByTestId('menu-item-domain-1');
    expect(domainItem).toHaveTextContent('(Selected)');
  });

  it('shows no domains message when list is empty', () => {
      (useOrganization as any).mockReturnValue({
          domains: [],
          teams: [],
          services: [],
          loading: false,
          error: null,
      });

      render(<NavigationMenu />);
      fireEvent.click(screen.getByText('☰'));
      expect(screen.getByText('No domains found')).toBeInTheDocument();
  });

  it('toggles menu open/close', () => {
      render(<NavigationMenu />);
      // Initially Closed
      expect(screen.getByText('☰')).toBeInTheDocument();
      expect(screen.queryByText('Domain 1')).not.toBeInTheDocument();
      
      // Click to open
      fireEvent.click(screen.getByText('☰'));
      // Should show list and close button
      expect(screen.getByText('Domain 1')).toBeInTheDocument();
      
      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);
      
      // Now closed
      expect(screen.getByText('☰')).toBeInTheDocument();
  });
});
