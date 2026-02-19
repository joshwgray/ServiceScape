import { useState, useEffect } from 'react';
import type { EnrichedServiceDetails } from '../providers/details/types';
import { ProviderRegistry } from '../providers/details/ProviderRegistry';

export interface UseServiceDetailsResult {
  details: EnrichedServiceDetails | null;
  loading: boolean;
  error: Error | null;
}

/**
 * React hook that aggregates enriched service details from all registered
 * `ServiceDetailsProvider` instances in the `ProviderRegistry`.
 *
 * - All providers are called **in parallel** via `Promise.all`.
 * - Results are merged with object spread — later (higher-priority) providers
 *   override earlier (lower-priority) ones for conflicting keys.
 *   `ProviderRegistry.getProviders()` returns providers in ascending priority
 *   order (lowest first, highest last), so the highest-priority provider always
 *   wins when keys conflict.
 * - Individual provider failures are caught, logged, and treated as an empty
 *   contribution so that the rest of the pipeline can still proceed.
 *
 * @param serviceId - The service to enrich, or `null` to skip fetching.
 */
export function useServiceDetails(serviceId: string | null): UseServiceDetailsResult {
  const [details, setDetails] = useState<EnrichedServiceDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!serviceId) {
      setDetails(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    setLoading(true);
    setDetails(null);
    setError(null);

    const providers = ProviderRegistry.getInstance().getProviders();

    const settledPromises = providers.map((provider) => {
      // Guard against synchronous throws (not just promise rejections) so that
      // a badly-behaved provider can never crash the whole hook.
      let promise: Promise<Partial<EnrichedServiceDetails>>;
      try {
        promise = provider.getDetails(serviceId);
      } catch (syncErr: unknown) {
        console.error('[useServiceDetails] Provider threw synchronously for service', serviceId, syncErr);
        return Promise.resolve({} as Partial<EnrichedServiceDetails>);
      }
      return promise.catch((err: unknown) => {
        console.error('[useServiceDetails] Provider failed for service', serviceId, err);
        return {} as Partial<EnrichedServiceDetails>;
      });
    });

    Promise.all(settledPromises)
      .then((results) => {
        if (cancelled) return;

        const merged = results.reduce<Partial<EnrichedServiceDetails>>(
          (acc, result) => ({ ...acc, ...result }),
          {},
        );

        setDetails(merged as EnrichedServiceDetails);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const wrappedError = err instanceof Error ? err : new Error(String(err));
        console.error('[useServiceDetails] Unexpected error:', wrappedError);
        setError(wrappedError);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [serviceId]);

  return { details, loading, error };
}
