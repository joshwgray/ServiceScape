import { useState, useEffect } from 'react';
import { Dependency } from '@servicescape/shared';
import { getDependencies } from '../services/apiClient';

export const useDependencies = (serviceId: string | null, type?: string) => {
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceId) {
      setDependencies([]);
      return;
    }

    const fetchDependencies = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getDependencies(serviceId, type);
        setDependencies(data);
      } catch (err) {
        setError('Failed to fetch dependencies');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDependencies();
  }, [serviceId, type]);

  return { dependencies, loading, error };
};
