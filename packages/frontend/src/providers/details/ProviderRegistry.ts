import type { ServiceDetailsProvider } from './types';

export interface RegisterOptions {
  /**
   * Numeric priority for this provider. Higher values mean higher priority.
   * Higher-priority providers are returned **last** from `getProviders()` so
   * that they win in a left-to-right merge (later entry overrides earlier).
   * Default: 0.
   */
  priority?: number;
}

interface ProviderEntry {
  provider: ServiceDetailsProvider;
  priority: number;
}

/**
 * Singleton registry for `ServiceDetailsProvider` instances.
 *
 * Providers are stored in **ascending** priority order so that
 * `getProviders()` returns lower-priority providers first and higher-priority
 * providers last.  `useServiceDetails` merges results left-to-right (later
 * entries overwrite earlier ones for conflicting keys), which means
 * higher-priority providers always win in a conflict.
 *
 * @example
 * registry.register(baseProvider,  { priority: 0 });  // applied first
 * registry.register(overrideProvider, { priority: 10 }); // applied last → wins
 */
export class ProviderRegistry {
  private static _instance: ProviderRegistry | undefined;

  private entries: ProviderEntry[] = [];

  private constructor() {}

  static getInstance(): ProviderRegistry {
    if (!ProviderRegistry._instance) {
      ProviderRegistry._instance = new ProviderRegistry();
    }
    return ProviderRegistry._instance;
  }

  /**
   * Add a provider to the registry.
   * @param provider - The provider to register.
   * @param options  - Optional registration options (e.g. priority).
   */
  register(provider: ServiceDetailsProvider, options: RegisterOptions = {}): void {
    const priority = options.priority ?? 0;
    this.entries.push({ provider, priority });
    // Sort ascending by priority so getProviders() returns lowest first.
    // useServiceDetails merges left-to-right (later overrides earlier), so
    // the highest-priority provider — appearing last — wins in conflicts.
    this.entries.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Remove a previously registered provider.
   * No-op if the provider is not currently registered.
   */
  unregister(provider: ServiceDetailsProvider): void {
    this.entries = this.entries.filter((e) => e.provider !== provider);
  }

  /**
   * Return all currently registered providers in priority order.
   * Lower-priority providers come first; higher-priority providers come last.
   * Callers that merge results sequentially (later-entry-wins semantics) will
   * therefore let higher-priority providers win in any conflict.
   */
  getProviders(): ServiceDetailsProvider[] {
    return this.entries.map((e) => e.provider);
  }

  /** Remove all registered providers. Useful between tests. */
  clear(): void {
    this.entries = [];
  }
}
