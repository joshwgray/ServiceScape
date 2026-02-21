import React, { useMemo, useEffect } from 'react';
import { SearchBar } from './SearchBar';
import { FilterControls } from './FilterControls';
import { NavigationMenu } from './NavigationMenu';
import { DetailsPanel } from './DetailsPanel';
import { DetailsItem } from './SpeechBubbleContent';
import { useSelectionStore } from '../../stores/selectionStore';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useServiceDetails } from '../../hooks/useServiceDetails';
import { useTeamMembers } from '../../hooks/useTeamMembers';
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

    services.forEach((s) => {
      items.push({ ...s, type: "service" });
    });

    return items;
  }, [domains, teams, services]);

  // Derive selected item details
  const selectedItem = useMemo(() => {
    if (!selectedServiceId) return null;
    return searchableItems.find((i) => i.id === selectedServiceId) || null;
  }, [selectedServiceId, searchableItems]);

    // Use enrichment hook if selected item is a service
    const isService = selectedItem?.type === 'service';
    const { details: enrichedDetails } = useServiceDetails(
        isService && selectedServiceId ? selectedServiceId : null
    );

  // Extract teamId only when selected item is a service
  const teamId: string | undefined =
    selectedItem?.type === "service"
      ? (selectedItem.teamId as string | undefined)
      : undefined;

  // Fetch team members for the selected service's team
  const { members, loading: membersLoading } = useTeamMembers(teamId);

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

  // Handle search selection
  const handleSelect = (item: any) => {
    selectService(item.id);
  };

    // Determine if we should show the backdrop (to capture clicks)
    // We only want to capture clicks if the bubble is open.
    // const showBackdrop = !!selectedServiceId && !!screenPosition;

    return (
        <div 
            // onClick={showBackdrop ? handleBackgroundClick : undefined}
            data-testid="ui-overlay-container"
            style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none', // Allow clicks to pass through to the scene
            zIndex: 10
        }}>
            <div style={{ pointerEvents: 'auto' }}>
                <NavigationMenu />
            </div>

            <div style={{ position: 'absolute', top: 20, left: 70, pointerEvents: 'auto', zIndex: 90 }}>
                <SearchBar items={searchableItems} onSelect={handleSelect} placeholder="Search services, teams, domains..." />
            </div>

            <FilterControls />
            
            <DetailsPanel 
                item={displayedItem}
                members={members}
                membersLoading={membersLoading}
                onClose={clearSelection}
            />
        </div>
    );
};
