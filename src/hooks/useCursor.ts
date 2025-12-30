/**
 * useCursor Hook
 * 
 * Provides raw cursor tracking for Framer Motion spring animations.
 * Position updates are immediate — spring physics in CustomCursor.tsx
 * handle all smoothing. This eliminates dual-smoothing "sludge."
 * 
 * @returns Object containing cursor position and hover state
 * 
 * @example
 * const { position, isHovering } = useCursor();
 * // position.x, position.y are raw screen coordinates
 * // Spring smoothing is applied in the consuming component
 */

import { useEffect, useState } from 'react';
import { useMotionConfigSafe } from '@/contexts/MotionConfigContext';

interface CursorPosition {
  x: number;
  y: number;
}

export const useCursor = () => {
  const [position, setPosition] = useState<CursorPosition>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  
  const { isReducedMotion } = useMotionConfigSafe();

  useEffect(() => {
    // Direct position update — no lerp, springs handle smoothing
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.closest('a') || target.closest('button')) {
        setIsHovering(true);
      }
    };

    const handleMouseOut = () => {
      setIsHovering(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, [isReducedMotion]);

  return { position, isHovering };
};
