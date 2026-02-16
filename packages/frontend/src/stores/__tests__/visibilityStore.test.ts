import { describe, it, expect, beforeEach } from 'vitest';
import { useVisibilityStore } from '../visibilityStore';

describe('visibilityStore', () => {
    beforeEach(() => {
        useVisibilityStore.setState({ visibleDomains: new Set(), visibleTeams: new Set() });
    });

    it('should initially have no visible domains or teams', () => {
        const { visibleDomains, visibleTeams } = useVisibilityStore.getState();
        expect(visibleDomains.size).toBe(0);
        expect(visibleTeams.size).toBe(0);
    });

    it('should add a visible domain', () => {
        const { addVisibleDomain } = useVisibilityStore.getState();
        addVisibleDomain('domain-1');
        const { visibleDomains } = useVisibilityStore.getState();
        expect(visibleDomains.has('domain-1')).toBe(true);
    });

    it('should remove a visible domain', () => {
        const { addVisibleDomain, removeVisibleDomain } = useVisibilityStore.getState();
        addVisibleDomain('domain-1');
        removeVisibleDomain('domain-1');
        const { visibleDomains } = useVisibilityStore.getState();
        expect(visibleDomains.has('domain-1')).toBe(false);
    });
    
    it('should check if a domain is visible', () => {
         const { addVisibleDomain, isDomainVisible } = useVisibilityStore.getState();
         addVisibleDomain('domain-1');
         expect(isDomainVisible('domain-1')).toBe(true);
         expect(isDomainVisible('domain-2')).toBe(false);
    });

    // Similar tests for teams if needed, but the prompt says "track visible domains/teams"
    // Usually visibility is determined by camera frustum for domains, and then teams are loaded if domain is visible.
    // So maybe we just need to track visible domains for now? 
    // Wait, the prompt says "loading teams only when domain is in view".
    // This implies that we might need to know if a team should be rendered.
    // But typically if the domain is visible, we render the teams inside it.
    // Maybe we track visible domains, and components inside use that.
    
    it('should clear all visibility', () => {
        const { addVisibleDomain, clearVisibility } = useVisibilityStore.getState();
        addVisibleDomain('d1');
        clearVisibility();
        const { visibleDomains } = useVisibilityStore.getState();
        expect(visibleDomains.size).toBe(0);
    });
});
