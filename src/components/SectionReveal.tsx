/**
 * SectionReveal Component
 * 
 * Wraps page sections to provide coordinated entrance animations
 * triggered by the RevealContext after the preloader completes.
 * 
 * Uses Framer Motion for smooth opacity and transform transitions.
 * The first few sections receive staggered delays for a cascade effect;
 * sections beyond the viewport reveal immediately to avoid artificial waits.
 * 
 * @warning Do NOT wrap components using GSAP ScrollTrigger with `pin: true`.
 * The Framer Motion layout animations conflict with GSAP pinning.
 * Use `skipRevealWrapper: true` in NAVIGATION_SECTIONS config instead.
 * 
 * @example
 * // Standard usage with stagger
 * <SectionReveal index={0}>
 *   <HeroSection />
 * </SectionReveal>
 * 
 * @example
 * // Custom base delay for first section
 * <SectionReveal index={0} baseDelay={0}>
 *   <HeroSection />
 * </SectionReveal>
 */

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useReveal } from '@/contexts/RevealContext';
import { DURATION, DELAY, STAGGER, EASING_ARRAY } from '@/constants/animation';

export interface SectionRevealProps {
  /** Content to animate on reveal */
  children: ReactNode;
  /** Section index for stagger calculation (0-based) */
  index: number;
  /** Base delay before animation starts (default: 0.1s) */
  baseDelay?: number;
  /** Delay between each staggered section (default: 0.15s) */
  staggerDelay?: number;
}

/**
 * Maximum number of sections that receive preloader-coordinated stagger.
 * Sections beyond this index use viewport-based triggering instead.
 */
const MAX_STAGGERED_SECTIONS = 2;

const SectionReveal = ({ 
  children, 
  index, 
  baseDelay = DELAY.micro, 
  staggerDelay = STAGGER.wide 
}: SectionRevealProps) => {
  const { isRevealed } = useReveal();
  
  // Above-fold sections: coordinate with preloader reveal
  // Below-fold sections: use viewport-based triggering
  const isAboveFold = index <= MAX_STAGGERED_SECTIONS;
  
  const delay = isAboveFold ? baseDelay + index * staggerDelay : 0;

  // Above-fold: animate when preloader completes
  if (isAboveFold) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
        transition={{
          duration: DURATION.reveal,
          delay,
          ease: EASING_ARRAY.smooth,
        }}
      >
        {children}
      </motion.div>
    );
  }

  // Below-fold: animate when scrolled into viewport
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{
        duration: DURATION.reveal,
        ease: EASING_ARRAY.smooth,
      }}
    >
      {children}
    </motion.div>
  );
};

export default SectionReveal;
