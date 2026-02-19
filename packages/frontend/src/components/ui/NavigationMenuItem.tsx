import React, { useCallback, useState } from 'react';
import { useSelectionStore } from '../../stores/selectionStore';
import { tokens } from '../../styles/tokens';

export interface NavigationMenuItemProps {
  id: string;
  name: string;
  type: 'domain' | 'team' | 'service';
  level: number;
  isSelected?: boolean;
  isFocused?: boolean;
  hasChildren?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
}

export const NavigationMenuItem: React.FC<NavigationMenuItemProps> = ({
  id,
  name,
  type,
  level,
  isSelected,
  isFocused,
  hasChildren,
  isExpanded,
  onToggle,
  onClick
}) => {
  const selectService = useSelectionStore((s) => s.selectService);
  const [isHovered, setIsHovered] = useState(false);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggle) {
      onToggle();
    }
  }, [onToggle]);

  const handleClick = useCallback(() => {
    selectService(id);
    if (onClick) {
      onClick();
    }
  }, [id, onClick, selectService]);

  const indentStep = parseInt(tokens.layout.spacing.lg, 10); // 20px
  
  // Determine background color based on state priority: Focused > Selected > Hover > Default
  let backgroundColor = 'transparent';
  if (isFocused) {
    backgroundColor = tokens.colors.surfaceHighlight;
  } else if (isSelected) {
    backgroundColor = tokens.colors.primary + '33';
  } else if (isHovered) {
    backgroundColor = tokens.colors.surfaceHighlight + '80'; // 50% opacity for hover
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`nav-item-${id}`}
      data-focused={isFocused}
      style={{
        paddingLeft: `calc(${tokens.layout.spacing.sm} + ${level * indentStep}px)`,
        paddingRight: tokens.layout.spacing.sm,
        paddingTop: tokens.layout.spacing.xs,
        paddingBottom: tokens.layout.spacing.xs,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        backgroundColor,
        outline: isFocused ? `1px dashed ${tokens.colors.primary}` : 'none',
        color: isSelected ? tokens.colors.primary : tokens.colors.text.primary,
        fontSize: tokens.typography.size.sm,
        borderLeft: isSelected ? `2px solid ${tokens.colors.primary}` : '2px solid transparent',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ 
          width: `calc(${tokens.layout.spacing.sm} * 2)`, // 16px
          display: 'flex', 
          justifyContent: 'center',
          marginRight: tokens.layout.spacing.xs,
          cursor: hasChildren ? 'pointer' : 'default'
      }}
      onClick={hasChildren ? handleToggle : undefined}
      role={hasChildren ? "button" : undefined}
      aria-label={hasChildren ? (isExpanded ? "Collapse" : "Expand") : undefined}
      >
        {hasChildren && (
          <span style={{ fontSize: '10px' }}>{isExpanded ? '▼' : '▶'}</span>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <span style={{ fontWeight: type === 'domain' ? 'bold' : 'normal' }}>
            {name}
        </span>
      </div>
    </div>
  );
};
