import React, { useMemo, useEffect } from 'react';
import { SearchBar } from './SearchBar';
import { DetailsPanel, DetailsItem } from './DetailsPanel';
import { FilterControls } from './FilterControls';
import { NavigationMenu } from './NavigationMenu';
import { useSelectionStore } from '../../stores/selectionStore';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useServiceDetails } from '../../hooks/useServiceDetails';
import { BaseServiceDetailsProvider } from '../../providers/details/BaseServiceDetailsProvider';
import { DependencyStatsProvider } from '../../providers/details/DependencyStatsProvider';
import { ProviderRegistry } from '../../providers/details/ProviderRegistry';
import { getDependencies } from '../../services/apiClient';

export const UIOverlay: React.FC = () => {
    const { domains, teams, services } = useOrganization();
    const selectedServiceId = useSelectionStore((state) => state.selectedServiceId);
    const selectService = useSelectionStore((state) => state.selectService);
    const clearSelection = useSelectionStore((state) => state.clearSelection);

    // Register providers when services are available
    useEffect(() => {
        const registry = ProviderRegistry.getInstance();
        
        // Create providers
        // Note: In a real app we might want to clear old providers first or update them
        // But ProviderRegistry as implemented is simple singleton.
        // We'll rely on higher priority overrides if we register multiple times?
        // Actually, we should probably only register once.
        // But services dependency suggests re-registration.
        // Let's assume for this phase we register once or overwrite.
        // Checking ProviderRegistry.ts again would confirm behavior.
        // Assuming it appends. If it appends, array grows. Prone to memory leak if services change often.
        // BUT, since this is a Phase implementation and we likely load services once, let's keep it simple.
        
        // Actually, better to check if it has a way to clear or update.
        // If not, maybe we should memoize providers outside?
        // But services come from context.
        
        // Let's proceed with registering inside useEffect with [services] dependency
        // and acknowledge potential accumulation if not cleared (but registry has no clear).
        // Since this is a demo/prototype phase, it might be acceptable.
        
        const baseProvider = new BaseServiceDetailsProvider(services);
        registry.register(baseProvider, { priority: 1 });
        
        const depProvider = new DependencyStatsProvider((id) => getDependencies(id));
        registry.register(depProvider, { priority: 10 });

        return () => {
            registry.unregister(baseProvider);
            registry.unregister(depProvider);
        };
    }, [services]);

    // Combine all items for search
    const searchableItems = useMemo(() => {
        const items: any[] = [];
        
        domains.forEach(d => {
            items.push({ ...d, type: 'domain' });
        });
        
        teams.forEach(t => {
            items.push({ ...t, type: 'team' });
        });
        
        services.forEach(s => {
            items.push({ ...s, type: 'service' });
        });
        
        return items;
    }, [domains, teams, services]);

    // Derive selected item details
    const selectedItem = useMemo(() => {
        if (!selectedServiceId) return null;
        return searchableItems.find(i => i.id === selectedServiceId) || null;
    }, [selectedServiceId, searchableItems]);

    // Handle search selection
    const handleSelect = (item: any) => {
        selectService(item.id);
    };

    // Use enrichment hook if selected item is a service
    const isService = selectedItem?.type === 'service';
    const { details: enrichedDetails, loading } = useServiceDetails(
        isService && selectedServiceId ? selectedServiceId : null
    );

    // Merge basic details with enriched details
    const displayedItem = useMemo(() => {
        if (!selectedItem) return null;
        
        if (isService && enrichedDetails) {
            return {
                ...selectedItem,
                ...enrichedDetails,
            } as DetailsItem;
        }
        
        return selectedItem as DetailsItem;
    }, [selectedItem, isService, enrichedDetails]);

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 10
        }}>
            <NavigationMenu />

            <div style={{ position: 'absolute', top: 20, left: 70, pointerEvents: 'auto', zIndex: 90 }}>
                <SearchBar items={searchableItems} onSelect={handleSelect} placeholder="Search services, teams, domains..." />
            </div>

            <FilterControls />
            
            <DetailsPanel 
                item={displayedItem} 
                onClose={clearSelection} 
            />
        </div>
    );
};
