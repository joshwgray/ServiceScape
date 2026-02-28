import React, { useMemo } from 'react';
import type { ImpactedService } from '@servicescape/shared';
import { tokens } from '../styles/tokens';

interface AffectedServicesListProps {
  services: ImpactedService[];
}

function getRiskColor(centrality: number): string {
  if (centrality >= 0.7) {
    return '#ef4444';
  }
  if (centrality >= 0.4) {
    return '#f59e0b';
  }
  return '#4ade80';
}

export const AffectedServicesList: React.FC<AffectedServicesListProps> = ({ services }) => {
  const sortedServices = useMemo(
    () => [...services].sort((left, right) => right.centrality - left.centrality),
    [services]
  );

  if (sortedServices.length === 0) {
    return <div style={{ color: tokens.colors.text.secondary }}>No downstream services affected.</div>;
  }

  return (
    <ul
      data-testid="affected-services-list"
      style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      {sortedServices.map((service) => (
        <li
          key={service.serviceId}
          data-testid="affected-service-item"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            padding: 10,
            borderRadius: 6,
            backgroundColor: tokens.colors.backgroundDark,
            border: `1px solid ${tokens.colors.borderSubtle}`,
          }}
        >
          <div>
            <div style={{ fontWeight: 600 }}>{service.serviceName}</div>
            <div style={{ fontSize: tokens.typography.size.xs, color: tokens.colors.text.muted }}>
              {service.teamId ?? 'Unknown team'} · {service.domainId ?? 'Unknown domain'}
            </div>
          </div>
          <div
            data-testid="affected-service-risk"
            style={{
              alignSelf: 'center',
              color: getRiskColor(service.centrality),
              fontWeight: 700,
              fontSize: tokens.typography.size.sm,
            }}
          >
            {Math.round(service.centrality * 100)}%
          </div>
        </li>
      ))}
    </ul>
  );
};
