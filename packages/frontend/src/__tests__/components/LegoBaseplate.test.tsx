import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

// Mock @react-three/drei to avoid WebGL errors in jsdom
vi.mock('@react-three/drei', () => ({
  Text: ({ children }: any) => <div data-testid="drei-text">{children}</div>,
}));

// Import after mocks
import { LegoBaseplate, calculateStudGrid } from '../../components/LegoBaseplate';

describe('calculateStudGrid', () => {
  it('returns correct stud count for a 10×10 plate with spacing 1.0', () => {
    const { cols, rows } = calculateStudGrid(10, 10, 1.0, 50);
    expect(cols * rows).toBe(100);
  });

  it('caps stud grid at maxStuds (2500) for large plates', () => {
    const { cols, rows } = calculateStudGrid(2000, 2000, 1.0, 50);
    expect(cols).toBeLessThanOrEqual(50);
    expect(rows).toBeLessThanOrEqual(50);
    expect(cols * rows).toBeLessThanOrEqual(2500);
  });

  it('returns correct stud count for a 5×8 plate', () => {
    const { cols, rows } = calculateStudGrid(5, 8, 1.0, 50);
    expect(cols).toBe(5);
    expect(rows).toBe(8);
  });
});

describe('LegoBaseplate component', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(
        React.createElement(LegoBaseplate, {
          width: 10,
          depth: 10,
          color: '#00A650',
        })
      )
    ).not.toThrow();
  });

  it('renders without crashing with explicit dimensions', () => {
    expect(() =>
      render(
        React.createElement(LegoBaseplate, {
          width: 20,
          depth: 30,
          thickness: 0.3,
          color: '#006CB7',
          studColor: '#005588',
          position: [0, 0.15, 0],
        })
      )
    ).not.toThrow();
  });

  it('renders without crashing for world baseplate size', () => {
    expect(() =>
      render(
        React.createElement(LegoBaseplate, {
          width: 2000,
          depth: 2000,
          color: '#00A650',
        })
      )
    ).not.toThrow();
  });
});
