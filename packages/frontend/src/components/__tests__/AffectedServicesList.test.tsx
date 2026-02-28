import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AffectedServicesList } from '../AffectedServicesList';

describe('AffectedServicesList', () => {
  it('renders impacted services sorted by centrality descending', () => {
    render(
      <AffectedServicesList
        services={[
          {
            serviceId: 'service-1',
            serviceName: 'Low Risk Service',
            teamId: 'team-1',
            domainId: 'domain-1',
            centrality: 0.2,
          },
          {
            serviceId: 'service-2',
            serviceName: 'High Risk Service',
            teamId: 'team-2',
            domainId: 'domain-2',
            centrality: 0.8,
          },
        ]}
      />
    );

    const items = screen.getAllByTestId('affected-service-item');
    expect(items[0]).toHaveTextContent('High Risk Service');
    expect(items[1]).toHaveTextContent('Low Risk Service');
  });
});
