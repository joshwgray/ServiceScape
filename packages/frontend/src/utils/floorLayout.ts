
/**
 * Calculates the Y position for a service floor instance.
 * @param index The index of the floor (0-based)
 * @param height The height of a single floor
 * @param spacing The vertical spacing between floors
 * @param baseY The starting Y position (bottom of the first floor)
 * @returns The calculated Y position (center of the floor)
 */
export const calculateFloorY = (
  index: number,
  height: number,
  spacing: number,
  baseY: number = 0
): number => {
  return baseY + index * (height + spacing) + height / 2;
};
