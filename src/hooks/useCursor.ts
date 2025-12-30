/**
 * useCursor Hook
 * 
 * Provides cursor position tracking with hover state detection.
 * Position is passed directly to consumers; Framer Motion springs
 * handle all smoothing (single authority, no lerp).
 * 
 * @returns Object containing cursor position and hover state
 * 
 * @example
 * const { position, isHovering } = useCursor();
 * // position.x, position.y are raw screen coordinates
 * // Apply Framer Motion springs in your component for smoothing
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
    const handleMouseMove = (e: MouseEvent) => {
      // Direct position update - springs handle smoothing
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
  }, []);

  return { position, isHovering, isReducedMotion };
};
