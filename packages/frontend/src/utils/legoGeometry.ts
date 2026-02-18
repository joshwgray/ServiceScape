/**
 * LEGO geometry utilities for deterministic stud placement on ServiceFloor bricks.
 */

export const LEGO_STUD_RADIUS = 0.24; // diameter 0.48 / 2
export const LEGO_STUD_HEIGHT = 0.18;
export const LEGO_STUD_SPACING = 0.6; // spacing between stud centers for 1.8-wide brick

export type StudVariant = '2x2' | '3x2' | '4x2';

const VARIANTS: StudVariant[] = ['2x2', '3x2', '4x2'];

/**
 * Deterministically picks a stud variant based on the service ID.
 * Uses charCodeAt sum modulo 3.
 */
export function getStudVariant(id: string): StudVariant {
  let sum = 0;
  for (let i = 0; i < id.length; i++) {
    sum += id.charCodeAt(i);
  }
  return VARIANTS[sum % 3];
}

/**
 * Returns an array of [x, 0, z] stud positions relative to the brick center.
 * The caller is responsible for offsetting Y to sit on top of the brick body.
 *
 * @param variant - stud layout variant
 * @param brickWidth - total width of the brick (X axis)
 * @param brickDepth - total depth of the brick (Z axis)
 */
export function getStudPositions(
  variant: StudVariant,
  _brickWidth: number,
  _brickDepth: number
): Array<[number, number, number]> {
  // Grid dimensions per variant
  const cols = variant === '2x2' ? 2 : variant === '3x2' ? 3 : 4; // studs along X
  const rows = 2; // studs along Z (always 2)

  const positions: Array<[number, number, number]> = [];

  // Center the grid: offset so studs are symmetric around 0
  const xStart = -((cols - 1) / 2) * LEGO_STUD_SPACING;
  const zStart = -((rows - 1) / 2) * LEGO_STUD_SPACING;

  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      const x = xStart + col * LEGO_STUD_SPACING;
      const z = zStart + row * LEGO_STUD_SPACING;
      positions.push([x, 0, z]);
    }
  }

  return positions;
}
