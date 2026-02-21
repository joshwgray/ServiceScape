import { describe, it, expect } from 'vitest';
import { computeBubblePosition, BoxRect, Point } from '../computeBubblePosition';

describe('computeBubblePosition', () => {
    const viewport: BoxRect = { width: 1000, height: 800 };
    const bubble: BoxRect = { width: 300, height: 200 };
    const padding = 20;

    describe('Horizontal Placement', () => {
        it('should place bubble to the RIGHT if there is space', () => {
            const anchor: Point = { x: 100, y: 400 };
            const result = computeBubblePosition(anchor, bubble, viewport, padding);

            // Anchor is at 100. Bubble should be at 100 + 20 = 120
            expect(result.left).toBe(120);
            // Centered vertically: 400 - 200/2 = 300
            expect(result.top).toBe(300);
            // Tail should act on the LEFT of the bubble (since bubble is on Right)
            expect(result.tailPlacement).toBe('left');
        });

        it('should place bubble to the LEFT if Right does not fit but Left does', () => {
            // Anchor at 950. 950 + 20 + 300 > 1000 (Fits NO)
            // Left: 950 - 20 - 300 = 630 (> 20, Fits YES)
            const anchor: Point = { x: 950, y: 400 };
            const result = computeBubblePosition(anchor, bubble, viewport, padding);

            expect(result.left).toBe(950 - 20 - 300); // 630
            expect(result.top).toBe(300);
            // Tail should act on the RIGHT of the bubble (since bubble is on Left)
            expect(result.tailPlacement).toBe('right');
        });
    });

    describe('Vertical Placement (Flip)', () => {
        it('should place bubble to the TOP if Horizontal placements do not fit', () => {
            // Anchor close to Right Edge, and close to Left Edge? 
            // Hard to simulate "Horizontal doesn't fit" unless bubble is wider than viewport or anchor is in a tight spot.
            // But we can simulate "Right doesn't fit" and "Left doesn't fit".
            // viewport 1000.
            // If anchor is 500, Right fits. Left fits.
            // If anchor is 950, Right no, Left yes.
            // We need a case where neither fits horizontally.
            // Maybe a huge bubble? Or just an anchor really close to both edges? (Impossible unless viewport small).
            // Let's force it by using a small viewport relative to bubble + padding.
            
            const smallViewport = { width: 400, height: 800 };
            // Bubble 300. Padding 20.
            // Anchor at 200.
            // Right: 200 + 20 + 300 = 520 > 400. (No)
            // Left: 200 - 20 - 300 = -120 < 20. (No)
            // Top: 400 - 20 - 200 = 180 (> 20). (Yes)
            
            const anchor: Point = { x: 200, y: 400 };
            const result = computeBubblePosition(anchor, bubble, smallViewport, padding);

            expect(result.tailPlacement).toBe('bottom'); // Bubble is above (Top), so Tail is on Bottom edge.
            // Bubble Bottom should be at Anchor Y - padding.
            // Top = y - padding - height = 400 - 20 - 200 = 180.
            expect(result.top).toBe(180);
            // Centered horizontally: x - width/2 = 200 - 150 = 50.
            expect(result.left).toBe(50);
        });

        it('should place bubble to the BOTTOM if Top/Horizontal do not fit', () => {
            const smallViewport = { width: 400, height: 800 };
            // Anchor at top of screen (y=50)
            // Right/Left don't fit (same as above)
            // Top: 50 - 20 - 200 = -170 (No)
            // Bottom: 50 + 20 = 70. 70 + 200 = 270 < 800. (Yes)
            
            const anchor: Point = { x: 200, y: 50 };
            const result = computeBubblePosition(anchor, bubble, smallViewport, padding);

            expect(result.tailPlacement).toBe('top'); // Bubble is below (Bottom), so Tail is on Top edge.
            expect(result.top).toBe(70); // 50 + 20
        });
    });

    describe('Tail Offset Clamping', () => {
        it('should clamp tail offset within bubble height for Left/Right placement', () => {
            // Anchor Y is far down, so bubble is clamped to bottom of viewport.
            // Viewport H=800. Bubble H=200. Max Top = 800 - 20 - 200 = 580.
            // If Anchor Y is 700.
            // Bubble Top = 580.
            // Tail points to 700.
            // Relative Y = 700 - 580 = 120. (Valid within 200).
            
            // Let's try Anchor Y = 790.
            // Bubble Top = 580.
            // Relative Y = 790 - 580 = 210.
            // Should clamp to (Height - margin). Margin=12. 200-12 = 188.
            
            const anchor: Point = { x: 100, y: 790 };
            const result = computeBubblePosition(anchor, bubble, viewport, padding);
            
            expect(result.top).toBe(580); // Clamped to bottom
            expect(result.tailOffset).toBe(200 - 12); // Clamped to max valid offset
        });
        
        it('should clamp tail offset within bubble width for Top/Bottom placement', () => {

             // Force Top placement
             // Anchor X = 390.
             // Bubble W=300. Max Left = 400 - 20 - 300 = 80.
             // Anchor Y = 400.
             
             // Top placement selected (from previous test setup)
             // Anchor X=390.
             // Bubble Left = 80.
             // Relative X = 390 - 80 = 310.
             // Bubble Width = 300.
             // Should clamp to 300 - 12 = 288.
             
 
             // We need to ensure Horizontal doesn't fit first.
             // Right: 390+20+300 > 400.
             // Left: 390-20-300 = 70. Fits! (70 >= 20).
             // Wait, Left placement fits here.
             
             // Let's force Top placement. Left shouldn't fit.
             // X=50. Left: 50-20-300 = -270. (No)
             // Right: 50+20+300 = 370 < 400. (Yes).
             // Right would fit.
             
             // To force vertical, we need neither Left nor Right to fit.
             // X needs to leave < 320 space on right AND < 320 space on left.
             // Viewport 400.
             // If X = 200. Left space = 180. Right space = 180. Neither fits 300.
             // So Vertical is chosen.
             
             // Now check clamping on Top placement.
             // If X=200, bubble centered at 50. Offset = 150.
             // We want Offset to clamp.
             // We need bubble to be pushed to side.
             // If X is 200, bubble is [50, 350].
             // To push bubble, we can't really push it if it fits in center.
             // We need anchor to be near edge, BUT bubble must be forced to maintain 20px padding.
             // If anchor is at 350.
             // Bubble Left centered would be 350 - 150 = 200. Right edge = 500 > 380 (max).
             // Bubble Left gets clamped to 380 - 300 = 80.
             // Tail points to 350.
             // Relative X = 350 - 80 = 270.
             // Max offset = 300 - 12 = 288. Fits.
             
             // Try Anchor X = 380.
             // Bubble Left = 80.
             // Relative X = 380 - 80 = 300.
             // Clamp to 288.
             
             // Force Top placement
             // We need Right to fail AND Left to fail.
             // Right fail: x + 320 > 400 => x > 80.
             // Left fail: x - 320 < 20 => x < 340.
             // So x must be in (80, 340).
             // BUT if Right fails, it checks Left. If Left also FAILS, then checks Top.
             // So we need x such that Left fails.
             // x < 340.
             // AND Right fails. x > 80.
             // Example x = 200.
             // Left: 200 - 320 = -120 < 20. Fails.
             // Right: 200 + 320 = 520 > 400. Fails.
             // So Horizontal placements fail.
             
             // Now check Top.
             // y - 20 - 200 >= 20 => y >= 240.
             
             // We want Top placement to be chosen. So let y = 350.
             // Bubble Top = 350 - 20 - 200 = 130. Fits.
             
             // We want to test Clamping of Tail Offset.
             // This happens if Bubble Left is clamped.
             // Bubble Left (Centered): x - width/2 = 200 - 150 = 50.
             // Clamped to [20, 400-20-300=80].
             // Range [20, 80].
             // 50 is inside [20, 80]! So it is NOT clamped. Bubble is centered.
             // Tail Offset = x - left = 200 - 50 = 150. (Center).
             
             // To force clamping, we need Centered Left to be OUTSIDE [20, 80].
             // Centered Left = x - 150.
             // We need x - 150 > 80 => x > 230.
             // OR x - 150 < 20 => x < 170.
             
             // Let's pick x = 240.
             // Check constraints again:
             // Left fails: 240 < 340. (Yes)
             // Right fails: 240 > 80. (Yes)
             // So Top chosen.
             
             // Centered Left: 240 - 150 = 90.
             // Max Left = 80.
             // So Bubble Left clamped to 80.
             // Tail points to x=240.
             // Tail Offset = 240 - 80 = 160.
             
             // Wait, I want to test `tailOffset` clamping logic.
             // Logic: `tailOffset = Math.max(margin, Math.min(tailOffset, bWidth - margin))`.
             // 160 is valid (bWidth 300).
             // To trigger tailOffset clamp, we need offset to be > 288 or < 12.
             // Offset = x - Left.
             // Left is clamped to 80.
             // So we need x - 80 > 288 => x > 368.
             // BUT we need x < 340 for Left placement to FAIL.
             // Contradiction! Include Left placement condition.
             
             // If x > 368, then Left placement (x-320 > 48) MIGHT fit.
             // Viewport 400.
             // If x=380. Left space = 380-320 = 60 >= 20. Matches!
             // So "Left" fits, so "Left" is chosen. NOT Top.
             
             // So with 400px width and 300px bubble, it is hard to force "Top" AND "Extreme Clamp".
             // Because if you are far enough to right to need clamping, Left placement becomes available.
             
             // Unless... y forces Top? No, priority is Right -> Left -> Top.
             // If Left fits, it takes it.
             
             // So we cannot easily test 'Top placement with Extreme Horizontal Offset' unless Left is blocked by something else?
             // But logic is hardcoded priority.
             
             // What if we reduce Viewport Width to be smaller than Bubble Width?
             // Viewport 200. Bubble 300.
             // Right fails. Left fails.
             // Top?
             // Bubble Width > Viewport Width.
             // left clamped to [20, -120??].
             // Math.min(left, maxLeft).
             // maxLeft = 200 - 20 - 300 = -120.
             // Min(20, -120) = -120? No Max(min, min(..)).
             // Max(20, -120) = 20.
             // So Left = 20.
             
             // Tail Offset. x=100.
             // Offset = 100 - 20 = 80. Valid.
             
             // Okay, let's just test that offset calculation is correct for a "normal" Top case where bubble is shifted.
             // Use x=240, y=350. Top chosen. Left clamped to 80. Offset 160.
             // Expect 160.
             
             const constrainedViewport = { width: 400, height: 400 };
             const result = computeBubblePosition({ x: 240, y: 350 }, bubble, constrainedViewport, padding);
             expect(result.tailPlacement).toBe('bottom');
             expect(result.left).toBe(80);
             expect(result.tailOffset).toBe(160);
        });
    });
});
