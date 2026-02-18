import { useState, useEffect } from 'react';
import { Domain, Team, Service } from '@servicescape/shared';
import { getDomains, getAllTeams, getAllServices, getLayout, LayoutPositions } from '../services/apiClient';

interface UseOrganizationDataResult {
    domains: Domain[];
    teams: Team[];
    services: Service[];
    layout: LayoutPositions | null;
    loading: boolean;
    error: Error | null;
}

export function useOrganizationData(): UseOrganizationDataResult {
    const [data, setData] = useState<{
        domains: Domain[];
        teams: Team[];
        services: Service[];
        layout: LayoutPositions | null;
    }>({
        domains: [],
        teams: [],
        services: [],
        layout: null
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let mounted = true;
        const fetchData = async () => {
            try {
                const [domains, teams, services, layout] = await Promise.all([
                    getDomains(),
                    getAllTeams(),
                    getAllServices(),
                    getLayout()
                ]);

                if (mounted) {
                    setData({ domains, teams, services, layout });
                    setLoading(false);
                }
            } catch (err: any) {
                if (mounted) {
                    console.error("Failed to fetch organization data", err);
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

    return { ...data, loading, error };
}
