import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useReveal } from '@/contexts/RevealContext';

interface SectionRevealProps {
  children: ReactNode;
  index: number;
  baseDelay?: number;
  staggerDelay?: number;
}

const SectionReveal = ({ 
  children, 
  index, 
  baseDelay = 0.1, 
  staggerDelay = 0.15 
}: SectionRevealProps) => {
  const { isRevealed } = useReveal();
  
  // Calculate delay based on index - only first few sections get stagger
  // Beyond viewport, sections reveal via scroll (no artificial delay)
  const maxStaggeredSections = 2;
  const delay = index <= maxStaggeredSections 
    ? baseDelay + index * staggerDelay 
    : baseDelay;

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
};

export default SectionReveal;
