import { create } from 'zustand';

interface VisibilityState {
    visibleDomains: Set<string>;
    visibleTeams: Set<string>;
    addVisibleDomain: (id: string) => void;
    removeVisibleDomain: (id: string) => void;
    isDomainVisible: (id: string) => boolean;
    addVisibleTeam: (id: string) => void;
    removeVisibleTeam: (id: string) => void;
    isTeamVisible: (id: string) => boolean;
    clearVisibility: () => void;
}

export const useVisibilityStore = create<VisibilityState>((set, get) => ({
    visibleDomains: new Set(),
    visibleTeams: new Set(),
    addVisibleDomain: (id) => set((state) => {
        if (state.visibleDomains.has(id)) return state;
        const newSet = new Set(state.visibleDomains);
        newSet.add(id);
        return { visibleDomains: newSet };
    }),
    removeVisibleDomain: (id) => set((state) => {
        if (!state.visibleDomains.has(id)) return state;
        const newSet = new Set(state.visibleDomains);
        newSet.delete(id);
        return { visibleDomains: newSet };
    }),
    isDomainVisible: (id) => get().visibleDomains.has(id),
    addVisibleTeam: (id) => set((state) => {
        if (state.visibleTeams.has(id)) return state;
        const newSet = new Set(state.visibleTeams);
        newSet.add(id);
        return { visibleTeams: newSet };
    }),
    removeVisibleTeam: (id) => set((state) => {
        if (!state.visibleTeams.has(id)) return state;
        const newSet = new Set(state.visibleTeams);
        newSet.delete(id);
        return { visibleTeams: newSet };
    }),
    isTeamVisible: (id) => get().visibleTeams.has(id),
    clearVisibility: () => set({ visibleDomains: new Set(), visibleTeams: new Set() })
}));
