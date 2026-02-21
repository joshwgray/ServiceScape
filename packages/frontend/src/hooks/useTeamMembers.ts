import { useState, useEffect, useRef } from 'react';
import type { TeamMemberDetail } from '@servicescape/shared';
import { getTeamById } from '../services/apiClient';

interface UseTeamMembersResult {
  members: TeamMemberDetail[];
  loading: boolean;
  error: Error | null;
}

export function useTeamMembers(teamId: string | undefined): UseTeamMembersResult {
  const [members, setMembers] = useState<TeamMemberDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Cache results per teamId to avoid redundant fetches
  const cache = useRef<Map<string, TeamMemberDetail[]>>(new Map());

  useEffect(() => {
    if (!teamId) {
      setMembers([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Return cached result immediately if available
    if (cache.current.has(teamId)) {
      setMembers(cache.current.get(teamId)!);
      setLoading(false);
      setError(null);
      return;
    }

    let mounted = true;

    const fetchTeamMembers = async () => {
      setLoading(true);
      setError(null);

      try {
        const teamDetail = await getTeamById(teamId);
        if (mounted) {
          cache.current.set(teamId, teamDetail.members);
          setMembers(teamDetail.members);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (mounted) {
          const fetchError = err instanceof Error ? err : new Error(String(err));
          setError(fetchError);
          setMembers([]);
          setLoading(false);
        }
      }
    };

    fetchTeamMembers();

    return () => {
      mounted = false;
    };
  }, [teamId]);

  return { members, loading, error };
}
