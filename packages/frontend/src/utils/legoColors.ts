// Authentic LEGO brick colors (used for service/team bricks)
export const LEGO_BRICK_COLORS: readonly string[] = [
  '#C91A09', // Bright Red
  '#FFD700', // Bright Yellow
  '#006CB7', // Bright Blue
  '#00A650', // Bright Green
  '#F47B20', // Bright Orange
  '#FFFFFF', // White
  '#05131D', // Black
  '#9BA19D', // Medium Stone Grey
  '#6C6E68', // Dark Stone Grey
  '#A05F35', // Reddish Brown
  '#FF69B4', // Bright Pink (Light Purple-ish)
  '#00BCD4', // Medium Azure
  '#FFA500', // Flame Yellowish Orange
  '#8B4513', // Dark Brown
  '#4CAF50', // Bright Yellowish Green
  '#1565C0', // Earth Blue
  '#7B3F00', // Dark Orange
  '#B0E0E6', // Light Blue (Aqua)
  '#D3A121', // Warm Gold
  '#A2A5A2', // Silver
  '#CC0000', // Dark Red
  '#2196F3', // Medium Blue
  '#66BB6A', // Medium Green
  '#FF8F00', // Dark Tan / Ochre
  '#795548', // Brown
];

// LEGO plate/baseplate colors (used for domain snap-on plates)
// NOTE: Classic Green (#00A650) deliberately excluded — it matches the world
// baseplate color and would make the domain plate invisible.
export const LEGO_PLATE_COLORS: readonly string[] = [
  '#7B2D8B', // Bright Violet
  '#9BA19D', // Light Gray
  '#F47B20', // Orange
  '#006CB7', // Blue
  '#A05F35', // Tan/Brown
  '#FFD700', // Yellow
  '#C91A09', // Red
  '#05131D', // Dark/Black
];

/**
 * Deterministic hash of `id` -> index into palette.
 * Uses sum of charCodeAt(i) * (i + 1) for good distribution.
 */
function hashId(id: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash += id.charCodeAt(i) * (i + 1);
  }
  return hash % length;
}

/**
 * Returns a deterministic LEGO brick color for the given ID.
 */
export function getLegoColor(id: string): string {
  return LEGO_BRICK_COLORS[hashId(id, LEGO_BRICK_COLORS.length)];
}

/**
 * Returns a deterministic LEGO plate color for the given ID.
 */
export function getLegoPlateColor(id: string): string {
  return LEGO_PLATE_COLORS[hashId(id, LEGO_PLATE_COLORS.length)];
}
