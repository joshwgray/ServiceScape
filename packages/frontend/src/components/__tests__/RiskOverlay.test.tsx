import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RiskOverlay } from '../RiskOverlay';

describe('RiskOverlay', () => {
  it('renders nothing when risk level is none', () => {
    const { container } = render(
      <RiskOverlay riskLevel="none" glowIntensity={0} totalHeight={2} />
    );

    expect(container.innerHTML).toBe('');
  });

  it('renders an overlay mesh for amber and red risk levels', () => {
    const amber = render(
      <RiskOverlay riskLevel="amber" glowIntensity={0.6} totalHeight={2} />
    );
    const red = render(
      <RiskOverlay riskLevel="red" glowIntensity={0.9} totalHeight={3} />
    );

    expect(amber.container.querySelector('mesh')).toBeTruthy();
    expect(red.container.querySelector('mesh')).toBeTruthy();
  });
});
