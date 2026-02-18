import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDependencies } from '../useDependencies';

// Mock apiClient
vi.mock('../../services/apiClient', () => ({
  getDependencies: vi.fn(),
}));

import { getDependencies } from '../../services/apiClient';

describe('useDependencies', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

  it('should fetch dependencies for a given service', async () => {
    const mockDependencies = [{ id: 'dep-1', fromServiceId: 'svc-1', toServiceId: 'svc-2', type: 'DECLARED' }];
    (getDependencies as any).mockResolvedValue(mockDependencies);

    const { result } = renderHook(() => useDependencies('svc-1'));

    await waitFor(() => {
      expect(result.current.dependencies).toEqual(mockDependencies);
      expect(result.current.loading).toBe(false);
    });

    expect(getDependencies).toHaveBeenCalledWith('svc-1', undefined);
  });

  it('should filter dependencies by type if provided', async () => {
      const mockDependencies = [{ id: 'dep-1', fromServiceId: 'svc-1', toServiceId: 'svc-2', type: 'DECLARED' }];
      (getDependencies as any).mockResolvedValue(mockDependencies);

      renderHook(() => useDependencies('svc-1', 'DECLARED'));

      await waitFor(() => {
          expect(getDependencies).toHaveBeenCalledWith('svc-1', 'DECLARED');
      });
  });
});
