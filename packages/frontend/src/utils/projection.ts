import { Vector3, Camera } from 'three';

export interface ProjectionResult {
  /** Screen x coordinate in pixels */
  x: number;
  /** Screen y coordinate in pixels */
  y: number;
  /**
   * Whether the NDC z-value is within the clip range [-1, 1].
   * `false` means the point is clipped by the near or far plane.
   * Note: this does NOT check x/y frustum bounds — a point can be
   * outside the viewport horizontally/vertically and still be `visible: true`.
   */
  visible: boolean;
}

/**
 * Determines whether a projected NDC z-value falls outside the clip range [-1, 1],
 * meaning the point is clipped by either the near plane (ndcZ < -1) or the far
 * plane (ndcZ > 1).
 *
 * @param ndcZ - The z component after projecting into Normalised Device Coordinates
 * @returns `true` when the point should be considered clipped / not visible
 */
export function isNdcZClipped(ndcZ: number): boolean {
  return ndcZ > 1 || ndcZ < -1;
}

/**
 * Projects a 3-D world position to 2-D screen pixel coordinates using the
 * supplied camera and viewport dimensions.
 *
 * The input `worldPosition` is **not** mutated — the function clones it
 * internally before calling `Vector3.project()`.
 *
 * @param worldPosition  - The 3-D point in world space
 * @param camera         - The Three.js camera to project through
 * @param viewportWidth  - The canvas / viewport width in pixels
 * @param viewportHeight - The canvas / viewport height in pixels
 * @returns A `ProjectionResult` with pixel coordinates and a visibility flag
 */
export function projectToScreen(
  worldPosition: Vector3,
  camera: Camera,
  viewportWidth: number,
  viewportHeight: number,
): ProjectionResult {
  // Clone to avoid mutating the caller's Vector3
  const ndc = worldPosition.clone().project(camera);

  const visible = !isNdcZClipped(ndc.z);

  // Convert NDC [-1, 1] → pixel coordinates
  // NDC y is +1 at the top, so we flip it when converting to screen space
  const x = ((ndc.x + 1) / 2) * viewportWidth;
  const y = ((-ndc.y + 1) / 2) * viewportHeight;

  return { x, y, visible };
}

/**
 * Clamps screen coordinates so the point stays within the viewport boundary,
 * optionally inset by a margin on all sides.
 *
 * @param position       - The raw screen `{x, y}` coordinates to clamp
 * @param viewportWidth  - The canvas / viewport width in pixels
 * @param viewportHeight - The canvas / viewport height in pixels
 * @param margin         - Minimum distance from each edge in pixels (default 0)
 * @returns A new `{x, y}` object with clamped coordinates
 */
export function clampToViewport(
  position: { x: number; y: number },
  viewportWidth: number,
  viewportHeight: number,
  margin = 0,
): { x: number; y: number } {
  return {
    x: Math.max(margin, Math.min(viewportWidth - margin, position.x)),
    y: Math.max(margin, Math.min(viewportHeight - margin, position.y)),
  };
}
