import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { SpeechBubble } from '../SpeechBubble';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('SpeechBubble Integration', () => {
    const defaultProps = {
        x: 500,
        y: 400,
        visible: true,
        onClose: vi.fn(),
        children: <div>Content</div>
    };

    // Store original implementation
    const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock getBoundingClientRect
        Element.prototype.getBoundingClientRect = vi.fn(() => ({
            width: 300,
            height: 200,
            top: 0,
            left: 0,
            right: 300,
            bottom: 200,
            x: 0,
            y: 0,
            toJSON: () => {},
        })) as any;
        
        // Mock Viewport
        global.innerWidth = 1000;
        global.innerHeight = 800;
    });

    afterEach(() => {
        Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    });

    it('renders when visible is true', () => {
        render(<SpeechBubble {...defaultProps} />);
        expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('does not render when visible is false', () => {
        render(<SpeechBubble {...defaultProps} visible={false} />);
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
        render(<SpeechBubble {...defaultProps} />);
        const closeButton = screen.getByLabelText('Close details');
        fireEvent.click(closeButton);
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    describe('Positioning and Tail Orientation', () => {
        it('positions Bubble to the RIGHT (default) and Tail on LEFT edge', async () => {
            // Anchor 500, 400. Bubble 300x200.
            // Right fits: 500+20 = 520. 520+300=820 < 1000.
            // TailPlacement = 'left' (Bubble on Right).
            render(<SpeechBubble {...defaultProps} />);
            
            const bubble = screen.getByTestId('speech-bubble-outer');
            
            await waitFor(() => {
                expect(bubble).toHaveStyle({
                    left: '520px', // 500 + 20
                    top: '300px'   // 400 - 100
                });
            });

            const tailBorder = screen.getByTestId('tail-border');
            // Tail should be on the LEFT edge.
            // side 'left' -> style.left negative.
            // borderRight visible.
            await waitFor(() => {
                 expect(tailBorder).toHaveStyle('left: -10px');
                 expect(tailBorder).toHaveStyle('border-width: 10px 10px 10px 0px');
            });
        });

        it('positions Bubble to the LEFT and Tail on RIGHT edge when right fails', async () => {
            // Anchor 900. Right: 920+300 > 1000.
            // Left: 900-20-300 = 580. Fits.
            // TailPlacement = 'right' (Bubble on Left).
            render(<SpeechBubble {...defaultProps} x={900} />);
            
            const bubble = screen.getByTestId('speech-bubble-outer');
            
            await waitFor(() => {
                expect(bubble).toHaveStyle({
                    left: '580px',
                    top: '300px'
                });
            });

            const tailBorder = screen.getByTestId('tail-border');
            await waitFor(() => {
                expect(tailBorder).toHaveStyle('right: -10px');
                expect(tailBorder).toHaveStyle('border-width: 10px 0px 10px 10px');
            });
        });

        it('positions Bubble to the TOP and Tail on BOTTOM edge (Flip Vertical)', async () => {
            // Force Vertical. Small viewport width.
            global.innerWidth = 400; 
            // Anchor 200, 400.
            // Right: 220+300=520 > 380. (Fail)
            // Left: 180-300 = -120. (Fail)
            // Top: 400-20-200 = 180. Fits.
            // TailPlacement = 'bottom' (Bubble on Top).
            
            render(<SpeechBubble {...defaultProps} x={200} y={400} />);
            
            const bubble = screen.getByTestId('speech-bubble-outer');
            
            await waitFor(() => {
                expect(bubble).toHaveStyle({
                    top: '180px',
                    left: '50px' // Center horizontally: 200 - 150 = 50.
                });
            });

            const tailBorder = screen.getByTestId('tail-border');
            await waitFor(() => {
                expect(tailBorder).toHaveStyle('bottom: -10px');
                expect(tailBorder).toHaveStyle('border-width: 10px 10px 0px 10px');
            });
        });

        it('positions Bubble to the BOTTOM and Tail on TOP edge (Flip Vertical)', async () => {
            global.innerWidth = 400; 
            // Anchor 200, 100 (Top of screen).
            // Top: 100-20-200 = -120. (Fail)
            // Bottom: 100+20 = 120. Fits.
            // TailPlacement = 'top' (Bubble on Bottom).
            
            render(<SpeechBubble {...defaultProps} x={200} y={100} />);
            
            const bubble = screen.getByTestId('speech-bubble-outer');
            
            await waitFor(() => {
                expect(bubble).toHaveStyle({
                    top: '120px',
                    left: '50px'
                });
            });

            const tailBorder = screen.getByTestId('tail-border');
            await waitFor(() => {
                expect(tailBorder).toHaveStyle('top: -10px');
                expect(tailBorder).toHaveStyle('border-width: 0px 10px 10px 10px');
            });
        });
    });

    // Phase 5: Smooth transitions and fade behavior
    describe('CSS Transitions and Fade Behavior', () => {
        it('applies CSS transition on left and top for smooth position tracking', async () => {
            render(<SpeechBubble {...defaultProps} />);

            await waitFor(() => {
                const bubble = screen.getByTestId('speech-bubble-outer');
                expect(bubble.style.transition).toContain('left');
                expect(bubble.style.transition).toContain('top');
            });
        });

        it('applies CSS transition on opacity', async () => {
            render(<SpeechBubble {...defaultProps} />);

            await waitFor(() => {
                const bubble = screen.getByTestId('speech-bubble-outer');
                expect(bubble.style.transition).toContain('opacity');
            });
        });

        it('fades out by keeping bubble in DOM with opacity 0 when visible changes from true to false', async () => {
            const { rerender } = render(<SpeechBubble {...defaultProps} visible={true} />);

            // Confirm initially rendered
            await waitFor(() => {
                expect(screen.getByTestId('speech-bubble-outer')).toBeInTheDocument();
            });

            // Transition to not visible
            act(() => {
                rerender(<SpeechBubble {...defaultProps} visible={false} />);
            });

            // Bubble should still be in DOM but with opacity 0 (fading out)
            await waitFor(() => {
                const bubble = screen.queryByTestId('speech-bubble-outer');
                expect(bubble).toBeInTheDocument();
                expect(bubble?.style.opacity).toBe('0');
            });
        });

        it('makes bubble non-interactive (pointerEvents: none) when fading out', async () => {
            const { rerender } = render(<SpeechBubble {...defaultProps} visible={true} />);

            await waitFor(() => {
                expect(screen.getByTestId('speech-bubble-outer')).toBeInTheDocument();
            });

            act(() => {
                rerender(<SpeechBubble {...defaultProps} visible={false} />);
            });

            await waitFor(() => {
                const bubble = screen.queryByTestId('speech-bubble-outer');
                expect(bubble).toBeInTheDocument();
                expect(bubble?.style.pointerEvents).toBe('none');
            });
        });

        it('does not render at all when initially mounted with visible false (no fade needed)', () => {
            render(<SpeechBubble {...defaultProps} visible={false} />);
            expect(screen.queryByTestId('speech-bubble-outer')).not.toBeInTheDocument();
        });
    });
});
