import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useOrganizationData } from '../useOrganizationData';
import * as apiClient from '../../services/apiClient';

vi.mock('../../services/apiClient', () => ({
    getDomains: vi.fn(),
    default: {
        get: vi.fn()
    }
}));

describe('useOrganizationData', () => {
    it('should fetch domains on mount', async () => {
        const mockDomains = [{ id: 'd1', name: 'Domain 1' }];
        vi.mocked(apiClient.getDomains).mockResolvedValue(mockDomains as any);

        const { result } = renderHook(() => useOrganizationData());

        expect(result.current.loading).toBe(true);
        
        await waitFor(() => {
            expect(result.current.domains).toEqual(mockDomains);
            expect(result.current.loading).toBe(false);
        });
    });

    it('should handle errors', async () => {
        const error = new Error('Failed to fetch');
        vi.mocked(apiClient.getDomains).mockRejectedValue(error);

        const { result } = renderHook(() => useOrganizationData());

        await waitFor(() => {
            expect(result.current.error).toBe(error);
            expect(result.current.loading).toBe(false);
        });
    });
});
