import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getDomainHealthColor, HealthBadge } from '../HealthBadge';

vi.mock('@react-three/drei', () => ({
  Text: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="health-badge-text">{children}</div>
  ),
}));

describe('HealthBadge', () => {
  it('maps health status to the expected badge colors', () => {
    expect(getDomainHealthColor('healthy')).toBe('#4ade80');
    expect(getDomainHealthColor('at-risk')).toBe('#fbbf24');
    expect(getDomainHealthColor('fragile')).toBe('#ef4444');
  });

  it('renders a percentage badge for the supplied health score', () => {
    render(
      <HealthBadge
        health={{
          domainId: 'domain-1',
          score: 0.82,
          status: 'healthy',
          components: {
            couplingRatio: 0.1,
            centralizationFactor: 0.2,
            avgBlastRadius: 0.15,
          },
          serviceCount: 4,
        }}
      />
    );

    expect(screen.getByTestId('health-badge-text')).toHaveTextContent('82%');
  });
});
