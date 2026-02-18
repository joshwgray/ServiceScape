import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterControls } from '../FilterControls.tsx';
import { useSelectionStore } from '../../../stores/selectionStore';

// Mock store
vi.mock('../../../stores/selectionStore', () => ({
  useSelectionStore: vi.fn(),
}));

describe('FilterControls', () => {
    const mockToggleFilter = vi.fn();
    
    beforeEach(() => {
        vi.clearAllMocks();
        (useSelectionStore as any).mockImplementation((selector: any) => {
             const state = {
                 dependencyFilters: { declared: true, observed: false },
                 toggleFilter: mockToggleFilter
             };
             // Handle selector
             if (selector) return selector(state);
             return state;
        });
    });

    it('renders checkboxes with correct checked state', () => {
        render(<FilterControls />);
        const declaredLabel = screen.getByLabelText(/Declared/i);
        const observedLabel = screen.getByLabelText(/Observed/i);
        
        expect(declaredLabel).toBeChecked();
        expect(observedLabel).not.toBeChecked();
    });

    it('calls toggleFilter when checkbox clicked', () => {
        render(<FilterControls />);
        const declaredCheckbox = screen.getByLabelText(/Declared/i);
        
        fireEvent.click(declaredCheckbox);
        expect(mockToggleFilter).toHaveBeenCalledWith('declared');
    });
});
