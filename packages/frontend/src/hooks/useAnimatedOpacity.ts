import { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Hook that smoothly animates opacity transitions over approximately 200ms
 * @param targetOpacity The desired opacity value (0-1)
 * @returns The current animated opacity value
 */
export function useAnimatedOpacity(targetOpacity: number): number {
  // Clamp target opacity between 0 and 1
  const clampedTarget = Math.max(0, Math.min(1, targetOpacity));
  
  // Track current opacity value
  const [currentOpacity, setCurrentOpacity] = useState(clampedTarget);
  
  // Store target in a ref so we can access it in useFrame without re-subscribing
  const targetRef = useRef(clampedTarget);
  targetRef.current = clampedTarget;
  
  // Animate opacity on each frame
  useFrame((_, delta) => {
    setCurrentOpacity((current) => {
      const target = targetRef.current;
      
      // If we're already at target, no need to animate
      if (Math.abs(current - target) < 0.001) {
        return target;
      }
      
      // Lerp factor: aim for ~200ms transition
      // At 60fps, 200ms = 12 frames
      // For 95% completion in 12 frames: lerpFactor ≈ 1 - 0.05^(1/12) ≈ 0.224
      // 0.224 / 0.016 (delta at 60fps) ≈ 14
      const lerpFactor = Math.min(1, delta * 14); // 14 is tuned for ~200ms at 60fps
      
      const newOpacity = current + (target - current) * lerpFactor;
      
      // Clamp result
      return Math.max(0, Math.min(1, newOpacity));
    });
  });
  
  return currentOpacity;
}
