import '@testing-library/jest-dom/vitest';

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

const NOISY_TEST_MESSAGES = [
  'is unrecognized in this browser',
  'is using incorrect casing',
  'prop on a DOM element',
  'non-boolean attribute',
  'If you want to write it to the DOM',
  'React does not recognize the `renderOrder` prop',
  'React does not recognize the `depthWrite` prop',
  'React does not recognize the `emissiveIntensity` prop',
  'Warning: An update to',
  'Multiple instances of Three.js being imported.',
];

function shouldSuppressConsoleMessage(args: unknown[]): boolean {
  const message = args
    .filter((arg): arg is string => typeof arg === 'string')
    .join(' ');

  return NOISY_TEST_MESSAGES.some((noisyMessage) => message.includes(noisyMessage));
}

console.error = (...args: unknown[]) => {
  if (shouldSuppressConsoleMessage(args)) {
    return;
  }
  originalConsoleError(...args);
};

console.warn = (...args: unknown[]) => {
  if (shouldSuppressConsoleMessage(args)) {
    return;
  }
  originalConsoleWarn(...args);
};

// ResizeObserver mock
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const noop = () => {};

// Mock HTMLCanvasElement.prototype.getContext for R3F
HTMLCanvasElement.prototype.getContext = ((contextId: string) => {
    if (contextId === 'webgl' || contextId === 'experimental-webgl') {
        return {
            getExtension: noop,
            getParameter: noop,
            enable: noop,
            disable: noop,
            clearColor: noop,
            createBuffer: noop,
            createVertexArray: noop,
            bindBuffer: noop,
            bindVertexArray: noop,
            vertexAttribPointer: noop,
            enableVertexAttribArray: noop,
            clear: noop,
            viewport: noop,
            createShader: noop,
            shaderSource: noop,
            compileShader: noop,
            createProgram: noop,
            attachShader: noop,
            linkProgram: noop,
            useProgram: noop,
            getShaderParameter: noop,
            getProgramParameter: noop,
            deleteShader: noop,
            deleteProgram: noop,
            getShaderInfoLog: noop,
            getProgramInfoLog: noop,
        } as unknown as WebGLRenderingContext;
    }
    return null;
}) as typeof HTMLCanvasElement.prototype.getContext;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: noop, // deprecated
    removeListener: noop, // deprecated
    addEventListener: noop,
    removeEventListener: noop,
    dispatchEvent: noop,
  }),
});
