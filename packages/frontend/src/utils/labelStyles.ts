/**
 * Centralized label style constants for the ServiceScape 3D visualization.
 * Defines font sizes, outline widths, and colors to establish a clear visual hierarchy
 * across Domain, Building (Team), and Service labels.
 */

export const labelStyles = {
  domain: {
    fontSize: 0.8,
    outlineWidth: 0.02,
    outlineColor: 'white',
  },
  building: {
    fontSize: 0.5,
    outlineWidth: 0.015,
    outlineColor: 'white',
  },
  service: {
    fontSize: 0.3,
    outlineWidth: 0.01,
    outlineColor: 'white',
    zOffset: 0.95, // Positioning offset to avoid z-fighting with brick face
  },
} as const;
