import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ImpactAnalysisPanel } from '../ImpactAnalysisPanel';

describe('ImpactAnalysisPanel', () => {
  it('renders analysis results when data is available', () => {
    render(
      <ImpactAnalysisPanel
        serviceName="Auth Service"
        loading={false}
        error={null}
        onClose={vi.fn()}
        analysis={{
          serviceId: 'service-1',
          changeType: 'CODE_CHANGE',
          affectedCount: 2,
          affectedServices: [
            {
              serviceId: 'service-2',
              serviceName: 'Billing Service',
              teamId: 'team-2',
              domainId: 'domain-2',
              centrality: 0.8,
            },
          ],
          affectedTeamIds: ['team-2'],
          affectedDomainIds: ['domain-2'],
          avgCentrality: 0.5,
          crossDomainFactor: 0.5,
          riskScore: 0.75,
          stakeholders: [
            {
              teamId: 'team-2',
              teamName: 'Billing Team',
              memberId: 'member-1',
              memberName: 'Bob Manager',
              email: 'bob@example.com',
              role: 'MANAGER',
            },
          ],
        }}
      />
    );

    expect(screen.getByTestId('impact-analysis-panel')).toBeInTheDocument();
    expect(screen.getByTestId('impact-risk-score')).toHaveTextContent('75%');
    expect(screen.getByText('Billing Service')).toBeInTheDocument();
    expect(screen.getByText('Bob Manager')).toBeInTheDocument();
  });

  it('closes when the close button is clicked', () => {
    const onClose = vi.fn();

    render(
      <ImpactAnalysisPanel
        serviceName="Auth Service"
        loading={false}
        error={null}
        onClose={onClose}
        analysis={{
          serviceId: 'service-1',
          changeType: 'CODE_CHANGE',
          affectedCount: 0,
          affectedServices: [],
          affectedTeamIds: [],
          affectedDomainIds: [],
          avgCentrality: 0,
          crossDomainFactor: 0,
          riskScore: 0,
          stakeholders: [],
        }}
      />
    );

    fireEvent.click(screen.getByLabelText('Close impact analysis panel'));
    expect(onClose).toHaveBeenCalled();
  });
});
