import { ReactNode, useRef } from 'react';
import { motion, useInView, Variants } from 'framer-motion';

type RevealVariant = 'fadeUp' | 'fadeDown' | 'fadeLeft' | 'fadeRight' | 'scale' | 'blur' | 'slideUp' | 'rotate';

interface ScrollRevealProps {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  duration?: number;
  once?: boolean;
  amount?: number;
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

// Stagger container for child elements
interface StaggerContainerProps {
  children: ReactNode;
  staggerDelay?: number;
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

// Child item for stagger container
interface StaggerItemProps {
  children: ReactNode;
  variant?: RevealVariant;
  className?: string;
}

export const StaggerItem = ({
  children,
  variant = 'fadeUp',
  className = '',
}: StaggerItemProps) => {
  return (
    <motion.div
      variants={variants[variant]}
      transition={{
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
