import { describe, it, expect } from 'vitest';
import { generateMembersForTeam, generateMembersForAllTeams } from '../memberGenerator.js';

describe('memberGenerator', () => {
  describe('generateMembersForTeam', () => {
    it('should generate members for a team', () => {
      const teamId = 'test-team-id';
      const teamSize = 8;
      const members = generateMembersForTeam(teamId, teamSize);
      
      expect(members.length).toBe(teamSize);
      
      members.forEach(member => {
        expect(member).toHaveProperty('id');
        expect(member).toHaveProperty('team_id');
        expect(member).toHaveProperty('name');
        expect(member).toHaveProperty('role');
        expect(member).toHaveProperty('email');
        expect(member.team_id).toBe(teamId);
        expect(typeof member.id).toBe('string');
        expect(typeof member.name).toBe('string');
        expect(member.name.length).toBeGreaterThan(0);
        expect(['ENGINEER', 'SENIOR_ENGINEER', 'LEAD', 'QA', 'MANAGER']).toContain(member.role);
        expect(member.email).toContain('@');
      });
    });

    it('should generate unique member IDs', () => {
      const members = generateMembersForTeam('team-1', 10);
      const ids = members.map(m => m.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(members.length);
    });

    it('should generate unique emails', () => {
      const members = generateMembersForTeam('team-1', 10);
      const emails = members.map(m => m.email);
      const uniqueEmails = new Set(emails);
      
      expect(uniqueEmails.size).toBe(members.length);
    });

    it('should have realistic role distribution', () => {
      const members = generateMembersForTeam('team-1', 20);
      const roleCounts = members.reduce((acc, m) => {
        acc[m.role] = (acc[m.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Most should be engineers
      const engineerCount = (roleCounts['ENGINEER'] || 0) + (roleCounts['SENIOR_ENGINEER'] || 0);
      expect(engineerCount).toBeGreaterThan(members.length * 0.5);
      
      // Should have at least 1 lead or manager for a team of 20
      const leadershipCount = (roleCounts['LEAD'] || 0) + (roleCounts['MANAGER'] || 0);
      expect(leadershipCount).toBeGreaterThanOrEqual(1);
    });

    it('should have exactly 1 manager for larger teams', () => {
      const members = generateMembersForTeam('team-1', 15);
      const managerCount = members.filter(m => m.role === 'MANAGER').length;
      
      expect(managerCount).toBe(1);
    });

    it('should have no manager for small teams', () => {
      const members = generateMembersForTeam('team-1', 4);
      const managerCount = members.filter(m => m.role === 'MANAGER').length;
      
      expect(managerCount).toBe(0);
    });
  });

  describe('generateMembersForAllTeams', () => {
    it('should generate members for all teams', () => {
      const teams = [
        { id: 'team-1', metadata: { size: 8 } },
        { id: 'team-2', metadata: { size: 12 } },
        { id: 'team-3', metadata: { size: 5 } }
      ];
      
      const members = generateMembersForAllTeams(teams as any);
      
      expect(members.length).toBe(8 + 12 + 5);
      
      // Check team-1 members
      const team1Members = members.filter(m => m.team_id === 'team-1');
      expect(team1Members.length).toBe(8);
      
      // Check team-2 members
      const team2Members = members.filter(m => m.team_id === 'team-2');
      expect(team2Members.length).toBe(12);
      
      // Check team-3 members
      const team3Members = members.filter(m => m.team_id === 'team-3');
      expect(team3Members.length).toBe(5);
    });

    it('should generate all unique IDs across teams', () => {
      const teams = [
        { id: 'team-1', metadata: { size: 10 } },
        { id: 'team-2', metadata: { size: 10 } }
      ];
      
      const members = generateMembersForAllTeams(teams as any);
      const ids = members.map(m => m.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(members.length);
    });
  });
});
