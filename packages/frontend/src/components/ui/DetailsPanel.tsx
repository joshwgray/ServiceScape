import React from 'react';
import { tokens } from '../../styles/tokens';

export interface DetailsItem {
  id: string;
  name: string;
  type?: string;
  description?: string;
  owner?: string;
  members?: string[];
  stats?: {
    upstream: number;
    downstream: number;
  };
  tiers?: string[];
  [key: string]: any;
}

interface DetailsPanelProps {
  item: DetailsItem | null;
  onClose?: () => void;
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({ item, onClose }) => {
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
              cursor: 'pointer' 
            }}
          >
            ×
          </button>
        )}
      </div>

      <div style={{ marginBottom: 12 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '1rem' }}>{item.name}</h3>
        {item.type && (
          <span style={{ 
            fontSize: '0.8rem', 
            backgroundColor: tokens.colors.surface, 
            padding: '2px 6px', 
            borderRadius: 4, 
            textTransform: 'uppercase' 
          }}>
            {item.type}
          </span>
        )}
      </div>

      {item.description && (
        <p style={{ fontSize: '0.9rem', color: tokens.colors.text.secondary, marginBottom: 12 }}>
          {item.description}
        </p>
      )}

      {item.owner && (
        <div style={{ marginBottom: 8, fontSize: '0.9rem' }}>
          <strong style={{ color: tokens.colors.text.muted }}>Owner: </strong>
          {item.owner}
        </div>
      )}

      {item.tiers && item.tiers.length > 0 && (
         <div style={{ marginBottom: 8, fontSize: '0.9rem' }}>
           <strong style={{ color: tokens.colors.text.muted }}>Tiers: </strong>
           {item.tiers.join(', ')}
         </div>
      )}

      {item.stats && (
        <div style={{ 
          marginTop: 16, 
          padding: 12, 
          backgroundColor: tokens.colors.backgroundCode, 
          borderRadius: 4,
          display: 'flex',
          justifyContent: 'space-around'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{item.stats.upstream}</div>
            <div style={{ fontSize: '0.8rem', color: tokens.colors.text.muted }}>Upstream</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{item.stats.downstream}</div>
            <div style={{ fontSize: '0.8rem', color: tokens.colors.text.muted }}>Downstream</div>
          </div>
        </div>
      )}
      
      {item.members && item.members.length > 0 && (
          <div style={{ marginTop: 16 }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '0.9rem', color: tokens.colors.text.muted }}>Members</h4>
              <ul style={{ paddingLeft: 20, margin: 0, fontSize: '0.9rem' }}>
                  {item.members.map(m => <li key={m}>{m}</li>)}
              </ul>
          </div>
      )}
    </div>
  );
};
