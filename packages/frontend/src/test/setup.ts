import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// ResizeObserver mock
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock HTMLCanvasElement.prototype.getContext for R3F
HTMLCanvasElement.prototype.getContext = vi.fn((contextId: string) => {
    if (contextId === 'webgl' || contextId === 'experimental-webgl') {
        return {
            getExtension: vi.fn(),
            getParameter: vi.fn(),
            enable: vi.fn(),
            disable: vi.fn(),
            clearColor: vi.fn(),
            createBuffer: vi.fn(),
            createVertexArray: vi.fn(),
            bindBuffer: vi.fn(),
            bindVertexArray: vi.fn(),
            vertexAttribPointer: vi.fn(),
            enableVertexAttribArray: vi.fn(),
            clear: vi.fn(),
            viewport: vi.fn(),
            createShader: vi.fn(),
            shaderSource: vi.fn(),
            compileShader: vi.fn(),
            createProgram: vi.fn(),
            attachShader: vi.fn(),
            linkProgram: vi.fn(),
            useProgram: vi.fn(),
            getShaderParameter: vi.fn(),
            getProgramParameter: vi.fn(),
            deleteShader: vi.fn(),
            deleteProgram: vi.fn(),
            getShaderInfoLog: vi.fn(),
            getProgramInfoLog: vi.fn(),
        } as unknown as WebGLRenderingContext;
    }
    return null;
}) as any;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});


