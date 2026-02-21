export type TailPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface BoxRect {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface ComputedPosition {
  left: number;
  top: number;
  tailPlacement: TailPlacement; // The side of the bubble where the tail is attached
  tailOffset: number; // Distance from the top-left corner of the bubble along the side
}

export const computeBubblePosition = (
  anchor: Point,
  bubble: BoxRect,
  viewport: BoxRect,
  padding: number = 20
): ComputedPosition => {
  const { width: bWidth, height: bHeight } = bubble;
  const { width: vWidth, height: vHeight } = viewport;
  const { x, y } = anchor;

  // Defaults
  let left = 0;
  let top = 0;
  let tailPlacement: TailPlacement = 'left';
  let tailOffset = 0;

  // Try placing to the RIGHT
  // x is the anchor point. We want bubble to be at x + padding
  const rightLeft = x + padding;
  const rightFits = rightLeft + bWidth <= vWidth - padding;

  // Try placing to the LEFT
  const leftLeft = x - padding - bWidth;
  const leftFits = leftLeft >= padding;

  // Try placing TOP
  const topTop = y - padding - bHeight;
  const topFits = topTop >= padding;

  // Try placing BOTTOM
  const bottomTop = y + padding;
  const bottomFits = bottomTop + bHeight <= vHeight - padding;

  // Decision logic
  // Priority: Right -> Left -> Top -> Bottom (or based on space)
  
  // Actually, horizontal preferred?
  // Let's stick to the requested behavior: "support vertical flipping (above/below anchor)".
  // And "Tail renders to support top/bottom orientation".
  
  // Let's decide best fit.
  
  if (rightFits) {
      left = rightLeft;
      tailPlacement = 'left'; 
      // Center vertically around y
      top = y - bHeight / 2;
  } else if (leftFits) {
      left = leftLeft;
      tailPlacement = 'right';
      top = y - bHeight / 2;
  } else if (topFits) {
      top = topTop;
      tailPlacement = 'bottom';
      // Center horizontally around x
      left = x - bWidth / 2;
  } else if (bottomFits) {
      top = bottomTop;
      tailPlacement = 'top';
      left = x - bWidth / 2;
  } else {
      // Fallback: Simplest valid position (Right, clamped)
      left = rightLeft;
      tailPlacement = 'left';
      top = y - bHeight / 2;
      
      // If we are vastly out of bounds, maybe stick to center or clamp heavily?
      // Let's just stick to the flip logic which is robust enough for now.
      // If none fit perfectly, pick the one with *most* visibility or default to right/bottom.
      if (x > vWidth / 2) {
          left = Math.max(padding, x - padding - bWidth);
          tailPlacement = 'right';
      } else {
          left = Math.min(vWidth - padding - bWidth, x + padding);
          tailPlacement = 'left';
      }
  }

  // ---------------------------------------------------------
  // Vertical Clamping (for Left/Right placement)
  // ---------------------------------------------------------
  // If we are placed Left or Right, we need to clamp Top.
  if (tailPlacement === 'left' || tailPlacement === 'right') {
      const minTop = padding;
      const maxTop = vHeight - padding - bHeight;
      top = Math.max(minTop, Math.min(top, maxTop));
      
      // Calculate Tail Offset (Y relative to Bubble Top)
      // The anchor Y is where the tail should point to.
      // tailOffset is how far down from the top of the bubble the tail starts.
      // Tail points to `y`. Bubble top is `top`.
      tailOffset = y - top;
  }

  // ---------------------------------------------------------
  // Horizontal Clamping (for Top/Bottom placement)
  // ---------------------------------------------------------
  if (tailPlacement === 'top' || tailPlacement === 'bottom') {
      const minLeft = padding;
      const maxLeft = vWidth - padding - bWidth;
      left = Math.max(minLeft, Math.min(left, maxLeft));

      // Calculate Tail Offset (X relative to Bubble Left)
      tailOffset = x - left;
  }
  
  // Clamp tail offset to be within the bubble (with some border radius margin)
  // Assume border radius approx 8-12px.
  const margin = 12;
  if (tailPlacement === 'left' || tailPlacement === 'right') {
     tailOffset = Math.max(margin, Math.min(tailOffset, bHeight - margin));
  } else {
     tailOffset = Math.max(margin, Math.min(tailOffset, bWidth - margin));
  }

  return { left, top, tailPlacement, tailOffset };
};
