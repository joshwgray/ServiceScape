import { describe, it, expect, beforeEach } from "vitest";
import { useSelectionStore } from "../selectionStore";

describe("selectionStore", () => {
  beforeEach(() => {
    useSelectionStore.getState().clearSelection();
  });

  it("should initialize with no selected service and both filters enabled", () => {
    const state = useSelectionStore.getState();
    expect(state.selectedServiceId).toBeNull();
    expect(state.dependencyFilters).toEqual({ declared: true, observed: true });
  });

  it("should set selected service", () => {
    const { selectService } = useSelectionStore.getState();
    selectService("service-1");
    expect(useSelectionStore.getState().selectedServiceId).toBe("service-1");
  });

  it("should clear selection", () => {
    const { selectService, clearSelection } = useSelectionStore.getState();
    selectService("service-1");
    clearSelection();
    expect(useSelectionStore.getState().selectedServiceId).toBeNull();
  });

  it("should toggle dependency filters", () => {
    const { toggleFilter } = useSelectionStore.getState();

    toggleFilter("declared");
    expect(useSelectionStore.getState().dependencyFilters).toEqual({
      declared: false,
      observed: true,
    });

    toggleFilter("declared");
    expect(useSelectionStore.getState().dependencyFilters).toEqual({
      declared: true,
      observed: true,
    });

    toggleFilter("observed");
    expect(useSelectionStore.getState().dependencyFilters).toEqual({
      declared: true,
      observed: false,
    });
  });

  it("should set dependency filters directly", () => {
    const { setFilters } = useSelectionStore.getState();
    setFilters({ declared: false, observed: false });
    expect(useSelectionStore.getState().dependencyFilters).toEqual({
      declared: false,
      observed: false,
    });
  });

  // Phase 1: Building selection tests
  it("should initialize with correct initial state including building selection fields", () => {
    useSelectionStore.setState({
      selectedServiceId: null,
      selectedBuildingId: null,
      selectionLevel: "none",
      dependencyFilters: { declared: true, observed: true },
    });
    const state = useSelectionStore.getState();
    expect(state.selectedServiceId).toBeNull();
    expect(state.selectedBuildingId).toBeNull();
    expect(state.selectionLevel).toBe("none");
    expect(state.dependencyFilters).toEqual({ declared: true, observed: true });
  });

  it("should track building selection separately from service selection", () => {
    const { selectBuilding, selectService } = useSelectionStore.getState();
    selectBuilding("building-1");
    selectService("service-1");
    const state = useSelectionStore.getState();
    expect(state.selectedBuildingId).toBe("building-1");
    expect(state.selectedServiceId).toBe("service-1");
  });

  it("should clear service when building is cleared", () => {
    const { selectBuilding, selectService, clearBuildingSelection } =
      useSelectionStore.getState();
    selectBuilding("building-1");
    selectService("service-1");
    clearBuildingSelection();
    const state = useSelectionStore.getState();
    expect(state.selectedBuildingId).toBeNull();
    expect(state.selectedServiceId).toBeNull();
  });

  it("should set selectionLevel to building when building selected", () => {
    const { selectBuilding } = useSelectionStore.getState();
    selectBuilding("building-1");
    expect(useSelectionStore.getState().selectionLevel).toBe("building");
  });

  it("should set selectionLevel to service when service selected", () => {
    const { selectService } = useSelectionStore.getState();
    selectService("service-1");
    expect(useSelectionStore.getState().selectionLevel).toBe("service");
  });

  it("should set building context when calling selectService with buildingId", () => {
    const { selectService } = useSelectionStore.getState();
    selectService("service-1", "building-1");
    const state = useSelectionStore.getState();
    expect(state.selectedServiceId).toBe("service-1");
    expect(state.selectedBuildingId).toBe("building-1");
    expect(state.selectionLevel).toBe("service");
  });

  it("should set selectionLevel to building when selectService(null) while building is selected", () => {
    const { selectBuilding, selectService } = useSelectionStore.getState();
    selectBuilding("building-1");
    selectService("service-1", "building-1");
    selectService(null);
    const state = useSelectionStore.getState();
    expect(state.selectedServiceId).toBeNull();
    expect(state.selectedBuildingId).toBe("building-1");
    expect(state.selectionLevel).toBe("building");
  });

  it("should set selectionLevel to none when selectService(null) with no building selected", () => {
    const { selectService } = useSelectionStore.getState();
    selectService("service-1");
    selectService(null);
    const state = useSelectionStore.getState();
    expect(state.selectedServiceId).toBeNull();
    expect(state.selectedBuildingId).toBeNull();
    expect(state.selectionLevel).toBe("none");
  });

  it("selecting a building when service is selected should clear the service", () => {
    const { selectService, selectBuilding } = useSelectionStore.getState();

    selectService("service-1", "building-1");
    expect(useSelectionStore.getState().selectedServiceId).toBe("service-1");
    expect(useSelectionStore.getState().selectionLevel).toBe("service");

    selectBuilding("building-2");
    expect(useSelectionStore.getState().selectedBuildingId).toBe("building-2");
    expect(useSelectionStore.getState().selectedServiceId).toBeNull();
    expect(useSelectionStore.getState().selectionLevel).toBe("building");
  });

  it("should clearSelection reset selectedBuildingId and selectionLevel", () => {
    const { selectBuilding, selectService, clearSelection } =
      useSelectionStore.getState();
    selectBuilding("building-1");
    selectService("service-1", "building-1");
    clearSelection();
    const state = useSelectionStore.getState();
    expect(state.selectedServiceId).toBeNull();
    expect(state.selectedBuildingId).toBeNull();
    expect(state.selectionLevel).toBe("none");
  });
});
