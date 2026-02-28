import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';

vi.mock('axios', () => {
  const instance = {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  };

  return {
    default: {
      create: vi.fn(() => instance),
    },
  };
});

import { analyzeImpact, getBlastRadius, getDomainHealth, getGodServices, getMetrics } from '../analyticsService';

describe('analyticsService', () => {
  it('fetches graph metrics from /api/analytics/metrics', async () => {
    const mockInstance = (axios.create as any).mock.results[0].value;
    mockInstance.get.mockResolvedValue({ data: { services: [] } });

    await getMetrics();

    expect(mockInstance.get).toHaveBeenCalledWith('/analytics/metrics', {
      params: { type: 'ALL' },
    });
  });

  it('fetches god services from /api/analytics/god-services', async () => {
    const mockInstance = (axios.create as any).mock.results[0].value;
    mockInstance.get.mockResolvedValue({ data: [] });

    await getGodServices('DECLARED');

    expect(mockInstance.get).toHaveBeenCalledWith('/analytics/god-services', {
      params: { type: 'DECLARED' },
    });
  });

  it('fetches blast radius from /api/services/:id/blast-radius', async () => {
    const mockInstance = (axios.create as any).mock.results[0].value;
    mockInstance.get.mockResolvedValue({ data: { serviceId: 'service-1', affectedCount: 0 } });

    await getBlastRadius('service-1');

    expect(mockInstance.get).toHaveBeenCalledWith('/services/service-1/blast-radius', {
      params: { type: 'ALL' },
    });
  });

  it('fetches domain health from /api/analytics/domain-health', async () => {
    const mockInstance = (axios.create as any).mock.results[0].value;
    mockInstance.get.mockResolvedValue({ data: [] });

    await getDomainHealth();

    expect(mockInstance.get).toHaveBeenCalledWith('/analytics/domain-health', {
      params: { type: 'ALL' },
    });
  });

  it('posts impact analysis requests to /api/analytics/impact-analysis', async () => {
    const mockInstance = (axios.create as any).mock.results[0].value;
    mockInstance.post = vi.fn().mockResolvedValue({ data: { serviceId: 'service-1', affectedCount: 2 } });

    await analyzeImpact('service-1', 'SCHEMA_CHANGE', 'OBSERVED');

    expect(mockInstance.post).toHaveBeenCalledWith(
      '/analytics/impact-analysis',
      { serviceId: 'service-1', changeType: 'SCHEMA_CHANGE' },
      { params: { type: 'OBSERVED' } }
    );
  });
});
