/**
 * useCursor Hook
 * 
 * Provides smooth cursor tracking with lerp interpolation.
 * Detects hover states on interactive elements.
 * 
 * @returns Object containing cursor position and hover state
 * 
 * @example
 * const { position, isHovering } = useCursor();
 * // position.x, position.y are lerp-interpolated screen coordinates
 * // isHovering is true when over links/buttons
 */

import { useEffect, useRef, useState } from 'react';
import { lerp } from '@/lib/math';
import { CURSOR } from '@/constants/animation';

interface CursorPosition {
  x: number;
  y: number;
}

export const useCursor = () => {
  const [position, setPosition] = useState<CursorPosition>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const targetRef = useRef<CursorPosition>({ x: 0, y: 0 });
  const currentRef = useRef<CursorPosition>({ x: 0, y: 0 });
  const rafRef = useRef<number>();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
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

    const animate = () => {
      currentRef.current.x = lerp(currentRef.current.x, targetRef.current.x, CURSOR.lerpFactor);
      currentRef.current.y = lerp(currentRef.current.y, targetRef.current.y, CURSOR.lerpFactor);
      
      setPosition({ ...currentRef.current });
      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { position, isHovering };
};
