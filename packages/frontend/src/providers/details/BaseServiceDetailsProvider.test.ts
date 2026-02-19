import { describe, it, expect } from 'vitest';
import { BaseServiceDetailsProvider } from './BaseServiceDetailsProvider';
import type { ServiceDetailsProvider, EnrichedServiceDetails } from './types';
import type { Service } from '@servicescape/shared';

describe('BaseServiceDetailsProvider', () => {
  const mockServices: Service[] = [
    {
      id: 'svc-1',
      teamId: 'team-1',
      name: 'Auth Service',
      description: 'Handles authentication',
      metadata: { owner: 'platform-team' },
    },
    {
      id: 'svc-2',
      teamId: 'team-2',
      name: 'Payment Service',
      description: undefined,
    },
  ];

  it('returns basic service information for a known serviceId', async () => {
    const provider = new BaseServiceDetailsProvider(mockServices);
    const details = await provider.getDetails('svc-1');

    expect(details.id).toBe('svc-1');
    expect(details.name).toBe('Auth Service');
    expect(details.description).toBe('Handles authentication');
    expect(details.teamId).toBe('team-1');
  });

  it('returns partial details with undefined description when service has no description', async () => {
    const provider = new BaseServiceDetailsProvider(mockServices);
    const details = await provider.getDetails('svc-2');

    expect(details.id).toBe('svc-2');
    expect(details.name).toBe('Payment Service');
    expect(details.teamId).toBe('team-2');
    expect(details.description).toBeUndefined();
  });

  it('returns an empty object when serviceId is not found', async () => {
    const provider = new BaseServiceDetailsProvider(mockServices);
    const details = await provider.getDetails('nonexistent');

    expect(details).toEqual({});
  });

  it('satisfies the ServiceDetailsProvider interface contract', () => {
    const provider = new BaseServiceDetailsProvider(mockServices);

    // Type-level check: if this compiles, the interface is satisfied
    const asInterface: ServiceDetailsProvider = provider;
    expect(typeof asInterface.getDetails).toBe('function');
  });

  it('returns a Promise', () => {
    const provider = new BaseServiceDetailsProvider(mockServices);
    const result = provider.getDetails('svc-1');

    expect(result).toBeInstanceOf(Promise);
  });
});

describe('EnrichedServiceDetails type shape', () => {
  it('can hold all required and optional fields', () => {
    const enriched: EnrichedServiceDetails = {
      id: 'svc-1',
      teamId: 'team-1',
      name: 'Auth Service',
      description: 'Handles authentication',
      metadata: {},
      owner: 'platform-team',
      tiers: ['tier-1', 'tier-2'],
      stats: { upstream: 3, downstream: 5 },
      members: ['alice', 'bob'],
      links: [{ label: 'Docs', url: 'https://docs.example.com' }],
    };

    expect(enriched.id).toBe('svc-1');
    expect(enriched.owner).toBe('platform-team');
    expect(enriched.tiers).toHaveLength(2);
    expect(enriched.stats?.upstream).toBe(3);
    expect(enriched.stats?.downstream).toBe(5);
    expect(enriched.members).toHaveLength(2);
    expect(enriched.links?.[0].label).toBe('Docs');
  });

  it('works with only base Service fields (all optional fields absent)', () => {
    const minimal: EnrichedServiceDetails = {
      id: 'svc-min',
      teamId: 'team-x',
      name: 'Minimal Service',
    };

    expect(minimal.id).toBe('svc-min');
    expect(minimal.owner).toBeUndefined();
    expect(minimal.tiers).toBeUndefined();
    expect(minimal.stats).toBeUndefined();
    expect(minimal.members).toBeUndefined();
    expect(minimal.links).toBeUndefined();
  });
});
