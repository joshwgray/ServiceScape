
import { useState, useEffect } from 'react';
import { Service } from '@servicescape/shared';
import * as apiClient from '../services/apiClient';

interface UseServiceDataResult {
  services: Service[];
  loading: boolean;
  error: Error | null;
}

const cache: Record<string, Service[]> = {};

export const useServiceData = (teamId: string): UseServiceDataResult => {
  const [services, setServices] = useState<Service[]>(cache[teamId] || []);
  const [loading, setLoading] = useState<boolean>(!cache[teamId]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!teamId) return;

    if (cache[teamId]) {
      setServices(cache[teamId]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    apiClient.getServices(teamId)
      .then((data) => {
        if (isMounted) {
          cache[teamId] = data;
          setServices(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [teamId]);

  return { services, loading, error };
};
