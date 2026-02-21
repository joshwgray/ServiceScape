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
import apiClient, { getDependencies, getTeamById } from '../apiClient';

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

  it('getDependencies returns backend response with camelCase fields', async () => {
    const mockResponse = {
      data: {
        upstream: [
          { id: 'dep1', fromServiceId: 's1', toServiceId: 's2', type: 'DECLARED', metadata: { foo: 'bar' } }
        ],
        downstream: [
          { id: 'dep2', fromServiceId: 's3', toServiceId: 's1', type: 'OBSERVED', metadata: {} }
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

describe('getTeamById', () => {
  it('returns team with members array', async () => {
    const mockTeamDetail = {
      id: 'team-1',
      domainId: 'domain-1',
      name: 'Platform Team',
      managerId: 'mgr-1',
      members: [
        {
          id: 'member-1',
          name: 'Alice',
          role: 'Engineer',
          teamId: 'team-1',
          email: 'alice@example.com',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'member-2',
          name: 'Bob',
          role: 'Lead',
          teamId: 'team-1',
          email: 'bob@example.com',
          createdAt: '2024-01-02T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
        },
      ],
    };

    const mockInstance = (axios.create as any).mock.results[0].value;
    mockInstance.get.mockResolvedValue({ data: mockTeamDetail });

    const result = await getTeamById('team-1');

    expect(mockInstance.get).toHaveBeenCalledWith('/teams/team-1');
    expect(result.id).toBe('team-1');
    expect(result.name).toBe('Platform Team');
    expect(result.members).toHaveLength(2);
    expect(result.members[0]).toEqual(mockTeamDetail.members[0]);
    expect(result.members[1]).toEqual(mockTeamDetail.members[1]);
  });

  it('handles 404 errors', async () => {
    const mockInstance = (axios.create as any).mock.results[0].value;
    const notFoundError = Object.assign(new Error('Request failed with status code 404'), {
      response: { status: 404, data: { error: 'Not Found', message: 'Team not found' } },
    });
    mockInstance.get.mockRejectedValue(notFoundError);

    await expect(getTeamById('non-existent-team')).rejects.toThrow('Request failed with status code 404');
  });

  it('handles network errors', async () => {
    const mockInstance = (axios.create as any).mock.results[0].value;
    const networkError = new Error('Network Error');
    mockInstance.get.mockRejectedValue(networkError);

    await expect(getTeamById('team-1')).rejects.toThrow('Network Error');
  });
});
