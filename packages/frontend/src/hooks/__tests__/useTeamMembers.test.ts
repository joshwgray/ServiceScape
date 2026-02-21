import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTeamMembers } from '../useTeamMembers';

vi.mock('../../services/apiClient', () => ({
  getTeamById: vi.fn(),
}));

import { getTeamById } from '../../services/apiClient';

const mockMembers = [
  { id: 'm1', name: 'Alice', role: 'Engineer', teamId: 't1' },
  { id: 'm2', name: 'Bob', role: 'Manager', teamId: 't1' },
];

const mockTeamDetail = {
  id: 't1',
  name: 'Team Alpha',
  domainId: 'd1',
  members: mockMembers,
};

describe('useTeamMembers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array and no loading when teamId is undefined', () => {
    const { result } = renderHook(() => useTeamMembers(undefined));

    expect(result.current.members).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(getTeamById).not.toHaveBeenCalled();
  });

  it('returns loading state while fetching', async () => {
    let resolvePromise!: (value: typeof mockTeamDetail) => void;
    const promise = new Promise<typeof mockTeamDetail>((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(getTeamById).mockReturnValue(promise as any);

    const { result } = renderHook(() => useTeamMembers('t1'));

    expect(result.current.loading).toBe(true);
    expect(result.current.members).toEqual([]);

    resolvePromise(mockTeamDetail);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('fetches and returns team members when teamId is provided', async () => {
    vi.mocked(getTeamById).mockResolvedValue(mockTeamDetail as any);

    const { result } = renderHook(() => useTeamMembers('t1'));

    await waitFor(() => {
      expect(result.current.members).toEqual(mockMembers);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    expect(getTeamById).toHaveBeenCalledWith('t1');
  });

  it('fetches again when teamId changes', async () => {
    const mockTeam2 = {
      id: 't2',
      name: 'Team Beta',
      domainId: 'd1',
      members: [{ id: 'm3', name: 'Charlie', role: 'Designer', teamId: 't2' }],
    };

    vi.mocked(getTeamById)
      .mockResolvedValueOnce(mockTeamDetail as any)
      .mockResolvedValueOnce(mockTeam2 as any);

    const { result, rerender } = renderHook((props: { teamId: string }) => useTeamMembers(props.teamId), {
      initialProps: { teamId: 't1' },
    });

    await waitFor(() => {
      expect(result.current.members).toEqual(mockMembers);
    });

    rerender({ teamId: 't2' });

    await waitFor(() => {
      expect(result.current.members).toEqual(mockTeam2.members);
    });

    expect(getTeamById).toHaveBeenCalledTimes(2);
    expect(getTeamById).toHaveBeenCalledWith('t1');
    expect(getTeamById).toHaveBeenCalledWith('t2');
  });

  it('returns error state on fetch failure', async () => {
    const fetchError = new Error('Network error');
    vi.mocked(getTeamById).mockRejectedValue(fetchError);

    const { result } = renderHook(() => useTeamMembers('t1'));

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Network error');
      expect(result.current.loading).toBe(false);
      expect(result.current.members).toEqual([]);
    });
  });

  it('caches results and does not refetch the same teamId', async () => {
    const mockTeam2Members = [{ id: 'm3', name: 'Charlie', role: 'Designer', teamId: 't2' }];
    vi.mocked(getTeamById)
      .mockResolvedValueOnce(mockTeamDetail as any)
      .mockResolvedValueOnce({
        id: 't2',
        name: 'Team Beta',
        domainId: 'd1',
        members: mockTeam2Members,
      } as any);

    const { result, rerender } = renderHook((props: { teamId: string }) => useTeamMembers(props.teamId), {
      initialProps: { teamId: 't1' },
    });

    await waitFor(() => {
      expect(result.current.members).toEqual(mockMembers);
    });
    expect(getTeamById).toHaveBeenCalledTimes(1);

    // Change to a different teamId
    rerender({ teamId: 't2' });

    await waitFor(() => {
      expect(result.current.members).toEqual(mockTeam2Members);
    });
    expect(getTeamById).toHaveBeenCalledTimes(2);

    // Switch back to 't1' — should use cache, not call the API again
    rerender({ teamId: 't1' });

    await waitFor(() => {
      expect(result.current.members).toEqual(mockMembers);
    });

    // Still only 2 calls — 't1' was served from cache
    expect(getTeamById).toHaveBeenCalledTimes(2);
  });

  it('should not update state after unmount during in-flight request', async () => {
    let resolvePromise!: (value: typeof mockTeamDetail) => void;
    const promise = new Promise<typeof mockTeamDetail>((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(getTeamById).mockReturnValue(promise as any);

    const { result, unmount } = renderHook(() => useTeamMembers('t1'));

    expect(result.current.loading).toBe(true);

    // Unmount before the promise resolves
    unmount();

    // Now resolve the in-flight request
    resolvePromise(mockTeamDetail);

    // Flush microtasks — no state update should occur
    await Promise.resolve();

    // State should remain at the unmounted snapshot (loading=true, members=[])
    expect(result.current.members).toEqual([]);
    expect(result.current.loading).toBe(true);
  });
});
