import { describe, it, expect } from 'vitest';
import {
  calculateDomainGrid,
  calculateTeamTreemap,
  calculateServiceStack,
  checkCollision,
  type Position3D,
  type BoundingBox,
} from '../layoutAlgorithms.js';

describe('Layout Algorithms', () => {
  describe('checkCollision', () => {
    it('should detect overlapping boxes', () => {
      const box1: BoundingBox = { x: 0, y: 0, z: 0, width: 10, height: 10, depth: 10 };
      const box2: BoundingBox = { x: 5, y: 5, z: 5, width: 10, height: 10, depth: 10 };

      expect(checkCollision(box1, box2)).toBe(true);
    });

    it('should not detect non-overlapping boxes', () => {
      const box1: BoundingBox = { x: 0, y: 0, z: 0, width: 10, height: 10, depth: 10 };
      const box2: BoundingBox = { x: 20, y: 20, z: 20, width: 10, height: 10, depth: 10 };

      expect(checkCollision(box1, box2)).toBe(false);
    });

    it('should detect touching boxes as collision', () => {
      const box1: BoundingBox = { x: 0, y: 0, z: 0, width: 10, height: 10, depth: 10 };
      const box2: BoundingBox = { x: 10, y: 0, z: 0, width: 10, height: 10, depth: 10 };

      expect(checkCollision(box1, box2)).toBe(true);
    });
  });

  describe('calculateDomainGrid', () => {
    it('should place domains in a grid pattern', () => {
      const domains = [
        { id: 'domain-1', name: 'Domain 1', size: 100 },
        { id: 'domain-2', name: 'Domain 2', size: 100 },
        { id: 'domain-3', name: 'Domain 3', size: 100 },
        { id: 'domain-4', name: 'Domain 4', size: 100 },
      ];

      const layout = calculateDomainGrid(domains, 150);

      expect(layout).toHaveLength(4);
      
      // Check that all positions are defined
      layout.forEach((pos: Position3D) => {
        expect(pos.x).toBeDefined();
        expect(pos.y).toBeDefined();
        expect(pos.z).toBe(0); // Domains at ground level
      });

      // Check spacing - domains should be at least 150 units apart
      for (let i = 0; i < layout.length; i++) {
        for (let j = i + 1; j < layout.length; j++) {
          const dist = Math.sqrt(
            Math.pow(layout[i].x - layout[j].x, 2) +
            Math.pow(layout[i].y - layout[j].y, 2)
          );
          expect(dist).toBeGreaterThanOrEqual(150);
        }
      }
    });

    it('should create a deterministic layout for same inputs', () => {
      const domains = [
        { id: 'domain-1', name: 'Domain 1', size: 100 },
        { id: 'domain-2', name: 'Domain 2', size: 100 },
      ];

      const layout1 = calculateDomainGrid(domains, 150);
      const layout2 = calculateDomainGrid(domains, 150);

      expect(layout1).toEqual(layout2);
    });
  });

  describe('calculateTeamTreemap', () => {
    it('should pack teams within domain bounds', () => {
      const teams = [
        { id: 'team-1', name: 'Team 1', size: 50 },
        { id: 'team-2', name: 'Team 2', size: 50 },
        { id: 'team-3', name: 'Team 3', size: 30 },
      ];

      const domainBounds: BoundingBox = {
        x: 0,
        y: 0,
        z: 0,
        width: 100,
        height: 100,
        depth: 50,
      };

      const layout = calculateTeamTreemap(teams, domainBounds);

      expect(layout).toHaveLength(3);

      // All teams should be within domain bounds
      layout.forEach((pos: Position3D) => {
        expect(pos.x).toBeGreaterThanOrEqual(domainBounds.x);
        expect(pos.x).toBeLessThan(domainBounds.x + domainBounds.width);
        expect(pos.y).toBeGreaterThanOrEqual(domainBounds.y);
        expect(pos.y).toBeLessThan(domainBounds.y + domainBounds.height);
        expect(pos.z).toBeGreaterThanOrEqual(domainBounds.z);
      });
    });

    it('should not create overlapping teams', () => {
      const teams = [
        { id: 'team-1', name: 'Team 1', size: 40 },
        { id: 'team-2', name: 'Team 2', size: 40 },
        { id: 'team-3', name: 'Team 3', size: 40 },
      ];

      const domainBounds: BoundingBox = {
        x: 0,
        y: 0,
        z: 0,
        width: 200,
        height: 200,
        depth: 50,
      };

      const layout = calculateTeamTreemap(teams, domainBounds);

      // Check for overlaps
      for (let i = 0; i < layout.length; i++) {
        for (let j = i + 1; j < layout.length; j++) {
          const box1: BoundingBox = {
            x: layout[i].x,
            y: layout[i].y,
            z: layout[i].z,
            width: teams[i].size,
            height: teams[i].size,
            depth: 20,
          };
          const box2: BoundingBox = {
            x: layout[j].x,
            y: layout[j].y,
            z: layout[j].z,
            width: teams[j].size,
            height: teams[j].size,
            depth: 20,
          };
          expect(checkCollision(box1, box2)).toBe(false);
        }
      }
    });
  });

  describe('calculateServiceStack', () => {
    it('should stack services vertically within team bounds', () => {
      const services = [
        { id: 'service-1', name: 'Service 1', tier: 'T1' },
        { id: 'service-2', name: 'Service 2', tier: 'T2' },
        { id: 'service-3', name: 'Service 3', tier: 'T3' },
      ];

      const teamBounds: BoundingBox = {
        x: 0,
        y: 0,
        z: 0,
        width: 50,
        height: 50,
        depth: 100,
      };

      const layout = calculateServiceStack(services, teamBounds, 10);

      expect(layout).toHaveLength(3);

      // Services should be stacked vertically
      expect(layout[0].z).toBeLessThan(layout[1].z);
      expect(layout[1].z).toBeLessThan(layout[2].z);

      // Services should be within team horizontal bounds
      layout.forEach((pos: Position3D) => {
        expect(pos.x).toBeGreaterThanOrEqual(teamBounds.x);
        expect(pos.x).toBeLessThan(teamBounds.x + teamBounds.width);
        expect(pos.y).toBeGreaterThanOrEqual(teamBounds.y);
        expect(pos.y).toBeLessThan(teamBounds.y + teamBounds.height);
      });

      // Check spacing between services
      for (let i = 0; i < layout.length - 1; i++) {
        const spacing = layout[i + 1].z - layout[i].z;
        expect(spacing).toBeGreaterThanOrEqual(10);
      }
    });

    it('should place services at center of team bounds horizontally', () => {
      const services = [
        { id: 'service-1', name: 'Service 1', tier: 'T1' },
      ];

      const teamBounds: BoundingBox = {
        x: 0,
        y: 0,
        z: 0,
        width: 100,
        height: 100,
        depth: 50,
      };

      const layout = calculateServiceStack(services, teamBounds, 10);

      expect(layout[0].x).toBeCloseTo(50, 1);
      expect(layout[0].y).toBeCloseTo(50, 1);
    });
  });
});
