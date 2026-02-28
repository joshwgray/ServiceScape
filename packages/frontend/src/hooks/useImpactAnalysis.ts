import { useCallback, useState } from 'react';
import type { ChangeImpactAnalysis } from '@servicescape/shared';
import * as analyticsService from '../services/analyticsService';

interface UseImpactAnalysisResult {
  analysis: ChangeImpactAnalysis | null;
  loading: boolean;
  error: Error | null;
  analyzeImpact: (serviceId: string, changeType?: string) => Promise<ChangeImpactAnalysis | null>;
  clearAnalysis: () => void;
}

const impactAnalysisCache = new Map<string, ChangeImpactAnalysis>();

function getCacheKey(serviceId: string, changeType: string): string {
  return `${serviceId}:${changeType}`;
}

export function __resetImpactAnalysisCacheForTests() {
  impactAnalysisCache.clear();
}

export function useImpactAnalysis(): UseImpactAnalysisResult {
  const [analysis, setAnalysis] = useState<ChangeImpactAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const analyzeImpact = useCallback(async (serviceId: string, changeType = 'CODE_CHANGE') => {
    const cacheKey = getCacheKey(serviceId, changeType);
    const cached = impactAnalysisCache.get(cacheKey);
    if (cached) {
      setAnalysis(cached);
      setLoading(false);
      setError(null);
      return cached;
    }

    setLoading(true);
    setError(null);

    try {
      const nextAnalysis = await analyticsService.analyzeImpact(serviceId, changeType);
      impactAnalysisCache.set(cacheKey, nextAnalysis);
      setAnalysis(nextAnalysis);
      setLoading(false);
      return nextAnalysis;
    } catch (err) {
      const nextError = err instanceof Error ? err : new Error(String(err));
      setError(nextError);
      setLoading(false);
      return null;
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    analysis,
    loading,
    error,
    analyzeImpact,
    clearAnalysis,
  };
}
