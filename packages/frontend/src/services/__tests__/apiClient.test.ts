import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';

// Mock axios BEFORE importing the client
vi.mock('axios', () => {
  const instance = {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() }
    }
  };
  
  return {
    default: {
      create: vi.fn(() => instance),
      // Add other axios static methods if needed
    }
  };
});

// Import after mock
import apiClient, { getDependencies } from '../apiClient';

describe('apiClient', () => {
  it('creates an axios instance with base URL /api', () => {
    expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({
      baseURL: '/api',
      headers: expect.objectContaining({
        'Content-Type': 'application/json'
      })
    }));
  });

  it('performs GET request correctly', async () => {
    await apiClient.get('/test');
    // We need to access the mock we returned from create
    const mockInstance = (axios.create as any).mock.results[0].value;
    expect(mockInstance.get).toHaveBeenCalledWith('/test');
  });

  it('getDependencies transforms backend response correctly', async () => {
    const mockResponse = {
      data: {
        upstream: [
          { id: 'dep1', from_service_id: 's1', to_service_id: 's2', type: 'DECLARED', metadata: { foo: 'bar' } }
        ],
        downstream: [
          { id: 'dep2', from_service_id: 's3', to_service_id: 's1', type: 'OBSERVED', metadata: {} }
        ]
      }
    };

    const mockInstance = (axios.create as any).mock.results[0].value;
    mockInstance.get.mockResolvedValue(mockResponse);

    const deps = await getDependencies('s1');

    expect(mockInstance.get).toHaveBeenCalledWith('/services/s1/dependencies', { params: {} });
    expect(deps).toHaveLength(2);
    expect(deps[0]).toEqual({
      id: 'dep1',
      fromServiceId: 's1',
      toServiceId: 's2',
      type: 'DECLARED',
      metadata: { foo: 'bar' }
    });
    expect(deps[1]).toEqual({
      id: 'dep2',
      fromServiceId: 's3',
      toServiceId: 's1',
      type: 'OBSERVED',
      metadata: {}
    });
  });
});
