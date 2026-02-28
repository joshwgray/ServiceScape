import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StakeholdersList } from '../StakeholdersList';

describe('StakeholdersList', () => {
  it('renders stakeholder names, teams, and contact details', () => {
    render(
      <StakeholdersList
        stakeholders={[
          {
            teamId: 'team-1',
            teamName: 'Platform Team',
            memberId: 'member-1',
            memberName: 'Alice Lead',
            email: 'alice@example.com',
            role: 'LEAD',
          },
        ]}
      />
    );

    expect(screen.getByTestId('stakeholder-item')).toHaveTextContent('Platform Team');
    expect(screen.getByTestId('stakeholder-item')).toHaveTextContent('Alice Lead');
    expect(screen.getByTestId('stakeholder-item')).toHaveTextContent('alice@example.com');
  });
});
