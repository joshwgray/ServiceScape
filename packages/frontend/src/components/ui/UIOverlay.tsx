import React, { useMemo } from 'react';
import { SearchBar } from './SearchBar';
import { DetailsPanel, DetailsItem } from './DetailsPanel';
import { FilterControls } from './FilterControls';
import { useSelectionStore } from '../../stores/selectionStore';
import { useOrganization } from '../../contexts/OrganizationContext';

export const UIOverlay: React.FC = () => {
    const { domains, teams, services } = useOrganization();
    const selectedServiceId = useSelectionStore((state) => state.selectedServiceId);
    const selectService = useSelectionStore((state) => state.selectService);
    const clearSelection = useSelectionStore((state) => state.clearSelection);

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
            <div style={{ position: 'absolute', top: 20, left: 20, pointerEvents: 'auto' }}>
                <SearchBar items={searchableItems} onSelect={handleSelect} placeholder="Search services, teams, domains..." />
            </div>

            <FilterControls />
            
            <DetailsPanel 
                item={selectedItem as DetailsItem} 
                onClose={clearSelection} 
            />
        </div>
    );
};
