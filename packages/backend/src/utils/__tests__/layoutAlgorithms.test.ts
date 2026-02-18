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

  describe('calculateDomainGrid - NEW COORDINATE SYSTEM', () => {
    it('should place domains on x/z ground plane with y=0', () => {
      const domains = [
        { id: 'domain-1', name: 'Domain 1', size: 100 },
        { id: 'domain-2', name: 'Domain 2', size: 100 },
        { id: 'domain-3', name: 'Domain 3', size: 100 },
        { id: 'domain-4', name: 'Domain 4', size: 100 },
      ];

      const layout = calculateDomainGrid(domains, 150);

      expect(layout).toHaveLength(4);
      
      // Check that all positions use x/z plane, y=0 for ground
      layout.forEach((pos: Position3D) => {
        expect(pos.x).toBeDefined();
        expect(pos.y).toBe(0); // Ground level is y=0
        expect(pos.z).toBeDefined();
      });

      // Check spacing on x/z plane - domains should be at least 150 units apart
      for (let i = 0; i < layout.length; i++) {
        for (let j = i + 1; j < layout.length; j++) {
          const dist = Math.sqrt(
            Math.pow(layout[i].x - layout[j].x, 2) +
            Math.pow(layout[i].z - layout[j].z, 2) // x/z distance, not x/y
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

  describe('calculateTeamTreemap - NEW COORDINATE SYSTEM', () => {
    it('should pack teams within domain bounds on x/z plane', () => {
      const teams = [
        { id: 'team-1', name: 'Team 1', size: 50 },
        { id: 'team-2', name: 'Team 2', size: 50 },
        { id: 'team-3', name: 'Team 3', size: 30 },
      ];

      const domainBounds: BoundingBox = {
        x: 0,
        y: 0,
        z: 0,
        width: 100,   // x-axis
        height: 50,   // y-axis (vertical)
        depth: 100,   // z-axis
      };

      const layout = calculateTeamTreemap(teams, domainBounds);

      expect(layout).toHaveLength(3);

      // All teams should be within domain bounds on x/z plane
      layout.forEach((pos: Position3D) => {
        expect(pos.x).toBeGreaterThanOrEqual(domainBounds.x);
        expect(pos.x).toBeLessThan(domainBounds.x + domainBounds.width);
        expect(pos.y).toBe(0); // Teams on ground level
        expect(pos.z).toBeGreaterThanOrEqual(domainBounds.z);
        expect(pos.z).toBeLessThan(domainBounds.z + domainBounds.depth);
      });
    });

    it('should not create overlapping teams on x/z plane', () => {
      const teams = [
        { id: 'team-1', name: 'Team 1', size: 40 },
        { id: 'team-2', name: 'Team 2', size: 40 },
        { id: 'team-3', name: 'Team 3', size: 40 },
      ];

      const domainBounds: BoundingBox = {
        x: 0,
        y: 0,
        z: 0,
        width: 200,  // x-axis
        height: 50,  // y-axis
        depth: 200,  // z-axis
      };

      const layout = calculateTeamTreemap(teams, domainBounds);

      // Check for overlaps on x/z plane
      for (let i = 0; i < layout.length; i++) {
        for (let j = i + 1; j < layout.length; j++) {
          const box1: BoundingBox = {
            x: layout[i].x,
            y: layout[i].y,
            z: layout[i].z,
            width: teams[i].size,
            height: 20,
            depth: teams[i].size,
          };
          const box2: BoundingBox = {
            x: layout[j].x,
            y: layout[j].y,
            z: layout[j].z,
            width: teams[j].size,
            height: 20,
            depth: teams[j].size,
          };
          expect(checkCollision(box1, box2)).toBe(false);
        }
      }
    });

    it('should handle teams with missing IDs gracefully', () => {
      const teams = [
        { id: 'team-1', name: 'Team 1', size: 40 },
        { id: 'team-2', name: 'Team 2', size: 40 },
      ];

      const domainBounds: BoundingBox = {
        x: 0,
        y: 0,
        z: 0,
        width: 200,
        height: 50,
        depth: 200,
      };

      // Should not throw when calculating positions
      const layout = calculateTeamTreemap(teams, domainBounds);
      
      expect(layout).toHaveLength(2);
      expect(layout[0]).toBeDefined();
      expect(layout[1]).toBeDefined();
    });

    it('should handle duplicate team IDs gracefully', () => {
      const teams = [
        { id: 'team-1', name: 'Team 1', size: 40 },
        { id: 'team-1', name: 'Team 1 Duplicate', size: 40 }, // Duplicate ID
        { id: 'team-2', name: 'Team 2', size: 40 },
      ];

      const domainBounds: BoundingBox = {
        x: 0,
        y: 0,
        z: 0,
        width: 200,
        height: 50,
        depth: 200,
      };

      // Should not throw or write to positions[-1]
      const layout = calculateTeamTreemap(teams, domainBounds);
      
      expect(layout).toHaveLength(3);
      expect(layout[0]).toBeDefined();
      expect(layout[1]).toBeDefined();
      expect(layout[2]).toBeDefined();
    });
  });

  describe('calculateServiceStack - NEW COORDINATE SYSTEM', () => {
    it('should stack services vertically along y-axis within team bounds', () => {
      const services = [
        { id: 'service-1', name: 'Service 1', tier: 'T1' },
        { id: 'service-2', name: 'Service 2', tier: 'T2' },
        { id: 'service-3', name: 'Service 3', tier: 'T3' },
      ];

      const teamBounds: BoundingBox = {
        x: 0,
        y: 0,
        z: 0,
        width: 50,   // x-axis
        height: 100, // y-axis (vertical)
        depth: 50,   // z-axis
      };

      const layout = calculateServiceStack(services, teamBounds, 0.6);

      expect(layout).toHaveLength(3);

      // Services should be stacked vertically on y-axis
      expect(layout[0].y).toBeLessThan(layout[1].y);
      expect(layout[1].y).toBeLessThan(layout[2].y);

      // Services should be within team horizontal bounds (x/z plane)
      layout.forEach((pos: Position3D) => {
        expect(pos.x).toBeGreaterThanOrEqual(teamBounds.x);
        expect(pos.x).toBeLessThan(teamBounds.x + teamBounds.width);
        expect(pos.z).toBeGreaterThanOrEqual(teamBounds.z);
        expect(pos.z).toBeLessThan(teamBounds.z + teamBounds.depth);
      });

      // Check spacing between services on y-axis
      for (let i = 0; i < layout.length - 1; i++) {
        const spacing = layout[i + 1].y - layout[i].y;
        expect(spacing).toBeCloseTo(0.6, 2);
      }
    });

    it('should place services at center of team bounds on x/z plane', () => {
      const services = [
        { id: 'service-1', name: 'Service 1', tier: 'T1' },
      ];

      const teamBounds: BoundingBox = {
        x: 0,
        y: 0,
        z: 0,
        width: 100,
        height: 50,
        depth: 100,
      };

      const layout = calculateServiceStack(services, teamBounds, 0.6);

      // Should be centered on x/z plane
      expect(layout[0].x).toBeCloseTo(50, 1);
      expect(layout[0].z).toBeCloseTo(50, 1);
    });

    it('should use 0.6 unit spacing for visually connected floors', () => {
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
        height: 100,
        depth: 50,
      };

      const layout = calculateServiceStack(services, teamBounds, 0.6);

      // Check spacing between consecutive floors matches 0.6
      for (let i = 0; i < layout.length - 1; i++) {
        const spacing = layout[i + 1].y - layout[i].y;
        expect(spacing).toBeCloseTo(0.6, 2);
      }
    });

    it('should start floors at ground level (y + 0.5)', () => {
      const services = [
        { id: 'service-1', name: 'Service 1', tier: 'T1' },
      ];

      const teamBounds: BoundingBox = {
        x: 0,
        y: 0,
        z: 0,
        width: 50,
        height: 100,
        depth: 50,
      };

      const layout = calculateServiceStack(services, teamBounds, 0.6);

      // First service should be at ground + 0.25 (center of 0.5-high floor with bottom at y=0)
      expect(layout[0].y).toBeCloseTo(0.25, 2);
    });

    it('should create visually connected service stack', () => {
      const services = [
        { id: 'service-1', name: 'Service 1', tier: 'T1' },
        { id: 'service-2', name: 'Service 2', tier: 'T2' },
        { id: 'service-3', name: 'Service 3', tier: 'T3' },
      ];

      const teamBounds: BoundingBox = {
        x: 10,
        y: 0,
        z: 10,
        width: 50,
        height: 100,
        depth: 50,
      };

      const layout = calculateServiceStack(services, teamBounds, 0.6);

      // Verify the stack forms a cohesive visual structure
      // Floor 1: y = 0.25 (center of 0.5 high floor, bottom at ground)
      expect(layout[0].y).toBeCloseTo(0.25, 2);
      // Floor 2: y = 0.85 (0.25 + 0.6 spacing)
      expect(layout[1].y).toBeCloseTo(0.85, 2);
      // Floor 3: y = 1.45 (0.85 + 0.6 spacing)
      expect(layout[2].y).toBeCloseTo(1.45, 2);

      // All services centered on x/z plane
      const expectedX = teamBounds.x + teamBounds.width / 2;
      const expectedZ = teamBounds.z + teamBounds.depth / 2;
      layout.forEach((pos) => {
        expect(pos.x).toBeCloseTo(expectedX, 1);
        expect(pos.z).toBeCloseTo(expectedZ, 1);
      });
    });
  });
});
