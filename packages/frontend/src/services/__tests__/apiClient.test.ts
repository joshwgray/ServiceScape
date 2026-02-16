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
import apiClient from '../apiClient';

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
});
