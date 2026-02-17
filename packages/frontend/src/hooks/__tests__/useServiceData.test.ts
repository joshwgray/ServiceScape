
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useServiceData } from '../useServiceData';
import * as apiClient from '../../services/apiClient';

vi.mock('../../services/apiClient', () => ({
  getServices: vi.fn(),
}));

describe('useServiceData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockServices = [
    { id: '1', name: 'Service A', teamId: 'team1' },
    { id: '2', name: 'Service B', teamId: 'team1' },
  ];

  it('should fetch services successfully', async () => {
    (apiClient.getServices as any).mockResolvedValue(mockServices);

    const { result } = renderHook(() => useServiceData('team1'));

    expect(result.current.loading).toBe(true);
    expect(result.current.services).toEqual([]);

    await waitFor(() => {
        expect(result.current.loading).toBe(false);
    });

    expect(result.current.services).toEqual(mockServices);
    expect(result.current.error).toBe(null);
  });

  it('should handle errors', async () => {
    const error = new Error('Failed to fetch');
    (apiClient.getServices as any).mockRejectedValue(error);

    const { result } = renderHook(() => useServiceData('team2'));

    await waitFor(() => {
        expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(error);
  });

  it('should use cached data for subsequent calls with same teamId', async () => {
    (apiClient.getServices as any).mockResolvedValue(mockServices);

    const { result: result1, unmount: unmount1 } = renderHook(() => useServiceData('team3'));

    await waitFor(() => {
        expect(result1.current.loading).toBe(false);
    });

    expect(result1.current.services).toEqual(mockServices);
    expect(apiClient.getServices).toHaveBeenCalledTimes(1);
    
    unmount1();

    // Rerender with same teamId
    const { result: result2 } = renderHook(() => useServiceData('team3'));
    
    // Should be instant
    expect(result2.current.loading).toBe(false);
    expect(result2.current.services).toEqual(mockServices);
    
    // API should not be called again
    expect(apiClient.getServices).toHaveBeenCalledTimes(1);
  });
});
