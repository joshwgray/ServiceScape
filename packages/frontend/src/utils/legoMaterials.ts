import * as THREE from 'three';

export interface LegoMaterialOptions {
  color: string;
  transparent?: boolean;
  opacity?: number;
}

/**
 * Creates a MeshStandardMaterial with LEGO plastic properties:
 * - roughness: 0.25 (slightly shiny, not mirror)
 * - metalness: 0.0 (pure plastic)
 */
export function createLegoPlasticMaterial(options: LegoMaterialOptions): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: options.color,
    roughness: 0.25,
    metalness: 0.0,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1.0,
  });
}
