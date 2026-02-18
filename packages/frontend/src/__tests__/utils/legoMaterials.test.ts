import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createLegoPlasticMaterial } from '../../utils/legoMaterials';

describe('createLegoPlasticMaterial', () => {
  it('returns a MeshStandardMaterial', () => {
    const mat = createLegoPlasticMaterial({ color: '#ff0000' });
    expect(mat).toBeInstanceOf(THREE.MeshStandardMaterial);
  });

  it('material roughness is 0.25', () => {
    const mat = createLegoPlasticMaterial({ color: '#00ff00' });
    expect(mat.roughness).toBe(0.25);
  });

  it('material metalness is 0.0', () => {
    const mat = createLegoPlasticMaterial({ color: '#0000ff' });
    expect(mat.metalness).toBe(0.0);
  });

  it('material color matches input hex', () => {
    const mat = createLegoPlasticMaterial({ color: '#ff0000' });
    const expected = new THREE.Color('#ff0000');
    expect(mat.color.r).toBeCloseTo(expected.r, 5);
    expect(mat.color.g).toBeCloseTo(expected.g, 5);
    expect(mat.color.b).toBeCloseTo(expected.b, 5);
  });

  it('transparent option is applied', () => {
    const mat = createLegoPlasticMaterial({ color: '#ffffff', transparent: true, opacity: 0.5 });
    expect(mat.transparent).toBe(true);
    expect(mat.opacity).toBe(0.5);
  });

  it('defaults to opaque when transparent is not set', () => {
    const mat = createLegoPlasticMaterial({ color: '#ffffff' });
    expect(mat.transparent).toBe(false);
    expect(mat.opacity).toBe(1.0);
  });
});
