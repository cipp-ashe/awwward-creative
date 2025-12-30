/**
 * ScrollReveal Component
 * 
 * Animates children into view when they enter the viewport.
 * Uses Framer Motion's useInView for intersection detection.
 * 
 * Available variants:
 * - fadeUp: Fade in from below (default)
 * - fadeDown: Fade in from above
 * - fadeLeft: Fade in from left
 * - fadeRight: Fade in from right
 * - scale: Scale up from smaller size
 * - blur: Fade in from blurred state
 * - slideUp: Slide up with slight skew
 * - rotate: Rotate in from tilted position
 * 
 * @example
 * <ScrollReveal variant="fadeUp" delay={0.2}>
 *   <Card>Content appears on scroll</Card>
 * </ScrollReveal>
 */

import { ReactNode, useRef, forwardRef } from 'react';
import { motion, useInView, Variants } from 'framer-motion';
import { DURATION, EASING_ARRAY } from '@/constants/animation';

/** Available animation variants for scroll reveal */
export type RevealVariant = 'fadeUp' | 'fadeDown' | 'fadeLeft' | 'fadeRight' | 'scale' | 'blur' | 'slideUp' | 'rotate';

export interface ScrollRevealProps {
  /** Content to animate */
  children: ReactNode;
  /** Animation variant (default: 'fadeUp') */
  variant?: RevealVariant;
  /** Delay before animation starts in seconds */
  delay?: number;
  /** Animation duration in seconds (default: 0.6) */
  duration?: number;
  /** Whether to only animate once (default: true) */
  once?: boolean;
  /** Viewport intersection amount to trigger (0-1, default: 0.3) */
  amount?: number;
  /** Additional CSS classes */
  className?: string;
}

const variants: Record<RevealVariant, Variants> = {
  fadeUp: {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  fadeDown: {
    hidden: { opacity: 0, y: -40 },
    visible: { opacity: 1, y: 0 },
  },
  fadeLeft: {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
  fadeRight: {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  },
  blur: {
    hidden: { opacity: 0, filter: 'blur(10px)' },
    visible: { opacity: 1, filter: 'blur(0px)' },
  },
  slideUp: {
    hidden: { opacity: 0, y: 60, skewY: 2 },
    visible: { opacity: 1, y: 0, skewY: 0 },
  },
  rotate: {
    hidden: { opacity: 0, rotateX: -15, y: 30 },
    visible: { opacity: 1, rotateX: 0, y: 0 },
  },
};

const ScrollReveal = ({
  children,
  variant = 'fadeUp',
  delay = 0,
  duration = 0.6,
  once = true,
  amount = 0.3,
  className = '',
}: ScrollRevealProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants[variant]}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
    </motion.div>
  );
};

/**
 * StaggerContainer Component
 * 
 * Container that staggers the reveal animations of its StaggerItem children.
 * Use with StaggerItem for coordinated entrance animations.
 * 
 * @example
 * <StaggerContainer staggerDelay={0.1}>
 *   <StaggerItem><Card>First</Card></StaggerItem>
 *   <StaggerItem><Card>Second</Card></StaggerItem>
 * </StaggerContainer>
 */
export interface StaggerContainerProps {
  /** StaggerItem children to animate */
  children: ReactNode;
  /** Delay between each child animation in seconds (default: 0.1) */
  staggerDelay?: number;
  /** Additional CSS classes */
  className?: string;
}

export const StaggerContainer = ({
  children,
  staggerDelay = 0.1,
  className = '',
}: StaggerContainerProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * StaggerItem Component
 * 
 * Child element for StaggerContainer that inherits staggered timing.
 * Must be a direct child of StaggerContainer.
 * Supports ref forwarding for Framer Motion animation orchestration.
 * 
 * @example
 * <StaggerItem variant="scale">
 *   <Card>Animated content</Card>
 * </StaggerItem>
 */
export interface StaggerItemProps {
  /** Content to animate */
  children: ReactNode;
  /** Animation variant (default: 'fadeUp') */
  variant?: RevealVariant;
  /** Additional CSS classes */
  className?: string;
}

export const StaggerItem = forwardRef<HTMLDivElement, StaggerItemProps>(
  ({ children, variant = 'fadeUp', className = '' }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={variants[variant]}
        transition={{
          duration: DURATION.medium,
          ease: EASING_ARRAY.smooth,
        }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }
);

StaggerItem.displayName = 'StaggerItem';

export default ScrollReveal;
