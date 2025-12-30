/**
 * CustomCursor Component
 * 
 * Unified spring physics for dot and ring.
 * Both elements use identical spring config to move in visual unison.
 * The ring has slight scale/opacity variation for depth, but same motion.
 * 
 * Spring config rationale:
 * - stiffness: 400 — snappy, magnetic feel
 * - damping: 25 — minimal overshoot on direction change
 * - mass: 0.3 — light, responsive
 */

import { useCursor } from '@/hooks/useCursor';
import { motion } from 'framer-motion';

// Unified spring config — magnetic tethering, not heavy lag
const SPRING_CONFIG = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 25,
  mass: 0.3,
};

const CustomCursor = () => {
  const { position, isHovering } = useCursor();

  // Hide on touch devices
  if (typeof window !== 'undefined' && 'ontouchstart' in window) {
    return null;
  }

  return (
    <>
      {/* Dot - primary cursor indicator */}
      <motion.div
        className="cursor-dot hidden md:block"
        animate={{
          x: position.x,
          y: position.y,
          scale: isHovering ? 2 : 1,
        }}
        transition={SPRING_CONFIG}
      />
      
      {/* Ring - secondary indicator, same motion physics */}
      <motion.div
        className="cursor-ring hidden md:block"
        animate={{
          x: position.x,
          y: position.y,
          scale: isHovering ? 1.5 : 1,
          opacity: isHovering ? 0 : 0.5,
        }}
        transition={SPRING_CONFIG}
      />
    </>
  );
};

export default CustomCursor;
