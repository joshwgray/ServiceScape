import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { tokens } from '../../styles/tokens';
import { computeBubblePosition, ComputedPosition } from './utils/computeBubblePosition';

export interface SpeechBubbleProps {
  x: number;
  y: number;
  visible: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}

/** Duration (ms) that the fade-out transition takes before the component unmounts. */
const FADE_OUT_MS = 200;

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({ x, y, visible, onClose, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<ComputedPosition>({ left: 0, top: 0, tailPlacement: 'left', tailOffset: 0 });
  const [isCalculated, setIsCalculated] = useState(false);

  // isMounted controls whether the DOM element is present at all.
  // Starts false when visible=false (never shown), starts true when visible=true.
  const [isMounted, setIsMounted] = useState(visible);
  // isFading is true while the opacity-0 transition is running before unmount.
  const [isFading, setIsFading] = useState(false);

  // When visible prop changes, manage the mount/fade lifecycle.
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (visible) {
      // Re-mount and cancel any ongoing fade
      setIsMounted(true);
      setIsFading(false);
    } else if (isMounted) {
      // Was shown — start fade-out, then unmount after transition completes
      setIsFading(true);
      const timer = setTimeout(() => {
        setIsMounted(false);
        setIsFading(false);
      }, FADE_OUT_MS);
      cleanup = () => clearTimeout(timer);
    }
    // If not mounted and visible=false, nothing to do
    return cleanup;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useLayoutEffect(() => {
    if (!isMounted || isFading || !ref.current) return;

    const el = ref.current;
    const { width, height } = el.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const computed = computeBubblePosition(
        { x, y }, 
        { width, height }, 
        { width: viewportWidth, height: viewportHeight }
    );

    setPosition(computed);
    setIsCalculated(true);

  }, [x, y, isMounted, isFading, children]);

  if (!isMounted) return null;

  const arrowSize = 10;
  const { left, top, tailPlacement, tailOffset } = position;

  // Render tail styles based on placement
  const getTailBorderStyles = (isBorder: boolean) => {
    const color = isBorder ? tokens.colors.border : tokens.colors.backgroundOverlay;
    // Tail placement 'left' means bubble is to the Right of anchor. Tail is on the Left edge.
    // Tail placement 'right' means Bubble is to the Left of anchor. Tail is on the Right edge.

    // If 'left' -> Tail on LEFT edge. Border-right visible (points Left).
    // If 'right' -> Tail on RIGHT edge. Border-left visible (points Right).
    
    // Check border styles logic:
    // border-style solid.
    // border-width: T R B L.
    // border-color: T R B L.

    // Left Edge Tail (Bubble on Right):
    // Tail needs to protrude to the LEFT (negative left).
    // Triangle points LEFT. To make triangle point Left, we need Right border colored.
    // Wait. border-right-color makes a triangle pointing LEFT?
    // Yes.
    // So if side === 'left':
    // border-width: size size size 0 ?? No.
    // If border-right is visible, we need top/bottom transparent.
    // Width: size (top), size (right), size (bottom), 0 (left).
    // Color: trans, color, trans, trans.
    
    // My code previously:
    // if `side === 'left'` -> `borderWidth = size size size 0`. `borderColor = trans color trans trans`.
    // This looks correct for Pointing Left.
    
    // Right Edge Tail (Bubble on Left):
    // Points RIGHT. Left border visible.
    // Width: size 0 size size.
    // Color: trans trans trans color.
    
    // Top Edge Tail (Bubble below):
    // Points UP. Bottom border visible.
    // Width: 0 size size size.
    // Color: trans trans color trans.
    
    // Bottom Edge Tail (Bubble above):
    // Points DOWN. Top border visible.
    // Width: size size 0 size.
    // Color: color trans trans trans.

    const size = arrowSize;
    const side = tailPlacement;
    
    const style: React.CSSProperties = {
        position: 'absolute',
        width: 0,
        height: 0,
        borderStyle: 'solid',
        zIndex: isBorder ? 1001 : 1002,
        pointerEvents: 'none',
    };

    if (side === 'left') { // Tail on LEFT edge of bubble (Bubble is to the right of anchor)
        style.left = -size + (isBorder ? 0 : 1);
        style.top = tailOffset - size;
        style.borderWidth = `${size}px ${size}px ${size}px 0`;
        style.borderColor = `transparent ${color} transparent transparent`;
    } else if (side === 'right') { // Tail on RIGHT edge of bubble (Bubble is to the left of anchor)
        style.right = -size + (isBorder ? 0 : 1);
        style.top = tailOffset - size;
        style.borderWidth = `${size}px 0 ${size}px ${size}px`;
        style.borderColor = `transparent transparent transparent ${color}`;
    } else if (side === 'top') { // Tail on TOP edge of bubble (Bubble is below anchor)
        style.top = -size + (isBorder ? 0 : 1);
        style.left = tailOffset - size;
        style.borderWidth = `0 ${size}px ${size}px ${size}px`;
        style.borderColor = `transparent transparent ${color} transparent`;
    } else if (side === 'bottom') { // Tail on BOTTOM edge of bubble (Bubble is above anchor)
        style.bottom = -size + (isBorder ? 0 : 1);
        style.left = tailOffset - size;
        style.borderWidth = `${size}px ${size}px 0 ${size}px`;
        style.borderColor = `${color} transparent transparent transparent`;
    }
    return style;
  };

  return (
    <>
      <div
        ref={ref}
        data-testid="speech-bubble-outer"
        style={{
          position: 'absolute',
          left,
          top,
          width: 300,
          maxHeight: 'calc(100vh - 40px)',
          backgroundColor: tokens.colors.backgroundOverlay,
          color: tokens.colors.text.primary,
          borderRadius: 8,
          boxShadow: tokens.colors.shadow.floating,
          backdropFilter: 'blur(4px)',
          border: `1px solid ${tokens.colors.border}`,
          pointerEvents: isFading ? 'none' : 'auto',
          padding: 0, // Remove padding from outer container
          zIndex: 1000,
          opacity: isFading ? 0 : (isCalculated ? 1 : 0),
          transition: 'left 0.15s ease-out, top 0.15s ease-out, opacity 0.2s ease-in-out',
        }}
      >
        {/* Tail (Triangle) Border */}
        <div data-testid="tail-border" style={getTailBorderStyles(true)} />
        {/* Tail (Triangle) Background */}
        <div data-testid="tail-background" style={getTailBorderStyles(false)} />

        {onClose && (
          <button
            type="button"
            aria-label="Close details"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 8, // Adjusted for padding moved to inner
              right: 8,
              background: 'none',
              border: 'none',
              color: tokens.colors.text.secondary,
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: 4,
              lineHeight: 1,
              zIndex: 1003,
            }}
          >
            ×
          </button>
        )}

        {/* Scrollable Content Wrapper */}
        <div data-testid="scroll-container" style={{
          maxHeight: 'calc(100vh - 42px)', // Adjusted for border
          overflowY: 'auto',
          padding: 16,
          // Remove position: relative to let close button position against outer container
        }}>
          <div style={{ paddingRight: 20 }}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
};
