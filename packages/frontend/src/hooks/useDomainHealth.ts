import { useEffect, useState } from 'react';
import type { DomainHealthScore } from '@servicescape/shared';
import * as analyticsService from '../services/analyticsService';

interface UseDomainHealthResult {
  domainHealthMap: Record<string, DomainHealthScore>;
  loading: boolean;
  error: Error | null;
}

let domainHealthCache: Record<string, DomainHealthScore> | null = null;
let domainHealthRequest: Promise<Record<string, DomainHealthScore>> | null = null;

const toDomainHealthMap = (
  scores: DomainHealthScore[]
): Record<string, DomainHealthScore> => Object.fromEntries(
  scores.map((score) => [score.domainId, score])
);

async function loadDomainHealthMap(): Promise<Record<string, DomainHealthScore>> {
  if (domainHealthCache) {
    return domainHealthCache;
  }

  if (!domainHealthRequest) {
    domainHealthRequest = analyticsService.getDomainHealth('ALL')
      .then((scores) => {
        domainHealthCache = toDomainHealthMap(scores);
        return domainHealthCache;
      })
      .finally(() => {
        domainHealthRequest = null;
      });
  }

  return domainHealthRequest;
}

export function __resetDomainHealthCacheForTests() {
  domainHealthCache = null;
  domainHealthRequest = null;
}

export function useDomainHealth(enabled: boolean): UseDomainHealthResult {
  const [domainHealthMap, setDomainHealthMap] = useState<Record<string, DomainHealthScore>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) {
      setDomainHealthMap({});
      setLoading(false);
      setError(null);
      return;
    }

    if (domainHealthCache) {
      setDomainHealthMap(domainHealthCache);
      setLoading(false);
      setError(null);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    loadDomainHealthMap()
      .then((nextDomainHealthMap) => {
        if (!mounted) {
          return;
        }
        setDomainHealthMap(nextDomainHealthMap);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) {
          return;
        }
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [enabled]);

  return { domainHealthMap, loading, error };
}
