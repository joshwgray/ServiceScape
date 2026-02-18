import { create } from 'zustand';

interface SelectionState {
  selectedServiceId: string | null;
  dependencyFilters: {
    declared: boolean;
    observed: boolean;
  };
  selectService: (serviceId: string | null) => void;
  clearSelection: () => void;
  toggleFilter: (filter: 'declared' | 'observed') => void;
  setFilters: (filters: { declared: boolean; observed: boolean }) => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedServiceId: null,
  dependencyFilters: {
    declared: true,
    observed: true,
  },
  selectService: (serviceId) => set({ selectedServiceId: serviceId }),
  clearSelection: () => set({ selectedServiceId: null }),
  toggleFilter: (filter) =>
    set((state) => ({
      dependencyFilters: {
        ...state.dependencyFilters,
        [filter]: !state.dependencyFilters[filter],
      },
    })),
  setFilters: (filters) => set({ dependencyFilters: filters }),
}));
