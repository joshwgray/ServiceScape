export enum LODLevel {
  NEAR = 'NEAR',
  MEDIUM = 'MEDIUM',
  FAR = 'FAR'
}

export const LOD_THRESHOLDS = {
  NEAR: 100, // Distance < 100
  MEDIUM: 500, // Distance 100-500
  FAR: 1000 // Distance > 500
};
