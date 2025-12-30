import { useCursor } from '@/hooks/useCursor';
import { motion } from 'framer-motion';

const CustomCursor = () => {
  const { position, isHovering, prefersReducedMotion } = useCursor();

  // Hide on touch devices or for reduced motion users
  if (typeof window !== 'undefined' && ('ontouchstart' in window || prefersReducedMotion)) {
    return null;
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
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 28,
          mass: 0.5,
        }}
      />
      <motion.div
        className="cursor-ring hidden md:block"
        animate={{
          x: position.x,
          y: position.y,
          scale: isHovering ? 1.5 : 1,
          opacity: isHovering ? 0 : 0.5,
        }}
        transition={{
          type: 'spring',
          stiffness: 150,
          damping: 15,
          mass: 0.1,
        }}
      />
    </>
  );
};

export default CustomCursor;
