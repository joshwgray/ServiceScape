import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DependencyStatsProvider } from './DependencyStatsProvider';
import type { ServiceDetailsProvider } from './types';
import type { Dependency } from '@servicescape/shared';

describe('DependencyStatsProvider', () => {
  let mockFetchDependencies: ReturnType<typeof vi.fn<[string], Promise<Dependency[]>>>;

  beforeEach(() => {
    mockFetchDependencies = vi.fn<[string], Promise<Dependency[]>>();
  });

  const SERVICE_ID = 'svc-target';

  const mockDeps: Dependency[] = [
    // Services that call svc-target (upstream in plan terms — toServiceId === SERVICE_ID)
    { id: 'd1', fromServiceId: 'svc-caller-1', toServiceId: SERVICE_ID, type: 'DECLARED' },
    { id: 'd2', fromServiceId: 'svc-caller-2', toServiceId: SERVICE_ID, type: 'OBSERVED' },
    { id: 'd3', fromServiceId: 'svc-caller-1', toServiceId: SERVICE_ID, type: 'OBSERVED' }, // dup caller
    // Services that svc-target calls (downstream in plan terms — fromServiceId === SERVICE_ID)
    { id: 'd4', fromServiceId: SERVICE_ID, toServiceId: 'svc-dep-1', type: 'DECLARED' },
    { id: 'd5', fromServiceId: SERVICE_ID, toServiceId: 'svc-dep-2', type: 'DECLARED' },
    // Unrelated dep
    { id: 'd6', fromServiceId: 'svc-other', toServiceId: 'svc-unrelated', type: 'DECLARED' },
  ];

  it('fetches both declared and observed dependencies for the service', async () => {
    mockFetchDependencies.mockResolvedValue(mockDeps);

    const provider = new DependencyStatsProvider(mockFetchDependencies);
    await provider.getDetails(SERVICE_ID);

    expect(mockFetchDependencies).toHaveBeenCalledOnce();
    expect(mockFetchDependencies).toHaveBeenCalledWith(SERVICE_ID);
  });

  it('correctly counts upstream dependencies (services that depend ON the selected service)', async () => {
    mockFetchDependencies.mockResolvedValue(mockDeps);

    const provider = new DependencyStatsProvider(mockFetchDependencies);
    const result = await provider.getDetails(SERVICE_ID);

    // svc-caller-1 and svc-caller-2 both have toServiceId === SERVICE_ID
    // svc-caller-1 appears twice but should only be counted once (unique)
    expect(result.stats?.upstream).toBe(2);
  });

  it('correctly counts downstream dependencies (services the selected service depends ON)', async () => {
    mockFetchDependencies.mockResolvedValue(mockDeps);

    const provider = new DependencyStatsProvider(mockFetchDependencies);
    const result = await provider.getDetails(SERVICE_ID);

    // svc-dep-1 and svc-dep-2 both have fromServiceId === SERVICE_ID
    expect(result.stats?.downstream).toBe(2);
  });

  it('returns zero counts when there are no dependencies', async () => {
    mockFetchDependencies.mockResolvedValue([]);

    const provider = new DependencyStatsProvider(mockFetchDependencies);
    const result = await provider.getDetails(SERVICE_ID);

    expect(result.stats?.upstream).toBe(0);
    expect(result.stats?.downstream).toBe(0);
  });

  it('handles API errors gracefully by returning an empty object and logging', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetchDependencies.mockRejectedValue(new Error('Network failure'));

    const provider = new DependencyStatsProvider(mockFetchDependencies);
    const result = await provider.getDetails(SERVICE_ID);

    expect(result).toEqual({});
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('satisfies the ServiceDetailsProvider interface', () => {
    const provider = new DependencyStatsProvider(mockFetchDependencies);
    const asInterface: ServiceDetailsProvider = provider;
    expect(typeof asInterface.getDetails).toBe('function');
  });

  it('de-duplicates callers so upstream count reflects unique services', async () => {
    const depsWithDupes: Dependency[] = [
      { id: 'a1', fromServiceId: 'caller-A', toServiceId: SERVICE_ID, type: 'DECLARED' },
      { id: 'a2', fromServiceId: 'caller-A', toServiceId: SERVICE_ID, type: 'OBSERVED' },
      { id: 'a3', fromServiceId: 'caller-B', toServiceId: SERVICE_ID, type: 'DECLARED' },
    ];
    mockFetchDependencies.mockResolvedValue(depsWithDupes);

    const provider = new DependencyStatsProvider(mockFetchDependencies);
    const result = await provider.getDetails(SERVICE_ID);

    // caller-A appears twice but counts once
    expect(result.stats?.upstream).toBe(2);
  });

  it('de-duplicates providers so downstream count reflects unique services', async () => {
    const depsWithDupes: Dependency[] = [
      { id: 'b1', fromServiceId: SERVICE_ID, toServiceId: 'dep-X', type: 'DECLARED' },
      { id: 'b2', fromServiceId: SERVICE_ID, toServiceId: 'dep-X', type: 'OBSERVED' },
      { id: 'b3', fromServiceId: SERVICE_ID, toServiceId: 'dep-Y', type: 'DECLARED' },
    ];
    mockFetchDependencies.mockResolvedValue(depsWithDupes);

    const provider = new DependencyStatsProvider(mockFetchDependencies);
    const result = await provider.getDetails(SERVICE_ID);

    // dep-X appears twice but counts once
    expect(result.stats?.downstream).toBe(2);
  });

  it('counts a self-loop dependency in both upstream and downstream', async () => {
    // A service that lists itself as a dependency (pathological but valid data)
    const selfLoop: Dependency[] = [
      { id: 'sl1', fromServiceId: SERVICE_ID, toServiceId: SERVICE_ID, type: 'DECLARED' },
    ];
    mockFetchDependencies.mockResolvedValue(selfLoop);

    const provider = new DependencyStatsProvider(mockFetchDependencies);
    const result = await provider.getDetails(SERVICE_ID);

    // The self-loop entry satisfies both filter predicates, so each count is 1.
    expect(result.stats?.upstream).toBe(1);
    expect(result.stats?.downstream).toBe(1);
  });
});
