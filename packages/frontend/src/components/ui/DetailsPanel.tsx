import React from 'react';
import { tokens } from '../../styles/tokens';
import type { TeamMemberDetail } from '@servicescape/shared';
import { SpeechBubbleContent, DetailsItem } from './SpeechBubbleContent';
export type { DetailsItem };

interface DetailsPanelProps {
  item: DetailsItem | null;
  onClose?: () => void;
  members?: TeamMemberDetail[];
  membersLoading?: boolean;
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({ item, onClose, members, membersLoading }) => {
  if (!item) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 20,
      right: 20,
      width: 300,
      padding: 16,
      backgroundColor: tokens.colors.backgroundOverlay,
      color: tokens.colors.text.primary,
      borderRadius: 8,
      boxShadow: tokens.colors.shadow.floating,
      backdropFilter: 'blur(4px)',
      border: `1px solid ${tokens.colors.border}`,
      pointerEvents: 'auto',
      maxHeight: 'calc(100vh - 40px)',
      overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Details</h2>
        {onClose && (
          <button 
            type="button"
            aria-label="Close details panel"
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: tokens.colors.text.secondary, 
              fontSize: '1.2rem', 
              cursor: 'pointer',
              padding: 4,
              lineHeight: 1
            }}
          >
            ×
          </button>
        )}
      </div>

      <SpeechBubbleContent item={item} members={members} membersLoading={membersLoading} />
    </div>
  );
};
