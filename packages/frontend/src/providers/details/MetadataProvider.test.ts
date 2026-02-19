import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MetadataProvider } from './MetadataProvider';
import { ProviderRegistry } from './ProviderRegistry';
import type { Service } from '@servicescape/shared';
import type { ServiceDetailsProvider } from './types';

describe('MetadataProvider', () => {
  const mockServices: Service[] = [
    {
      id: 'svc-1',
      teamId: 'team-1',
      name: 'Auth Service',
      metadata: {
        owner: 'platform-team',
        tiers: ['tier-1', 'tier-2'],
        members: ['alice@example.com', 'bob@example.com'],
        links: [
          { label: 'Runbook', url: 'https://runbook.example.com/auth' },
          { label: 'Docs', url: 'https://docs.example.com/auth' },
        ],
      },
    },
    {
      id: 'svc-2',
      teamId: 'team-2',
      name: 'Payment Service',
      metadata: {
        owner: 'finance-team',
        // No tiers or members
      },
    },
    {
      id: 'svc-3',
      teamId: 'team-3',
      name: 'Legacy Service',
      // No metadata at all
    },
    {
      id: 'svc-4',
      teamId: 'team-4',
      name: 'Inventory Service',
      metadata: {
        owner: 'operations-team',
        tiers: 'tier-1', // Wrong type (string instead of array)
        members: 'charlie@example.com', // Wrong type (string instead of array)
      },
    },
  ];

  it('extracts owner from metadata', async () => {
    const provider = new MetadataProvider(mockServices);
    const details = await provider.getDetails('svc-1');

    expect(details.owner).toBe('platform-team');
  });

  it('extracts tiers from metadata', async () => {
    const provider = new MetadataProvider(mockServices);
    const details = await provider.getDetails('svc-1');

    expect(details.tiers).toEqual(['tier-1', 'tier-2']);
  });

  it('extracts members from metadata', async () => {
    const provider = new MetadataProvider(mockServices);
    const details = await provider.getDetails('svc-1');

    expect(details.members).toEqual(['alice@example.com', 'bob@example.com']);
  });

  it('extracts links from metadata', async () => {
    const provider = new MetadataProvider(mockServices);
    const details = await provider.getDetails('svc-1');

    expect(details.links).toEqual([
      { label: 'Runbook', url: 'https://runbook.example.com/auth' },
      { label: 'Docs', url: 'https://docs.example.com/auth' },
    ]);
  });

  it('handles partial metadata gracefully', async () => {
    const provider = new MetadataProvider(mockServices);
    const details = await provider.getDetails('svc-2');

    expect(details.owner).toBe('finance-team');
    expect(details.tiers).toBeUndefined();
    expect(details.members).toBeUndefined();
    expect(details.links).toBeUndefined();
  });

  it('handles missing metadata gracefully', async () => {
    const provider = new MetadataProvider(mockServices);
    const details = await provider.getDetails('svc-3');

    expect(details.owner).toBeUndefined();
    expect(details.tiers).toBeUndefined();
    expect(details.members).toBeUndefined();
    expect(details.links).toBeUndefined();
  });

  it('returns empty object for non-existent service', async () => {
    const provider = new MetadataProvider(mockServices);
    const details = await provider.getDetails('nonexistent');

    expect(details).toEqual({});
  });

  it('validates tiers is an array before returning', async () => {
    const provider = new MetadataProvider(mockServices);
    const details = await provider.getDetails('svc-4');

    // Should skip invalid tiers
    expect(details.tiers).toBeUndefined();
  });

  it('validates members is an array before returning', async () => {
    const provider = new MetadataProvider(mockServices);
    const details = await provider.getDetails('svc-4');

    // Should skip invalid members
    expect(details.members).toBeUndefined();
  });

  it('validates links is an array with proper structure', async () => {
    const servicesWithInvalidLinks: Service[] = [
      {
        id: 'svc-invalid-links',
        teamId: 'team-x',
        name: 'Invalid Links Service',
        metadata: {
          links: 'not-an-array',
        },
      },
      {
        id: 'svc-partial-links',
        teamId: 'team-y',
        name: 'Partial Links Service',
        metadata: {
          links: [
            { label: 'Valid', url: 'https://valid.com' },
            { label: 'Missing URL' }, // Missing url field
            'invalid-link', // Not an object
          ],
        },
      },
    ];

    const provider = new MetadataProvider(servicesWithInvalidLinks);

    // Case 1: links is not an array
    const details1 = await provider.getDetails('svc-invalid-links');
    expect(details1.links).toBeUndefined();

    // Case 2: links array contains invalid entries
    const details2 = await provider.getDetails('svc-partial-links');
    // Should filter to only valid links
    expect(details2.links).toEqual([{ label: 'Valid', url: 'https://valid.com' }]);
  });

  it('satisfies the ServiceDetailsProvider interface contract', () => {
    const provider = new MetadataProvider(mockServices);

    // Type-level check: if this compiles, the interface is satisfied
    const asInterface: ServiceDetailsProvider = provider;
    expect(typeof asInterface.getDetails).toBe('function');
  });

  it('returns a Promise', () => {
    const provider = new MetadataProvider(mockServices);
    const result = provider.getDetails('svc-1');

    expect(result).toBeInstanceOf(Promise);
  });
});

describe('MetadataProvider registry integration', () => {
  let registry: ProviderRegistry;

  beforeEach(() => {
    registry = ProviderRegistry.getInstance();
    registry.clear();
  });

  afterEach(() => {
    registry.clear();
  });

  it('can be registered in ProviderRegistry', () => {
    const mockServices: Service[] = [
      {
        id: 'svc-1',
        teamId: 'team-1',
        name: 'Test Service',
        metadata: { owner: 'team-a' },
      },
    ];

    const provider = new MetadataProvider(mockServices);
    registry.register(provider, { priority: 5 });

    const providers = registry.getProviders();
    expect(providers).toHaveLength(1);
    expect(providers[0]).toBe(provider);
  });

  it('can be registered with other providers at different priorities', () => {
    const mockServices: Service[] = [];
    const metadataProvider = new MetadataProvider(mockServices);
    const anotherProvider: ServiceDetailsProvider = {
      getDetails: async () => ({}),
    };

    registry.register(anotherProvider, { priority: 0 });
    registry.register(metadataProvider, { priority: 10 });

    const providers = registry.getProviders();
    expect(providers).toHaveLength(2);
    // Lower priority first, higher priority last
    expect(providers[0]).toBe(anotherProvider);
    expect(providers[1]).toBe(metadataProvider);
  });
});
