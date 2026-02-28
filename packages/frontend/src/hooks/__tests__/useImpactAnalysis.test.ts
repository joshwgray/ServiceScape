import { renderHook, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as analyticsService from '../../services/analyticsService';
import { __resetImpactAnalysisCacheForTests, useImpactAnalysis } from '../useImpactAnalysis';

vi.mock('../../services/analyticsService', () => ({
  analyzeImpact: vi.fn(),
}));

describe('useImpactAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetImpactAnalysisCacheForTests();
  });

  it('posts impact analysis for a selected service', async () => {
    vi.mocked(analyticsService.analyzeImpact).mockResolvedValue({
      serviceId: 'service-1',
      changeType: 'CODE_CHANGE',
      affectedCount: 2,
      affectedServices: [],
      affectedTeamIds: ['team-1'],
      affectedDomainIds: ['domain-1'],
      avgCentrality: 0.4,
      crossDomainFactor: 0.2,
      riskScore: 0.6,
      stakeholders: [],
    });

    const { result } = renderHook(() => useImpactAnalysis());

    await act(async () => {
      await result.current.analyzeImpact('service-1');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(analyticsService.analyzeImpact).toHaveBeenCalledWith('service-1', 'CODE_CHANGE');
    expect(result.current.analysis?.serviceId).toBe('service-1');
  });

  it('reuses cached impact analysis across repeated requests', async () => {
    vi.mocked(analyticsService.analyzeImpact).mockResolvedValue({
      serviceId: 'service-1',
      changeType: 'CODE_CHANGE',
      affectedCount: 1,
      affectedServices: [],
      affectedTeamIds: [],
      affectedDomainIds: [],
      avgCentrality: 0.2,
      crossDomainFactor: 0,
      riskScore: 0.2,
      stakeholders: [],
    });

    const { result } = renderHook(() => useImpactAnalysis());

    await act(async () => {
      await result.current.analyzeImpact('service-1');
      await result.current.analyzeImpact('service-1');
    });

    expect(analyticsService.analyzeImpact).toHaveBeenCalledTimes(1);
  });

  it('clears stale analysis state on demand', async () => {
    vi.mocked(analyticsService.analyzeImpact).mockResolvedValue({
      serviceId: 'service-1',
      changeType: 'CODE_CHANGE',
      affectedCount: 1,
      affectedServices: [],
      affectedTeamIds: [],
      affectedDomainIds: [],
      avgCentrality: 0.2,
      crossDomainFactor: 0,
      riskScore: 0.2,
      stakeholders: [],
    });

    const { result } = renderHook(() => useImpactAnalysis());

    await act(async () => {
      await result.current.analyzeImpact('service-1');
    });

    act(() => {
      result.current.clearAnalysis();
    });

    expect(result.current.analysis).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
