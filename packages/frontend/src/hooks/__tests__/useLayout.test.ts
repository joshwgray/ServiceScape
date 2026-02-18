import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useLayout } from '../useLayout';

// Mock apiClient
vi.mock('../../services/apiClient', () => ({
  getLayout: vi.fn(),
}));

import { getLayout } from '../../services/apiClient';

describe('useLayout', () => {
    beforeEach(() => {
        vi.clearAllMocks(); 
    });

  it('should fetch layout data', async () => {
    const mockLayout = {
      domains: { 'd1': { x: 0, y: 0, z: 0 } },
      teams: {},
      services: {}
    };
    (getLayout as any).mockResolvedValue(mockLayout);

    const { result } = renderHook(() => useLayout());

    await waitFor(() => {
      expect(result.current.layout).toEqual(mockLayout);
      expect(result.current.loading).toBe(false);
    });
  });
});
