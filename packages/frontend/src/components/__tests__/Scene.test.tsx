import { describe, it, expect, vi } from 'vitest';
import Scene from '../Scene';

// Mock ResizeObserver for Canvas
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

describe('Scene', () => {
  it('is defined', () => {
    expect(Scene).toBeDefined();
  });
});
