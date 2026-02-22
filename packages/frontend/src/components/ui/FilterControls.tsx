import React from 'react';
import { useSelectionStore } from '../../stores/selectionStore';
import { tokens } from '../../styles/tokens';

export const FilterControls: React.FC = () => {
    // Note: Shallow compare or multiple hooks is better for performance, but simple selector is fine for now
    const dependencyFilters = useSelectionStore((state) => state.dependencyFilters);
    const toggleFilter = useSelectionStore((state) => state.toggleFilter);

    // If dependencyFilters isn't in store yet, fallback to default or update store
    // The previous read of selectionStore showed:
    // dependencyFilters: { declared: boolean; observed: boolean; }
    // toggleFilter: (filter: 'declared' | 'observed') => void;
    // So types are correct.

    return (
        <div style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            backgroundColor: tokens.colors.backgroundOverlay,
            padding: tokens.layout.spacing.md,
            borderRadius: 8,
            boxShadow: tokens.colors.shadow.floating,
            backdropFilter: 'blur(4px)',
            border: `1px solid ${tokens.colors.border}`,
            color: tokens.colors.text.primary,
            pointerEvents: 'auto'
        }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: tokens.colors.text.secondary }}>Dependencies</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '13px' }}>
                    <input
                        type="checkbox"
                        checked={dependencyFilters?.declared ?? true}
                        onChange={() => toggleFilter('declared')}
                        style={{ marginRight: 8 }}
                    />
                    Declared
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '13px' }}>
                    <input
                        type="checkbox"
                        checked={dependencyFilters?.observed ?? true}
                        onChange={() => toggleFilter('observed')}
                        style={{ marginRight: 8 }}
                    />
                    Observed
                </label>
            </div>
        </div>
    );
};
