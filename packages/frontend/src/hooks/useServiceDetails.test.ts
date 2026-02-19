import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useServiceDetails } from './useServiceDetails';
import { ProviderRegistry } from '../providers/details/ProviderRegistry';
import type { EnrichedServiceDetails, ServiceDetailsProvider } from '../providers/details/types';

// Helper to build a simple provider stub
function makeProvider(partial: Partial<EnrichedServiceDetails>): ServiceDetailsProvider {
  return {
    getDetails: vi.fn().mockResolvedValue(partial),
  };
}

// Helper to build a provider that rejects
function makeFailingProvider(message = 'provider error'): ServiceDetailsProvider {
  return {
    getDetails: vi.fn().mockRejectedValue(new Error(message)),
  };
}

describe('ProviderRegistry', () => {
  let registry: ProviderRegistry;

  beforeEach(() => {
    registry = ProviderRegistry.getInstance();
    registry.clear();
  });

  it('starts with no registered providers', () => {
    expect(registry.getProviders()).toHaveLength(0);
  });

  it('allows adding providers', () => {
    const provider = makeProvider({ name: 'Service A' });
    registry.register(provider);
    expect(registry.getProviders()).toHaveLength(1);
    expect(registry.getProviders()[0]).toBe(provider);
  });

  it('allows removing providers', () => {
    const provider = makeProvider({ name: 'Service A' });
    registry.register(provider);
    registry.unregister(provider);
    expect(registry.getProviders()).toHaveLength(0);
  });

  it('does not affect other providers when unregistering one', () => {
    const p1 = makeProvider({ name: 'Service A' });
    const p2 = makeProvider({ name: 'Service B' });
    registry.register(p1);
    registry.register(p2);
    registry.unregister(p1);
    expect(registry.getProviders()).toHaveLength(1);
    expect(registry.getProviders()[0]).toBe(p2);
  });

  it('clear removes all providers', () => {
    registry.register(makeProvider({ name: 'Service A' }));
    registry.register(makeProvider({ name: 'Service B' }));
    registry.clear();
    expect(registry.getProviders()).toHaveLength(0);
  });

  it('returns singleton instance', () => {
    expect(ProviderRegistry.getInstance()).toBe(ProviderRegistry.getInstance());
  });

  it('orders providers by priority when specified', () => {
    const p1 = makeProvider({ name: 'low' });
    const p2 = makeProvider({ name: 'high' });
    registry.register(p1, { priority: 1 });
    registry.register(p2, { priority: 10 });
    // Lower-priority providers are first; higher-priority providers are last.
    // useServiceDetails merges left-to-right so the last entry (highest priority)
    // wins in any key conflict.
    expect(registry.getProviders()[0]).toBe(p1); // lower priority first
    expect(registry.getProviders()[1]).toBe(p2); // higher priority last (wins in merge)
  });
});

describe('useServiceDetails', () => {
  beforeEach(() => {
    ProviderRegistry.getInstance().clear();
    vi.clearAllMocks();
  });

  it('returns null details and not loading when serviceId is null', () => {
    const { result } = renderHook(() => useServiceDetails(null));
    expect(result.current.details).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets loading true while fetching, then false when done', async () => {
    let resolveProvider!: (val: Partial<EnrichedServiceDetails>) => void;
    const slowProvider: ServiceDetailsProvider = {
      getDetails: vi.fn(
        () => new Promise<Partial<EnrichedServiceDetails>>((resolve) => { resolveProvider = resolve; }),
      ),
    };
    ProviderRegistry.getInstance().register(slowProvider);

    const { result } = renderHook(() => useServiceDetails('svc-1'));

    // loading should be true right after start
    expect(result.current.loading).toBe(true);

    // resolve the provider
    resolveProvider({ name: 'Service 1' });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('combines data from multiple providers using object spread (later overrides)', async () => {
    const baseId = 'svc-1';
    const p1 = makeProvider({
      id: baseId,
      name: 'Base Name',
      teamId: 'team-1',
    } as Partial<EnrichedServiceDetails>);
    const p2 = makeProvider({ stats: { upstream: 3, downstream: 5 } });
    const p3 = makeProvider({ name: 'Overridden Name' });

    ProviderRegistry.getInstance().register(p1);
    ProviderRegistry.getInstance().register(p2);
    ProviderRegistry.getInstance().register(p3);

    const { result } = renderHook(() => useServiceDetails(baseId));

    await waitFor(() => expect(result.current.loading).toBe(false));

    // All providers should have been called with the serviceId
    expect(p1.getDetails).toHaveBeenCalledWith(baseId);
    expect(p2.getDetails).toHaveBeenCalledWith(baseId);
    expect(p3.getDetails).toHaveBeenCalledWith(baseId);

    // p3 overrides name from p1
    expect(result.current.details?.name).toBe('Overridden Name');
    expect(result.current.details?.teamId).toBe('team-1');
    expect(result.current.details?.stats).toEqual({ upstream: 3, downstream: 5 });
  });

  it('handles provider errors without breaking — other providers still contribute', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const goodProvider = makeProvider({ id: 'svc-1', name: 'Service 1', teamId: 'team-1' } as Partial<EnrichedServiceDetails>);
    const badProvider = makeFailingProvider('network error');

    ProviderRegistry.getInstance().register(goodProvider);
    ProviderRegistry.getInstance().register(badProvider);

    const { result } = renderHook(() => useServiceDetails('svc-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Good provider data should still be present
    expect(result.current.details?.name).toBe('Service 1');

    // Error should have been logged
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('calls providers in parallel (Promise.all)', async () => {
    const callOrder: number[] = [];
    let resolve1!: (v: Partial<EnrichedServiceDetails>) => void;
    let resolve2!: (v: Partial<EnrichedServiceDetails>) => void;

    const p1: ServiceDetailsProvider = {
      getDetails: vi.fn(() => new Promise<Partial<EnrichedServiceDetails>>((r) => {
        callOrder.push(1);
        resolve1 = r;
      })),
    };
    const p2: ServiceDetailsProvider = {
      getDetails: vi.fn(() => new Promise<Partial<EnrichedServiceDetails>>((r) => {
        callOrder.push(2);
        resolve2 = r;
      })),
    };

    ProviderRegistry.getInstance().register(p1);
    ProviderRegistry.getInstance().register(p2);

    renderHook(() => useServiceDetails('svc-1'));

    // Both providers should be called without waiting for the other to settle
    // (i.e. they run in parallel, not sequentially). Use waitFor to account for
    // any async scheduling differences across React/test-runner versions.
    await waitFor(() => {
      expect(callOrder).toContain(1);
      expect(callOrder).toContain(2);
    });

    resolve1({ name: 'One' });
    resolve2({ name: 'Two' });
  });

  it('returns empty details object (not null) when no providers are registered', async () => {
    const { result } = renderHook(() => useServiceDetails('svc-with-no-providers'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    // details should be a non-null (but possibly empty-ish) object
    expect(result.current.details).not.toBeNull();
  });

  it('re-fetches when serviceId changes', async () => {
    const provider = makeProvider({ name: 'Service' });
    ProviderRegistry.getInstance().register(provider);

    const { result, rerender } = renderHook(({ id }) => useServiceDetails(id), {
      initialProps: { id: 'svc-1' as string | null },
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(provider.getDetails).toHaveBeenCalledWith('svc-1');

    rerender({ id: 'svc-2' });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(provider.getDetails).toHaveBeenCalledWith('svc-2');
  });

  it('resets to null details when serviceId becomes null after having a value', async () => {
    const provider = makeProvider({ name: 'Service' });
    ProviderRegistry.getInstance().register(provider);

    const { result, rerender } = renderHook(({ id }) => useServiceDetails(id), {
      initialProps: { id: 'svc-1' as string | null },
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.details).not.toBeNull();

    rerender({ id: null });

    expect(result.current.details).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});
