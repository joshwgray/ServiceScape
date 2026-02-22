import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { Domain, Team, Service } from '@servicescape/shared';
import { LayoutPositions } from '../services/apiClient';
import { useOrganizationData } from '../hooks/useOrganizationData';

interface OrganizationContextType {
    domains: Domain[];
    teams: Team[];
    services: Service[];
    layout: LayoutPositions | null;
    loading: boolean;
    error: Error | null;
    renderedPositions: Record<string, [number, number, number]>;
    registerServicePosition: (serviceId: string, position: [number, number, number]) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const data = useOrganizationData();
    const [renderedPositions, setRenderedPositions] = useState<Record<string, [number, number, number]>>({});

    const registerServicePosition = useCallback((serviceId: string, position: [number, number, number]) => {
        setRenderedPositions(prev => {
            const current = prev[serviceId];
            if (current && 
                Math.abs(current[0] - position[0]) < 0.001 && 
                Math.abs(current[1] - position[1]) < 0.001 && 
                Math.abs(current[2] - position[2]) < 0.001) {
                return prev;
            }
            return { ...prev, [serviceId]: position };
        });
    }, []);

    const value = React.useMemo(() => ({
        ...data,
        renderedPositions,
        registerServicePosition
    }), [data, renderedPositions, registerServicePosition]);

    return (
        <OrganizationContext.Provider value={value}>
            {children}
        </OrganizationContext.Provider>
    );
};

export const useOrganization = () => {
    const context = useContext(OrganizationContext);
    if (!context) {
        throw new Error('useOrganization must be used within an OrganizationProvider');
    }
    return context;
};
