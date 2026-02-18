import { describe, it, expect } from 'vitest';
import { getDependencyStyle } from '../edgeStyles';
import { DEPENDENCY_TYPES } from '@servicescape/shared';

describe('edgeStyles', () => {
  it('should return correct style for DECLARED dependency', () => {
    const style = getDependencyStyle(DEPENDENCY_TYPES.DECLARED);
    expect(style).toEqual({
      color: '#3b82f6',
      dashed: false,
      opacity: 0.8,
    });
  });

  it('should return correct style for OBSERVED dependency', () => {
    const style = getDependencyStyle(DEPENDENCY_TYPES.OBSERVED);
    expect(style).toEqual({
      color: '#f97316',
      dashed: true,
      opacity: 0.6,
    });
  });

  it('should return default style for unknown type', () => {
    // @ts-ignore
    const style = getDependencyStyle('UNKNOWN');
    expect(style).toEqual({
      color: '#9ca3af',
      dashed: false,
      opacity: 0.5,
    });
  });
});
