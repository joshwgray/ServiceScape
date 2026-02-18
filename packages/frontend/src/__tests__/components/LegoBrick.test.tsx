import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { LegoBrick } from '../../components/LegoBrick';
import { getStudVariant, getStudPositions, type StudVariant } from '../../utils/legoGeometry';

// Mock @react-three/drei to avoid WebGL errors in jsdom
vi.mock('@react-three/drei', () => ({
  Text: ({ children }: any) => <div data-testid="drei-text">{children}</div>,
}));

describe('getStudVariant determinism', () => {
  it('returns the same variant for the same ID every time', () => {
    const id = 'my-service-id';
    const results = Array.from({ length: 10 }, () => getStudVariant(id));
    expect(new Set(results).size).toBe(1);
  });

  it('returns only valid variants', () => {
    const valid: StudVariant[] = ['2x2', '3x2', '4x2'];
    const ids = ['foo', 'bar', 'baz', 'qux', 'quux', 'corge', 'grault', 'garply', 'waldo'];
    for (const id of ids) {
      expect(valid).toContain(getStudVariant(id));
    }
  });
});

describe('stud count matches variant', () => {
  it('2x2 variant has 4 studs', () => {
    const positions = getStudPositions('2x2', 1.8, 1.8);
    expect(positions).toHaveLength(4);
  });

  it('3x2 variant has 6 studs', () => {
    const positions = getStudPositions('3x2', 1.8, 1.8);
    expect(positions).toHaveLength(6);
  });

  it('4x2 variant has 8 studs', () => {
    const positions = getStudPositions('4x2', 1.8, 1.8);
    expect(positions).toHaveLength(8);
  });
});

describe('LegoBrick component', () => {
  // We test the component with a mock R3F environment
  // The mesh/geometry elements aren't real DOM, but we can verify that
  // the component imports and renders without throwing

  it('renders without crashing for default props', () => {
    expect(() =>
      render(
        React.createElement(LegoBrick, {
          color: '#ff0000',
        })
      )
    ).not.toThrow();
  });

  it('renders without crashing with explicit studVariant', () => {
    const variants: StudVariant[] = ['2x2', '3x2', '4x2'];
    for (const studVariant of variants) {
      expect(() =>
        render(
          React.createElement(LegoBrick, {
            color: '#00ff00',
            studVariant,
          })
        )
      ).not.toThrow();
    }
  });
});
