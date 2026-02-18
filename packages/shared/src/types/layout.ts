/**
 * Layout types for 3D positioning
 * Follows Three.js coordinate convention:
 * - X axis: horizontal (left/right)
 * - Y axis: vertical (up/down) 
 * - Z axis: depth (forward/back)
 */

/**
 * Represents a position in 3D space using Three.js coordinate system
 * Ground plane convention: x/z horizontal plane, y vertical axis
 * 
 * @property x - Horizontal position (left/right on ground plane)
 * @property y - Vertical position (up/down, height above ground)
 * @property z - Depth position (forward/back on ground plane)
 * 
 * @example
 * // Building at ground level
 * { x: 100, y: 0, z: 50 }
 * 
 * // Service stacked vertically above ground
 * { x: 100, y: 25, z: 50 }
 */
export interface Position3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Represents a bounding box in 3D space
 * Extends Position3D with dimensions
 */
export interface BoundingBox extends Position3D {
  width: number;   // Size along x-axis
  height: number;  // Size along y-axis
  depth: number;   // Size along z-axis
}

/**
 * Item to be laid out in 3D space
 */
export interface LayoutItem {
  id: string;
  name: string;
  size?: number;
  tier?: string;
}
