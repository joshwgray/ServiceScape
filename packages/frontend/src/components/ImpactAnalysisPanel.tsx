import React from 'react';
import type { ChangeImpactAnalysis } from '@servicescape/shared';
import { tokens } from '../styles/tokens';
import { AffectedServicesList } from './AffectedServicesList';
import { StakeholdersList } from './StakeholdersList';

interface ImpactAnalysisPanelProps {
  analysis: ChangeImpactAnalysis | null;
  loading: boolean;
  error: Error | null;
  serviceName?: string;
  onClose: () => void;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export const ImpactAnalysisPanel: React.FC<ImpactAnalysisPanelProps> = ({
  analysis,
  loading,
  error,
  serviceName,
  onClose,
}) => {
  if (!loading && !error && !analysis) {
    return null;
  }

  return (
    <aside
      data-testid="impact-analysis-panel"
      style={{
        position: 'absolute',
        top: 20,
        right: 340,
        width: 360,
        maxHeight: 'calc(100vh - 40px)',
        overflowY: 'auto',
        padding: 16,
        backgroundColor: tokens.colors.backgroundOverlay,
        color: tokens.colors.text.primary,
        borderRadius: 8,
        boxShadow: tokens.colors.shadow.floating,
        backdropFilter: 'blur(4px)',
        border: `1px solid ${tokens.colors.border}`,
        pointerEvents: 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: tokens.typography.size.lg }}>Impact Analysis</h2>
          {serviceName ? (
            <div style={{ marginTop: 4, color: tokens.colors.text.muted, fontSize: tokens.typography.size.sm }}>
              {serviceName}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Close impact analysis panel"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: tokens.colors.text.secondary,
            fontSize: '1.2rem',
            cursor: 'pointer',
            padding: 4,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {loading ? (
        <div style={{ color: tokens.colors.text.secondary }}>Analyzing impact...</div>
      ) : null}

      {error ? (
        <div data-testid="impact-analysis-error" style={{ color: '#fca5a5' }}>
          {error.message}
        </div>
      ) : null}

      {analysis ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 10,
            }}
          >
            <div style={{ padding: 10, borderRadius: 6, backgroundColor: tokens.colors.backgroundDark }}>
              <div style={{ fontSize: tokens.typography.size.xs, color: tokens.colors.text.muted }}>Risk Score</div>
              <div data-testid="impact-risk-score" style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                {formatPercent(Math.min(1, analysis.riskScore))}
              </div>
            </div>
            <div style={{ padding: 10, borderRadius: 6, backgroundColor: tokens.colors.backgroundDark }}>
              <div style={{ fontSize: tokens.typography.size.xs, color: tokens.colors.text.muted }}>Affected Services</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{analysis.affectedCount}</div>
            </div>
            <div style={{ padding: 10, borderRadius: 6, backgroundColor: tokens.colors.backgroundDark }}>
              <div style={{ fontSize: tokens.typography.size.xs, color: tokens.colors.text.muted }}>Affected Domains</div>
              <div>{analysis.affectedDomainIds.join(', ') || 'None'}</div>
            </div>
            <div style={{ padding: 10, borderRadius: 6, backgroundColor: tokens.colors.backgroundDark }}>
              <div style={{ fontSize: tokens.typography.size.xs, color: tokens.colors.text.muted }}>Avg Centrality</div>
              <div>{formatPercent(analysis.avgCentrality)}</div>
            </div>
          </div>

          <section>
            <h3 style={{ margin: '0 0 8px', fontSize: tokens.typography.size.md }}>Affected Services</h3>
            <AffectedServicesList services={analysis.affectedServices} />
          </section>

          <section>
            <h3 style={{ margin: '0 0 8px', fontSize: tokens.typography.size.md }}>Stakeholders</h3>
            <StakeholdersList stakeholders={analysis.stakeholders} />
          </section>
        </div>
      ) : null}
    </aside>
  );
};
