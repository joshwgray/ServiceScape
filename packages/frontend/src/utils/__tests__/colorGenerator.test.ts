import { describe, it, expect } from 'vitest';
import { generateColor } from '../colorGenerator';

describe('colorGenerator', () => {
    it('should generate a valid hex color string', () => {
        const color = generateColor('test-id');
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('should generate the same color for the same input', () => {
        const id = 'consistent-id';
        const color1 = generateColor(id);
        const color2 = generateColor(id);
        expect(color1).toBe(color2);
    });

    it('should generate different colors for different inputs', () => {
        const color1 = generateColor('id-1');
        const color2 = generateColor('id-2');
        expect(color1).not.toBe(color2);
    });
});
