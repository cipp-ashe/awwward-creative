import { useCursor } from '@/hooks/useCursor';
import { motion } from 'framer-motion';

/**
 * Unified spring config for magnetic cursor behavior.
 * Both dot and ring share identical physics to eliminate desync.
 */
const CURSOR_SPRING = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
  mass: 0.3,
} as const;

const CustomCursor = () => {
  const { position, isHovering, isReducedMotion } = useCursor();

  // Hide on touch devices or reduced motion
  if (typeof window !== 'undefined' && 'ontouchstart' in window) {
    return null;
  }

  // Reduced motion: instant position, no springs
  if (isReducedMotion) {
    return (
      <>
        <div
          className="cursor-dot hidden md:block"
          style={{
            transform: `translate(${position.x - 4}px, ${position.y - 4}px)`,
          }}
        />
        <div
          className="cursor-ring hidden md:block"
          style={{
            transform: `translate(${position.x - 20}px, ${position.y - 20}px)`,
            opacity: isHovering ? 0 : 0.5,
          }}
        />
      </>
    );
  }

  return (
    <>
      <motion.div
        className="cursor-dot hidden md:block"
        animate={{
          x: position.x,
          y: position.y,
          scale: isHovering ? 2 : 1,
        }}
        transition={CURSOR_SPRING}
      />
      <motion.div
        className="cursor-ring hidden md:block"
        animate={{
          x: position.x,
          y: position.y,
          scale: isHovering ? 1.5 : 1,
          opacity: isHovering ? 0 : 0.5,
        }}
        transition={CURSOR_SPRING}
      />
    </>
  );
};

export default CustomCursor;
