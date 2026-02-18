import { describe, it, expect, beforeEach } from 'vitest';
import { useSelectionStore } from '../selectionStore';

describe('selectionStore', () => {
  beforeEach(() => {
    useSelectionStore.getState().clearSelection();
  });

  it('should initialize with no selected service and both filters enabled', () => {
    const state = useSelectionStore.getState();
    expect(state.selectedServiceId).toBeNull();
    expect(state.dependencyFilters).toEqual({ declared: true, observed: true });
  });

  it('should set selected service', () => {
    const { selectService } = useSelectionStore.getState();
    selectService('service-1');
    expect(useSelectionStore.getState().selectedServiceId).toBe('service-1');
  });

  it('should clear selection', () => {
    const { selectService, clearSelection } = useSelectionStore.getState();
    selectService('service-1');
    clearSelection();
    expect(useSelectionStore.getState().selectedServiceId).toBeNull();
  });

  it('should toggle dependency filters', () => {
    const { toggleFilter } = useSelectionStore.getState();
    
    toggleFilter('declared');
    expect(useSelectionStore.getState().dependencyFilters).toEqual({ declared: false, observed: true });
    
    toggleFilter('declared');
    expect(useSelectionStore.getState().dependencyFilters).toEqual({ declared: true, observed: true });

    toggleFilter('observed');
    expect(useSelectionStore.getState().dependencyFilters).toEqual({ declared: true, observed: false });
  });

  it('should set dependency filters directly', () => {
    const { setFilters } = useSelectionStore.getState();
    setFilters({ declared: false, observed: false });
    expect(useSelectionStore.getState().dependencyFilters).toEqual({ declared: false, observed: false });
  });
});
