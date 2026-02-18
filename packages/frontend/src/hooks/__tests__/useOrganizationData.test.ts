import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useOrganizationData } from '../useOrganizationData';
import * as apiClient from '../../services/apiClient';

vi.mock('../../services/apiClient', () => ({
    __esModule: true,
    getDomains: vi.fn(),
    getAllTeams: vi.fn(),
    getAllServices: vi.fn(),
    getLayout: vi.fn(),
    default: {
        get: vi.fn()
    }
}));

describe('useOrganizationData', () => {
    it('should fetch data on mount', async () => {
        const mockDomains = [{ id: 'd1', name: 'Domain 1' }];
        const mockTeams = [{ id: 't1', name: 'Team 1' }];
        const mockServices = [{ id: 's1', name: 'Service 1' }];
        const mockLayout = { domains: {}, teams: {}, services: {} };

        vi.mocked(apiClient.getDomains).mockResolvedValue(mockDomains as any);
        vi.mocked(apiClient.getAllTeams).mockResolvedValue(mockTeams as any);
        vi.mocked(apiClient.getAllServices).mockResolvedValue(mockServices as any);
        vi.mocked(apiClient.getLayout).mockResolvedValue(mockLayout as any);

        const { result } = renderHook(() => useOrganizationData());

        expect(result.current.loading).toBe(true);
        
        await waitFor(() => {
            expect(result.current.domains).toEqual(mockDomains);
            expect(result.current.teams).toEqual(mockTeams);
            expect(result.current.services).toEqual(mockServices);
            expect(result.current.layout).toEqual(mockLayout);
            expect(result.current.loading).toBe(false);
        });
    });

    it('should handle errors', async () => {
        const error = new Error('Failed to fetch');
        // Make sure all promises settle, one rejects
        vi.mocked(apiClient.getDomains).mockRejectedValue(error);
        vi.mocked(apiClient.getAllTeams).mockResolvedValue([]);
        vi.mocked(apiClient.getAllServices).mockResolvedValue([]);
        vi.mocked(apiClient.getLayout).mockResolvedValue({} as any);

        const { result } = renderHook(() => useOrganizationData());

        await waitFor(() => {
            expect(result.current.error).toBe(error);
            expect(result.current.loading).toBe(false);
        });
    });
});
