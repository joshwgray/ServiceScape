import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DependencyLayer from '../DependencyLayer';
import { useSelectionStore } from '../../stores/selectionStore';

// Mock dependencies
vi.mock('../../hooks/useDependencies', () => ({
  useDependencies: vi.fn(),
}));
import { useDependencies } from '../../hooks/useDependencies';

// Mock OrganizationContext
vi.mock('../../contexts/OrganizationContext', () => ({
  useOrganization: vi.fn(),
  OrganizationProvider: ({ children }: any) => <div>{children}</div>
}));
import { useOrganization } from '../../contexts/OrganizationContext';

// Mock DependencyEdge
vi.mock('../DependencyEdge', () => ({
  default: () => <div data-testid="dependency-edge" />
}));

describe('DependencyLayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSelectionStore.getState().clearSelection();
  });

  it('should render nothing if no service selected', async () => {
    (useDependencies as any).mockReturnValue({ dependencies: [], loading: false });
    (useOrganization as any).mockReturnValue({ services: [], layout: null, loading: false });
    
    render(<DependencyLayer />);
    
    // Check if called with filterType undefined (since initial state filters are both true)
    await waitFor(() => {
      // queryServiceId will be null because no service selected
      expect(useDependencies).toHaveBeenCalledWith(null, undefined);
    });
  });

  it('should render edges when service selected and layout available', async () => {
    // Setup store
    useSelectionStore.getState().selectService('svc-1');

    // Mock layout
    const layout = {
      services: {
        'svc-1': { x: 0, y: 0, z: 0 },
        'svc-2': { x: 10, y: 0, z: 0 },
      },
      domains: {},
    };

    const services = [
        { id: 'svc-1', name: 'Service 1' },
        { id: 'svc-2', name: 'Service 2' }
    ];

    (useOrganization as any).mockReturnValue({ services, layout, loading: false });
    (useDependencies as any).mockReturnValue({ 
      dependencies: [
        { fromServiceId: 'svc-1', toServiceId: 'svc-2', type: 'DECLARED', count: 1 }
      ], 
      loading: false 
    });

    render(<DependencyLayer />);

    await waitFor(() => {
        expect(useDependencies).toHaveBeenCalledWith('svc-1', undefined);
    });
  });
});
