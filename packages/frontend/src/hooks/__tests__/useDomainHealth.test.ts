import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as analyticsService from '../../services/analyticsService';
import { __resetDomainHealthCacheForTests, useDomainHealth } from '../useDomainHealth';

vi.mock('../../services/analyticsService', () => ({
  getDomainHealth: vi.fn(),
}));

describe('useDomainHealth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetDomainHealthCacheForTests();
  });

  it('loads domain health scores into a domain keyed map', async () => {
    vi.mocked(analyticsService.getDomainHealth).mockResolvedValue([
      {
        domainId: 'domain-1',
        score: 0.82,
        status: 'healthy',
        components: {
          couplingRatio: 0.1,
          centralizationFactor: 0.2,
          avgBlastRadius: 0.15,
        },
        serviceCount: 4,
      },
    ]);

    const { result } = renderHook(() => useDomainHealth(true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.domainHealthMap['domain-1']).toMatchObject({
      status: 'healthy',
      score: 0.82,
    });
  });

  it('does not fetch when disabled', async () => {
    const { result } = renderHook(() => useDomainHealth(false));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.domainHealthMap).toEqual({});
    expect(analyticsService.getDomainHealth).not.toHaveBeenCalled();
  });

  it('reuses cached domain health results across hook instances', async () => {
    vi.mocked(analyticsService.getDomainHealth).mockResolvedValue([
      {
        domainId: 'domain-1',
        score: 0.54,
        status: 'at-risk',
        components: {
          couplingRatio: 0.3,
          centralizationFactor: 0.4,
          avgBlastRadius: 0.3,
        },
        serviceCount: 3,
      },
    ]);

    const first = renderHook(() => useDomainHealth(true));

    await waitFor(() => {
      expect(first.result.current.loading).toBe(false);
    });
    first.unmount();

    const second = renderHook(() => useDomainHealth(true));

    await waitFor(() => {
      expect(second.result.current.loading).toBe(false);
    });

    expect(analyticsService.getDomainHealth).toHaveBeenCalledTimes(1);
    expect(second.result.current.domainHealthMap['domain-1']?.status).toBe('at-risk');
  });
});
