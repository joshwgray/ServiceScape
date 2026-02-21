import React from 'react';
import { tokens } from '../../styles/tokens';
import { MemberAvatar } from './MemberAvatar';
import type { TeamMemberDetail } from '@servicescape/shared';

export interface DetailsItem {
  id: string;
  name: string;
  type?: string;
  description?: string;
  owner?: string;
  members?: string[]; // Legacy/fallback
  stats?: {
    upstream: number;
    downstream: number;
  };
  tiers?: string[];
  links?: { label: string; url: string; }[];
  [key: string]: any;
}

export interface SpeechBubbleContentProps {
  item: DetailsItem | null;
  members?: TeamMemberDetail[];
  membersLoading?: boolean;
}

export const SpeechBubbleContent: React.FC<SpeechBubbleContentProps> = ({ item, members, membersLoading }) => {
  if (!item) return null;

  return (
    <>
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
         <div style={{ marginBottom: 12 }}>
           <div style={{ fontSize: '0.9rem', marginBottom: 4, color: tokens.colors.text.muted, fontWeight: 'bold' }}>Tiers</div>
           <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
             {item.tiers.map((tier) => (
               <span 
                 key={tier}
                 style={{ 
                   fontSize: '0.8rem', 
                   backgroundColor: tokens.colors.surface, 
                   color: tokens.colors.text.primary,
                   padding: '2px 8px', 
                   borderRadius: 12,
                   border: `1px solid ${tokens.colors.border}`,
                 }}
               >
                 {tier}
               </span>
             ))}
           </div>
         </div>
      )}

      {item.links && item.links.length > 0 && (
         <div style={{ marginBottom: 12 }}>
           <div style={{ fontSize: '0.9rem', marginBottom: 4, color: tokens.colors.text.muted, fontWeight: 'bold' }}>Links</div>
           <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
             {item.links.map((link, idx) => (
               <li key={idx} style={{ marginBottom: 4 }}>
                 <a 
                   href={link.url} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   style={{ 
                     color: tokens.colors.primary, 
                     fontSize: '0.9rem',
                     textDecoration: 'none'
                   }}
                 >
                   {link.label}
                 </a>
               </li>
             ))}
           </ul>
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
      
      {/* Existing string-based members list (fallback or legacy) */}
      {!members && !membersLoading && item.members && item.members.length > 0 && (
          <div style={{ marginTop: 16 }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '0.9rem', color: tokens.colors.text.muted }}>Members</h4>
              <ul style={{ paddingLeft: 20, margin: 0, fontSize: '0.9rem' }}>
                  {item.members.map(m => <li key={m}>{m}</li>)}
              </ul>
          </div>
      )}

      {/* New rich members list with Avatars */}
      {(members !== undefined || membersLoading) && (
        <div style={{ marginTop: 16 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: tokens.colors.text.muted }}>Team Members</h4>
          
          {membersLoading ? (
            <div style={{ fontSize: '0.9rem', color: tokens.colors.text.secondary, fontStyle: 'italic' }}>
              Loading members...
            </div>
          ) : members && members.length > 0 ? (
            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              margin: 0, 
              display: 'flex', 
              flexDirection: 'column',
              gap: 8 
            }}>
              {members.map(member => (
                <li key={member.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12,
                  padding: '8px',
                  backgroundColor: tokens.colors.backgroundDark,
                  borderRadius: 4,
                  border: `1px solid ${tokens.colors.borderSubtle}`
                }}>
                  <MemberAvatar role={member.role} name={member.name} size={32} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{member.name}</span>
                    <span style={{ fontSize: '0.8rem', color: tokens.colors.text.muted }}>{member.role}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ fontSize: '0.9rem', color: tokens.colors.text.secondary, fontStyle: 'italic' }}>
              No team members
            </div>
          )}
        </div>
      )}
    </>
  );
};
