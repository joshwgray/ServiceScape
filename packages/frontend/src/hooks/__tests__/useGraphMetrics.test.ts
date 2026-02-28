import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGraphMetrics } from '../useGraphMetrics';
import * as analyticsService from '../../services/analyticsService';

vi.mock('../../services/analyticsService', () => ({
  getMetrics: vi.fn(),
  getGodServices: vi.fn(),
  getBlastRadius: vi.fn(),
}));

describe('useGraphMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads metrics and computes team risk summaries', async () => {
    const services = [
      { id: 'service-1', teamId: 'team-1', name: 'Service 1' },
      { id: 'service-2', teamId: 'team-2', name: 'Service 2' },
    ];

    vi.mocked(analyticsService.getMetrics).mockResolvedValue({
      services: [
        {
          serviceId: 'service-1',
          inDegree: 0.2,
          outDegree: 0.2,
          totalDegree: 0.3,
          betweenness: 0.8,
          pageRank: 0.7,
        },
        {
          serviceId: 'service-2',
          inDegree: 0.1,
          outDegree: 0.1,
          totalDegree: 0.2,
          betweenness: 0.2,
          pageRank: 0.2,
        },
      ],
    });
    vi.mocked(analyticsService.getGodServices).mockResolvedValue([
      {
        serviceId: 'service-2',
        betweenness: 0.2,
        crossDomainEdgeCount: 1,
      },
    ]);
    vi.mocked(analyticsService.getBlastRadius)
      .mockResolvedValueOnce({
        serviceId: 'service-1',
        affectedServiceIds: ['x'],
        affectedCount: 1,
        blastRadius: 0.9,
      })
      .mockResolvedValueOnce({
        serviceId: 'service-2',
        affectedServiceIds: ['y'],
        affectedCount: 1,
        blastRadius: 0.3,
      });

    const { result } = renderHook(() => useGraphMetrics(services as any));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.teamRiskMap['team-1']).toMatchObject({
      riskLevel: 'red',
      highestBlastRadius: 0.9,
    });
    expect(result.current.teamRiskMap['team-2']).toMatchObject({
      riskLevel: 'amber',
      hasGodService: true,
    });
  });
});
