import React from 'react';
import type { SuggestedStakeholder } from '@servicescape/shared';
import { tokens } from '../styles/tokens';

interface StakeholdersListProps {
  stakeholders: SuggestedStakeholder[];
}

export const StakeholdersList: React.FC<StakeholdersListProps> = ({ stakeholders }) => {
  if (stakeholders.length === 0) {
    return <div style={{ color: tokens.colors.text.secondary }}>No stakeholders identified.</div>;
  }

  return (
    <ul
      data-testid="stakeholders-list"
      style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      {stakeholders.map((stakeholder) => (
        <li
          key={`${stakeholder.teamId}:${stakeholder.memberId ?? 'unassigned'}`}
          data-testid="stakeholder-item"
          style={{
            padding: 10,
            borderRadius: 6,
            backgroundColor: tokens.colors.backgroundDark,
            border: `1px solid ${tokens.colors.borderSubtle}`,
          }}
        >
          <div style={{ fontWeight: 600 }}>{stakeholder.teamName}</div>
          <div style={{ fontSize: tokens.typography.size.sm }}>{stakeholder.memberName ?? 'Unassigned owner'}</div>
          <div style={{ fontSize: tokens.typography.size.xs, color: tokens.colors.text.muted }}>
            {[stakeholder.role, stakeholder.email].filter(Boolean).join(' · ') || 'No contact details'}
          </div>
        </li>
      ))}
    </ul>
  );
};
