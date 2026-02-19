# Service Details Providers

This directory contains the extensible provider system for enriching service details displayed in the DetailsPanel component.

## Overview

The provider system allows you to enrich basic service information with additional data from various sources:

- **BaseServiceDetailsProvider** - Returns fundamental service fields (id, name, description, teamId)
- **DependencyStatsProvider** - Calculates upstream/downstream dependency counts
- **MetadataProvider** - Extracts enrichment data from `Service.metadata` fields
- **Custom Providers** - You can easily add your own!

All providers implement the `ServiceDetailsProvider` interface and are registered in the `ProviderRegistry`. When a user clicks on a floor in the 3D visualization, the system calls all registered providers and merges their results to create a comprehensive `EnrichedServiceDetails` object.

## Architecture

### Core Types

```typescript
/**
 * Contract that all service details providers must implement.
 */
export interface ServiceDetailsProvider {
  getDetails(serviceId: string): Promise<Partial<EnrichedServiceDetails>>;
}

/**
 * Enriched representation of a Service with optional fields populated
 * by one or more ServiceDetailsProviders.
 */
export interface EnrichedServiceDetails extends Service {
  owner?: string;
  tiers?: string[];
  stats?: ServiceStats;
  members?: string[];
  links?: ServiceLink[];
}
```

### Provider Registry

The `ProviderRegistry` is a singleton that:
- Stores all registered providers with priority values
- Returns providers in priority order (lower priority first, higher priority last)
- Supports registration, unregistration, and clearing of providers

Providers are merged **left-to-right**, meaning higher-priority providers (returned last) win in case of field conflicts.

```typescript
const registry = ProviderRegistry.getInstance();

// Lower priority - applied first
registry.register(baseProvider, { priority: 0 });

// Higher priority - applied last, wins conflicts
registry.register(overrideProvider, { priority: 10 });
```

### Data Flow

1. User clicks on a floor in the 3D city visualization
2. `useServiceDetails` hook identifies the service ID
3. Hook calls `getDetails()` on all registered providers in priority order
4. Results are merged left-to-right (later providers override earlier ones)
5. Final `EnrichedServiceDetails` object is displayed in the DetailsPanel

## Creating a Custom Provider

### Step 1: Decide What Data to Provide

Identify which fields of `EnrichedServiceDetails` your provider will populate:
- `owner` - Team or individual responsible for the service
- `tiers` - System tiers the service belongs to
- `stats` - Dependency statistics (upstream/downstream counts)
- `members` - Team members working on the service
- `links` - External links (runbooks, documentation, dashboards)

### Step 2: Implement the Interface

Create a new file in `src/providers/details/YourProvider.ts`:

```typescript
import type { EnrichedServiceDetails, ServiceDetailsProvider } from './types';

export class YourProvider implements ServiceDetailsProvider {
  // Accept any dependencies in constructor
  constructor(private readonly dataSource: YourDataSource) {}

  async getDetails(serviceId: string): Promise<Partial<EnrichedServiceDetails>> {
    try {
      const data = await this.dataSource.fetch(serviceId);
      
      // Return only the fields your provider knows about
      return {
        owner: data.ownerEmail,
        links: [
          { label: 'Dashboard', url: data.dashboardUrl },
        ],
      };
    } catch (err) {
      // On error, return empty object so other providers can still contribute
      console.error('[YourProvider] Failed to fetch data', serviceId, err);
      return {};
    }
  }
}
```

### Step 3: Write Tests

Create `YourProvider.test.ts` following TDD principles:

```typescript
import { describe, it, expect } from 'vitest';
import { YourProvider } from './YourProvider';

describe('YourProvider', () => {
  it('extracts owner from data source', async () => {
    const mockDataSource = {
      fetch: async (id: string) => ({ ownerEmail: 'team@example.com' }),
    };
    
    const provider = new YourProvider(mockDataSource);
    const details = await provider.getDetails('svc-1');
    
    expect(details.owner).toBe('team@example.com');
  });

  it('handles errors gracefully', async () => {
    const mockDataSource = {
      fetch: async () => { throw new Error('API Error'); },
    };
    
    const provider = new YourProvider(mockDataSource);
    const details = await provider.getDetails('svc-1');
    
    expect(details).toEqual({});
  });
});
```

### Step 4: Register Your Provider

In your application setup (e.g., `main.tsx` or a setup file):

```typescript
import { ProviderRegistry } from './providers/details';
import { YourProvider } from './providers/details/YourProvider';

const registry = ProviderRegistry.getInstance();
const yourProvider = new YourProvider(yourDataSource);

// Register with appropriate priority
// Default is 0; higher numbers = higher priority
registry.register(yourProvider, { priority: 5 });
```

### Step 5: Export Your Provider

Add your provider to `src/providers/details/index.ts`:

```typescript
export { YourProvider } from './YourProvider';
```

## Examples of Potential Future Providers

Here are some ideas for providers you might want to create:

### APM Provider
Enriches services with Application Performance Monitoring metrics:
```typescript
export class APMProvider implements ServiceDetailsProvider {
  async getDetails(serviceId: string): Promise<Partial<EnrichedServiceDetails>> {
    const metrics = await this.apmClient.getMetrics(serviceId);
    return {
      links: [
        { label: 'APM Dashboard', url: metrics.dashboardUrl },
        { label: 'Traces', url: metrics.tracesUrl },
      ],
    };
  }
}
```

### Incident Tracking Provider
Adds links to incident management systems:
```typescript
export class IncidentProvider implements ServiceDetailsProvider {
  async getDetails(serviceId: string): Promise<Partial<EnrichedServiceDetails>> {
    const incidents = await this.incidentClient.getActiveIncidents(serviceId);
    return {
      links: [
        { label: `${incidents.count} Active Incidents`, url: incidents.dashboardUrl },
      ],
    };
  }
}
```

### Cost Data Provider
Enriches with cloud cost information:
```typescript
export class CostProvider implements ServiceDetailsProvider {
  async getDetails(serviceId: string): Promise<Partial<EnrichedServiceDetails>> {
    const costs = await this.costApi.getMonthlyCost(serviceId);
    return {
      links: [
        { label: `Monthly Cost: $${costs.amount}`, url: costs.reportUrl },
      ],
    };
  }
}
```

### On-Call Provider
Adds current on-call information:
```typescript
export class OnCallProvider implements ServiceDetailsProvider {
  async getDetails(serviceId: string): Promise<Partial<EnrichedServiceDetails>> {
    const schedule = await this.oncallApi.getCurrentSchedule(serviceId);
    return {
      owner: schedule.currentOnCall,
      links: [
        { label: 'On-Call Schedule', url: schedule.scheduleUrl },
      ],
    };
  }
}
```

### Repository Provider
Links to source code repositories:
```typescript
export class RepositoryProvider implements ServiceDetailsProvider {
  async getDetails(serviceId: string): Promise<Partial<EnrichedServiceDetails>> {
    const repo = await this.githubApi.getRepository(serviceId);
    return {
      links: [
        { label: 'GitHub Repo', url: repo.htmlUrl },
        { label: 'Pull Requests', url: `${repo.htmlUrl}/pulls` },
      ],
      members: repo.contributors.map(c => c.login),
    };
  }
}
```

## Best Practices

### 1. **Return Empty Objects on Error**
```typescript
try {
  const data = await this.fetchData(serviceId);
  return { owner: data.owner };
} catch (err) {
  console.error('[YourProvider] Error fetching data', err);
  return {}; // Don't throw - let other providers continue
}
```

### 2. **Validate External Data**
```typescript
// Don't trust external data types
if (typeof data.owner === 'string' && data.owner.trim().length > 0) {
  result.owner = data.owner;
}
```

### 3. **Keep Providers Focused**
Each provider should have a single responsibility:
- ✅ One provider per data source
- ✅ One provider per enrichment domain
- ❌ Avoid "God providers" that know too much

### 4. **Use Appropriate Priorities**
```typescript
// Base data - lowest priority
registry.register(baseProvider, { priority: 0 });

// General enrichment - medium priority
registry.register(metadataProvider, { priority: 5 });
registry.register(dependencyStatsProvider, { priority: 5 });

// Override/correction providers - highest priority
registry.register(overrideProvider, { priority: 10 });
```

### 5. **Make Providers Testable**
```typescript
// Accept dependencies via constructor, not global imports
export class YourProvider {
  constructor(
    private readonly apiClient: YourApiClient,
    private readonly config: YourConfig
  ) {}
}

// In tests, inject mocks
const provider = new YourProvider(mockClient, mockConfig);
```

### 6. **Document Expected Metadata Structure**
If your provider reads from `Service.metadata`, document the expected shape:

```typescript
/**
 * Expected metadata structure:
 * {
 *   yourProviderKey: {
 *     owner: string;
 *     dashboardUrl: string;
 *   }
 * }
 */
```

## Testing Strategy

### Unit Tests
Test your provider in isolation with mocked dependencies:
```typescript
it('extracts owner correctly', async () => {
  const mockData = { owner: 'team-a' };
  const provider = new YourProvider(mockData);
  const result = await provider.getDetails('svc-1');
  expect(result.owner).toBe('team-a');
});
```

### Integration Tests
Test provider registration and priority handling:
```typescript
it('higher priority provider wins on conflict', async () => {
  const lowPriority: ServiceDetailsProvider = {
    getDetails: async () => ({ owner: 'team-a' }),
  };
  const highPriority: ServiceDetailsProvider = {
    getDetails: async () => ({ owner: 'team-b' }),
  };
  
  registry.register(lowPriority, { priority: 0 });
  registry.register(highPriority, { priority: 10 });
  
  // When merged, team-b should win
  const providers = registry.getProviders();
  expect(providers[providers.length - 1]).toBe(highPriority);
});
```

### Error Handling Tests
Ensure providers degrade gracefully:
```typescript
it('returns empty object on fetch failure', async () => {
  const failingProvider = new YourProvider(throwingClient);
  const result = await failingProvider.getDetails('svc-1');
  expect(result).toEqual({});
});
```

## Troubleshooting

### Provider Not Contributing Data
1. Check if the provider is registered: `registry.getProviders()`
2. Verify the provider is being called (add console.log)
3. Check if another provider is overriding your data (priority issue)
4. Ensure the provider is returning the correct field names

### Priority Conflicts
If two providers set the same field:
- The **higher-priority** provider wins (returned last)
- Default priority is `0`
- Consider using priority ranges: base (0), enrichment (5), override (10)

### Performance Issues
If providers are slow:
- Add caching to your provider
- Consider using batch fetching
- Add timeouts to prevent hanging
- Profile with browser DevTools

## Further Reading

- [TypeScript Handbook - Interfaces](https://www.typescriptlang.org/docs/handbook/interfaces.html)
- [Async/Await Best Practices](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Promises)
- [Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)
