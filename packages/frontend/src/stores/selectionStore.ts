import { create } from "zustand";

type SelectionLevel = "none" | "building" | "service";

interface SelectionState {
  selectedServiceId: string | null;
  selectedBuildingId: string | null;
  selectionLevel: SelectionLevel;
  dependencyFilters: {
    declared: boolean;
    observed: boolean;
  };
  selectService: (serviceId: string | null, buildingId?: string) => void;
  selectBuilding: (buildingId: string) => void;
  clearBuildingSelection: () => void;
  clearSelection: () => void;
  toggleFilter: (filter: "declared" | "observed") => void;
  setFilters: (filters: { declared: boolean; observed: boolean }) => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedServiceId: null,
  selectedBuildingId: null,
  selectionLevel: "none",
  dependencyFilters: {
    declared: true,
    observed: true,
  },
  selectService: (serviceId, buildingId?) =>
    set((state) => {
      const newBuildingId =
        serviceId !== null
          ? buildingId !== undefined
            ? buildingId
            : state.selectedBuildingId
          : state.selectedBuildingId;
      const selectionLevel: SelectionLevel =
        serviceId !== null
          ? "service"
          : newBuildingId !== null
            ? "building"
            : "none";
      return {
        selectedServiceId: serviceId,
        selectedBuildingId: newBuildingId,
        selectionLevel,
      };
    }),
  selectBuilding: (buildingId) =>
    set({
      selectedBuildingId: buildingId,
      selectedServiceId: null,
      selectionLevel: "building",
    }),
  clearBuildingSelection: () =>
    set({
      selectedBuildingId: null,
      selectedServiceId: null,
      selectionLevel: "none",
    }),
  clearSelection: () =>
    set({
      selectedServiceId: null,
      selectedBuildingId: null,
      selectionLevel: "none",
    }),
  toggleFilter: (filter) =>
    set((state) => ({
      dependencyFilters: {
        ...state.dependencyFilters,
        [filter]: !state.dependencyFilters[filter],
      },
    })),
  setFilters: (filters) => set({ dependencyFilters: filters }),
}));
