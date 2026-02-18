import React, { createContext, useContext, ReactNode } from 'react';
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
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const data = useOrganizationData();
    return (
        <OrganizationContext.Provider value={data}>
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
