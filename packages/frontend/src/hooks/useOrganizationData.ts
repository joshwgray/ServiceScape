import { useState, useEffect } from 'react';
import { Domain } from '@servicescape/shared';
import { getDomains } from '../services/apiClient';

interface UseOrganizationDataResult {
    domains: Domain[];
    loading: boolean;
    error: Error | null;
}

export function useOrganizationData(): UseOrganizationDataResult {
    const [domains, setDomains] = useState<Domain[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let mounted = true;
        const fetchData = async () => {
            try {
                const data = await getDomains();
                if (mounted) {
                    setDomains(data);
                    setLoading(false);
                }
            } catch (err: any) {
                if (mounted) {
                    setError(err);
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            mounted = false;
        }
    }, []);

    return { domains, loading, error };
}
