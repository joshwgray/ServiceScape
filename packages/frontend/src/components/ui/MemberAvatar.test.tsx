import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemberAvatar } from './MemberAvatar';
import '@testing-library/jest-dom';

describe('MemberAvatar', () => {
    it('renders a LEGO minifigure avatar', () => {
        const { container } = render(<MemberAvatar role="Engineer" size={40} />);
        // Check for the presence of elements representing head and body
        const avatar = container.firstChild;
        expect(avatar).toBeInTheDocument();
        expect(avatar).toHaveAttribute('role', 'img');
        expect(avatar).toHaveAttribute('aria-label', 'Engineer avatar');
    });

    it('renders different colors based on role', () => {
        const result = render(<MemberAvatar role="Engineer" />);
        const { container, rerender } = result;

        // Helper to find the body path (it has a fill color, while the mouth fill is 'none')
        const getBodyPath = () => {
            // Note: querySelectorAll returns a NodeList, convert to Array
            const paths = Array.from(container.querySelectorAll('path'));
            // The mouth path has fill="none", so we look for the one that isn't none
            return paths.find(p => p.getAttribute('fill') !== 'none');
        };

        let body = getBodyPath();
        const engineerColor = body?.getAttribute('fill');

        rerender(<MemberAvatar role="Manager" />);
        body = getBodyPath();
        const managerColor = body?.getAttribute('fill');
        
        expect(engineerColor).not.toBe(managerColor);
        expect(engineerColor).toBeTruthy();
        expect(managerColor).toBeTruthy();
    });

    it('renders default color for unknown role', () => {
        const { container } = render(<MemberAvatar role="UnknownRole" />);
        const paths = Array.from(container.querySelectorAll('path'));
        const body = paths.find(p => p.getAttribute('fill') !== 'none');
        expect(body).toBeInTheDocument();
    });

    it('applies custom size if provided', () => {
        const { container } = render(<MemberAvatar role="Designer" size={60} />);
        const avatar = container.firstChild as HTMLElement;
        expect(avatar.style.width).toBe('60px');
        expect(avatar.style.height).toBe('60px');
    });
});
