import React, { useState, useMemo, useEffect } from 'react';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useSelectionStore } from '../../stores/selectionStore';
import { NavigationMenuItem } from './NavigationMenuItem';
import { tokens } from '../../styles/tokens';

interface FlatItem {
    id: string;
    name: string;
    type: 'domain' | 'team' | 'service';
    level: number;
    hasChildren: boolean;
    childrenIds: string[];
    parentId: string | null;
}

export const NavigationMenu: React.FC = () => {
    const { domains, teams, services, loading } = useOrganization();
    const selectedServiceId = useSelectionStore((s) => s.selectedServiceId);
    const selectService = useSelectionStore((s) => s.selectService);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [isOpen, setIsOpen] = useState(false);
    const [focusedId, setFocusedId] = useState<string | null>(null);
    // menuRef removed as it was unused

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedIds);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedIds(newExpanded);
    };

    const toggleMenu = () => setIsOpen(!isOpen);

    // Auto-expand ancestors when selection changes
    useEffect(() => {
        if (!selectedServiceId || !domains || !teams || !services) return;

        const ancestors = new Set<string>();
        let currentId = selectedServiceId;
        
        // Check if it's a service
        const service = services.find(s => s.id === currentId);
        if (service) {
            ancestors.add(service.teamId);
            const team = teams.find(t => t.id === service.teamId);
            if (team) {
                ancestors.add(team.domainId);
            }
        } else {
            // Check if it's a team
            const team = teams.find(t => t.id === currentId);
            if (team) {
                ancestors.add(team.domainId);
            }
        }
        
        if (ancestors.size > 0) {
            setExpandedIds(prev => {
                const next = new Set(prev);
                ancestors.forEach(id => next.add(id));
                return next;
            });
        }
    }, [selectedServiceId, domains, teams, services]);

    // Grouping logic
    const tree = useMemo(() => {
        if (!domains) return [];

        return domains.map(domain => {
            const domainTeams = teams.filter(t => t.domainId === domain.id);
            return {
                ...domain,
                type: 'domain' as const,
                children: domainTeams.map(team => {
                    const teamServices = services.filter(s => s.teamId === team.id);
                    return {
                        ...team,
                        type: 'team' as const,
                        children: teamServices.map(service => ({
                            ...service,
                            type: 'service' as const,
                            children: []
                        }))
                    };
                })
            };
        });
    }, [domains, teams, services]);

    // Flatten visible items for keyboard navigation
    const visibleItems = useMemo(() => {
        const items: FlatItem[] = [];
        
        const traverse = (nodes: any[], level: number, parentId: string | null) => {
            nodes.forEach(node => {
                items.push({
                    id: node.id,
                    name: node.name,
                    type: node.type,
                    level,
                    hasChildren: node.children && node.children.length > 0,
                    childrenIds: node.children ? node.children.map((c: any) => c.id) : [],
                    parentId
                });
                
                if (expandedIds.has(node.id) && node.children) {
                    traverse(node.children, level + 1, node.id);
                }
            });
        };

        traverse(tree, 0, null);
        return items;
    }, [tree, expandedIds]);

    // Keyboard handlers
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
             // Global toggle
            if (e.key.toLowerCase() === 'n' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
                e.preventDefault();
                setIsOpen(prev => !prev);
                return;
            }

            if (!isOpen) return;

            switch (e.key) {
                case 'Escape':
                    setIsOpen(false);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    setFocusedId(prev => {
                        const idx = visibleItems.findIndex(item => item.id === prev);
                        if (idx === -1 || idx === visibleItems.length - 1) return visibleItems[0]?.id || null;
                        return visibleItems[idx + 1].id;
                    });
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setFocusedId(prev => {
                        const idx = visibleItems.findIndex(item => item.id === prev);
                        if (idx <= 0) return visibleItems[visibleItems.length - 1]?.id || null;
                        return visibleItems[idx - 1].id;
                    });
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (focusedId) {
                        selectService(focusedId);
                    }
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (focusedId) {
                        const item = visibleItems.find(i => i.id === focusedId);
                        if (item && item.hasChildren && !expandedIds.has(item.id)) {
                            toggleExpand(item.id);
                        }
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    if (focusedId) {
                        const item = visibleItems.find(i => i.id === focusedId);
                        if (item && expandedIds.has(item.id)) {
                            toggleExpand(item.id);
                        } else if (item && item.parentId) {
                            // Move to parent
                            setFocusedId(item.parentId);
                        }
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, visibleItems, expandedIds, focusedId, selectService]);

    // Initialize focus when menu opens
    useEffect(() => {
        if (isOpen && !focusedId && visibleItems.length > 0) {
            setFocusedId(visibleItems[0].id);
        }
    }, [isOpen, visibleItems, focusedId]);

    if (loading) return <div>Loading...</div>;

    return (
        <>
            {/* Hamburger Button */}
            <button 
                onClick={toggleMenu}
                style={{
                    position: 'absolute',
                    top: tokens.layout.spacing.md,
                    left: tokens.layout.spacing.md,
                    zIndex: 90,
                    padding: tokens.layout.spacing.xs,
                    backgroundColor: tokens.colors.surface,
                    color: tokens.colors.text.primary,
                    border: `1px solid ${tokens.colors.border}`,
                    borderRadius: tokens.layout.borderRadius,
                    cursor: 'pointer',
                    opacity: isOpen ? 0 : 1,
                    pointerEvents: isOpen ? 'none' : 'auto',
                    transition: 'opacity 0.2s ease',
                }}
                aria-label="Open Navigation Menu"
            >
                ☰
            </button>

            {/* Menu Container */}
            <div 
                style={{
                    position: 'absolute',
                    top: tokens.layout.spacing.md,
                    left: tokens.layout.spacing.md,
                    width: '250px',
                    maxHeight: 'calc(100vh - 40px)',
                    backgroundColor: tokens.colors.backgroundOverlay,
                    backdropFilter: 'blur(5px)',
                    border: `1px solid ${tokens.colors.border}`,
                    borderRadius: tokens.layout.borderRadius,
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 100,
                    color: tokens.colors.text.primary,
                    boxShadow: tokens.colors.shadow.floating,
                    pointerEvents: isOpen ? 'auto' : 'none',
                    opacity: isOpen ? 1 : 0,
                    transform: isOpen ? 'translateX(0)' : 'translateX(-20px)',
                    transition: 'opacity 0.2s ease, transform 0.2s ease',
                }}
            >
                <div style={{
                    padding: tokens.layout.spacing.sm,
                    borderBottom: `1px solid ${tokens.colors.borderSubtle}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h3 style={{ margin: 0, fontSize: tokens.typography.size.md }}>Organization</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', color: tokens.colors.text.muted }}>[N] Close</span>
                        <button 
                            onClick={toggleMenu}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: tokens.colors.text.muted,
                                cursor: 'pointer',
                                fontSize: tokens.typography.size.lg
                            }}
                            aria-label="Close Navigation Menu"
                        >
                            ×
                        </button>
                    </div>
                </div>
                
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {isOpen && visibleItems.map(item => (
                        <NavigationMenuItem
                            key={item.id}
                            id={item.id}
                            name={item.name}
                            type={item.type}
                            level={item.level}
                            isSelected={selectedServiceId === item.id}
                            isFocused={focusedId === item.id}
                            hasChildren={item.hasChildren}
                            isExpanded={expandedIds.has(item.id)}
                            onToggle={() => toggleExpand(item.id)}
                        />
                    ))}
                    {visibleItems.length === 0 && (
                         <div style={{ padding: tokens.layout.spacing.md, color: tokens.colors.text.muted }}>
                             No domains found
                         </div>
                    )}
                </div>
            </div>
        </>
    );
};
