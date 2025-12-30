/**
 * Animation Constants
 * 
 * Centralized animation configuration for consistent motion across the app.
 * All easing curves and durations are defined here to eliminate magic numbers.
 */

// ============================================================================
// EASING CURVES
// ============================================================================

/**
 * CSS cubic-bezier easing functions.
 * Use with CSS transitions and Tailwind classes.
 */
export const EASING = {
  /** Smooth deceleration - primary easing for most animations */
  smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
  /** Overshoot bounce - for playful interactions */
  bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  /** Standard ease-out */
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  /** Standard ease-in */
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  /** Standard ease-in-out */
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

/**
 * Easing as arrays for Framer Motion.
 * Use with `transition={{ ease: EASING_ARRAY.smooth }}`
 */
export const EASING_ARRAY = {
  smooth: [0.16, 1, 0.3, 1] as const,
  bounce: [0.34, 1.56, 0.64, 1] as const,
  out: [0, 0, 0.2, 1] as const,
  in: [0.4, 0, 1, 1] as const,
  inOut: [0.4, 0, 0.2, 1] as const,
} as const;

/**
 * Mathematical easing functions for JS animations.
 * Use with GSAP, requestAnimationFrame, or custom interpolation.
 */
export const EASING_FN = {
  linear: (t: number): number => t,
  easeInQuad: (t: number): number => t * t,
  easeOutQuad: (t: number): number => 1 - (1 - t) * (1 - t),
  easeInOutQuad: (t: number): number => 
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  easeInCubic: (t: number): number => t * t * t,
  easeOutCubic: (t: number): number => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t: number): number => 
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  easeOutQuart: (t: number): number => 1 - Math.pow(1 - t, 4),
  easeOutExpo: (t: number): number => 
    t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  /** Strong plateau ease - shapes hold ~35% at endpoints */
  easeInOutQuart: (t: number): number => 
    t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,
  /** Strongest plateau ease - shapes hold ~40% at endpoints */
  easeInOutQuint: (t: number): number => 
    t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2,
  /** Elastic overshoot - for playful reveals */
  elastic: (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 :
      Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
} as const;

// ============================================================================
// DURATIONS
// ============================================================================

/**
 * Standard duration values in seconds.
 * Use with GSAP and Framer Motion.
 */
export const DURATION = {
  /** Micro interactions - 150ms */
  instant: 0.15,
  /** Fast transitions - 300ms */
  fast: 0.3,
  /** Medium transitions (stagger items) - 500ms */
  medium: 0.5,
  /** Standard transitions - 600ms */
  normal: 0.6,
  /** Section reveal animations - 800ms */
  reveal: 0.8,
  /** Word reveal / hero title - 1000ms */
  word: 1.0,
  /** Slow, dramatic reveals - 1200ms */
  slow: 1.2,
  /** Breathing/pulsing animations - 1500ms */
  pulse: 1.5,
  /** Extra slow for hero animations - 1800ms */
  xslow: 1.8,
} as const;

/**
 * Duration values in milliseconds.
 * Use with setTimeout, CSS, and Tailwind.
 */
export const DURATION_MS = {
  instant: 150,
  fast: 300,
  medium: 500,
  normal: 600,
  reveal: 800,
  slow: 1200,
  xslow: 1800,
} as const;

// ============================================================================
// STAGGER & DELAYS
// ============================================================================

/**
 * Stagger values for sequential animations.
 */
export const STAGGER = {
  /** Tight stagger for lists - 50ms */
  tight: 0.05,
  /** Standard stagger - 100ms */
  normal: 0.1,
  /** Wide stagger for dramatic effect - 200ms */
  wide: 0.2,
} as const;

/**
 * Standard delay values for animation orchestration.
 */
export const DELAY = {
  /** No delay */
  none: 0,
  /** Extra micro delay - 50ms */
  xmicro: 0.05,
  /** Micro delay - 100ms */
  micro: 0.1,
  /** Subtle delay - 150ms */
  subtle: 0.15,
  /** Extra short delay - 200ms */
  xshort: 0.2,
  /** Short delay - 300ms */
  short: 0.3,
  /** Medium delay - 500ms */
  medium: 0.5,
  /** Long delay - 1000ms */
  long: 1,
  /** Extra long delay - 1200ms */
  xlong: 1.2,
  /** Hero scroll indicator delay - 2000ms */
  hero: 2,
} as const;

// ============================================================================
// GSAP SCROLL TRIGGER PRESETS
// ============================================================================

/**
 * GSAP easing strings for ScrollTrigger animations.
 * Use with gsap.to/from: `ease: GSAP_EASE.smooth`
 */
export const GSAP_EASE = {
  /** Smooth deceleration - primary easing */
  smooth: 'power2.out',
  /** Standard ease-in-out */
  inOut: 'power2.inOut',
  /** Stronger deceleration */
  out: 'power3.out',
  /** Elastic overshoot */
  elastic: 'elastic.out(1, 0.5)',
  /** Back overshoot */
  back: 'back.out(1.7)',
  /** Linear for scrub animations */
  none: 'none',
} as const;

/**
 * Type for ScrollTrigger configuration.
 * Partial config that can be spread and overridden.
 */
export type ScrollTriggerPreset = {
  start: string;
  end: string;
  scrub?: boolean | number;
  toggleActions?: string;
  pin?: boolean;
  anticipatePin?: number;
  invalidateOnRefresh?: boolean;
  markers?: boolean;
};

/**
 * Type for complete GSAP animation preset with ScrollTrigger.
 */
export type GsapAnimationPreset = {
  from: Record<string, number | string>;
  to: Record<string, number | string>;
  scrollTrigger: ScrollTriggerPreset;
  duration?: number;
  ease?: string;
  stagger?: number;
};

/**
 * ScrollTrigger configuration presets.
 * Spread into scrollTrigger prop: `scrollTrigger: { trigger, ...SCROLL_TRIGGER.reveal }`
 * 
 * @example
 * gsap.from(element, {
 *   ...GSAP_ANIMATION.fadeUp.from,
 *   scrollTrigger: {
 *     trigger: sectionRef.current,
 *     ...SCROLL_TRIGGER.reveal,
 *   },
 * });
 */
export const SCROLL_TRIGGER = {
  /** Standard reveal - triggers at 80% viewport, reverses on leave */
  reveal: {
    start: 'top 80%',
    end: 'bottom 20%',
    toggleActions: 'play none none reverse',
  },
  
  /** Scrub reveal - smooth 1:1 scroll-to-animation mapping */
  scrubReveal: {
    start: 'top 80%',
    end: 'top 30%',
    scrub: 1,
  },
  
  /** Slow scrub - more gradual scroll-linked animation */
  scrubSlow: {
    start: 'top 80%',
    end: 'bottom 20%',
    scrub: 2,
  },
  
  /** Fast scrub - tighter scroll response */
  scrubFast: {
    start: 'top 70%',
    end: 'top 40%',
    scrub: 0.5,
  },
  
  /** Parallax - full section traversal for parallax effects */
  parallax: {
    start: 'top bottom',
    end: 'bottom top',
    scrub: 1,
  },
  
  /** Hero parallax - starts at top of viewport */
  heroParallax: {
    start: 'top top',
    end: 'bottom top',
    scrub: 1,
  },
  
  /** Pinned section - pins element during scroll */
  pinned: {
    start: 'top top',
    end: 'bottom bottom',
    pin: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
  },
  
  /** Horizontal scroll - for horizontal scroll sections */
  horizontal: {
    start: 'top top',
    end: '+=100%',
    scrub: 1,
    pin: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
  },
  
  /** Progress tracker - for scroll progress callbacks */
  progress: {
    start: 'top bottom',
    end: 'bottom top',
    scrub: true,
  },
  
  /** Sticky content - for sticky/pinned reveals */
  sticky: {
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.5,
  },
} as const;

/**
 * GSAP animation presets with from/to values.
 * Use with gsap.from/to along with SCROLL_TRIGGER presets.
 * 
 * @example
 * gsap.from(element, {
 *   ...GSAP_ANIMATION.fadeUp,
 *   scrollTrigger: { trigger, ...SCROLL_TRIGGER.scrubReveal },
 * });
 */
export const GSAP_ANIMATION = {
  /** Fade in from below */
  fadeUp: {
    opacity: 0,
    y: 60,
    ease: GSAP_EASE.smooth,
  },
  
  /** Fade in from above */
  fadeDown: {
    opacity: 0,
    y: -60,
    ease: GSAP_EASE.smooth,
  },
  
  /** Slide up with skew - dramatic entrance */
  slideUp: {
    opacity: 0,
    y: 100,
    skewY: 5,
    ease: GSAP_EASE.smooth,
  },
  
  /** Scale up reveal */
  scaleUp: {
    opacity: 0,
    scale: 0.8,
    ease: GSAP_EASE.smooth,
  },
  
  /** Rotate in from tilted */
  rotateIn: {
    opacity: 0,
    rotateX: -90,
    y: 40,
    transformOrigin: 'bottom center',
    ease: GSAP_EASE.smooth,
  },
  
  /** Simple fade */
  fadeIn: {
    opacity: 0,
    ease: GSAP_EASE.smooth,
  },
  
  /** Parallax offset - for parallax effects */
  parallaxOffset: {
    y: -100,
    ease: GSAP_EASE.none,
  },
  
  /** Hero fade out on scroll */
  heroExit: {
    opacity: 0.3,
    y: -100,
    scale: 0.9,
    ease: GSAP_EASE.none,
  },
} as const;

/**
 * Helper to create GSAP animation with stagger.
 * @example gsap.from(elements, withGsapStagger(GSAP_ANIMATION.fadeUp, STAGGER.normal))
 */
export const withGsapStagger = <T extends Record<string, unknown>>(
  preset: T,
  stagger: number = STAGGER.normal
): T & { stagger: number } => ({
  ...preset,
  stagger,
});

// ============================================================================
// PRELOADER
// ============================================================================

/**
 * Preloader timing configuration.
 */
export const PRELOADER = {
  /** Minimum display time in ms — fast enough to not feel vain */
  minDuration: 1200,
  /** Exit animation duration in ms */
  exitDuration: 800,
  /** Progress interpolation factor (0-1) */
  lerpFactor: 0.08,
} as const;

// ============================================================================
// CURSOR
// ============================================================================

/**
 * Custom cursor configuration.
 * Note: lerpFactor deprecated — Framer springs now sole smoothing authority.
 */
export const CURSOR = {
  /** @deprecated lerp removed, springs handle all smoothing */
  lerpFactor: 0.15,
  /** Scale when hovering interactive elements */
  hoverScale: 1.5,
} as const;

// ============================================================================
// SMOOTHING FACTORS
// ============================================================================

/**
 * Smoothing factors for useSmoothValue/useSmoothVec2 hooks.
 * Lower values = smoother but laggier, higher = more responsive.
 * All values are frame-rate independent via delta-time normalization.
 */
export const SMOOTHING = {
  /** Scroll-driven animations: slow, cinematic (0.06) */
  scroll: 0.06,
  /** Mouse tracking: balanced responsiveness (0.08) */
  mouse: 0.08,
  /** UI elements: snappy feedback like progress bars (0.10) */
  ui: 0.10,
  /** Morph section: responsive tracking (~8 frames to 63% target, ~130ms lag) */
  morph: 0.12,
} as const;

// ============================================================================
// ANIMATION PRESETS (Framer Motion)
// ============================================================================

/**
 * Type for Framer Motion transition configuration.
 * Presets are spreadable and overridable.
 */
export type TransitionPreset = {
  duration: number;
  ease: readonly [number, number, number, number];
  delay?: number;
};

/**
 * Type for complete animation preset with initial/animate states.
 */
export type AnimationPreset = {
  initial: Record<string, number | string>;
  animate: Record<string, number | string>;
  transition: TransitionPreset;
};

/**
 * Framer Motion transition presets.
 * Spread into transition prop: `transition={{ ...TRANSITION.fadeUp }}`
 * Override specific values: `transition={{ ...TRANSITION.fadeUp, delay: 0.5 }}`
 */
export const TRANSITION = {
  /** Fast micro-interaction - buttons, toggles */
  instant: {
    duration: DURATION.instant,
    ease: EASING_ARRAY.smooth,
  },
  
  /** Standard UI transition - modals, dropdowns */
  fast: {
    duration: DURATION.fast,
    ease: EASING_ARRAY.smooth,
  },
  
  /** Default reveal animation - content entering viewport */
  reveal: {
    duration: DURATION.reveal,
    ease: EASING_ARRAY.smooth,
  },
  
  /** Hero/title animations - dramatic entrance */
  hero: {
    duration: DURATION.word,
    ease: EASING_ARRAY.smooth,
  },
  
  /** Bouncy spring-like transition */
  bounce: {
    duration: DURATION.normal,
    ease: EASING_ARRAY.bounce,
  },
  
  /** Slow dramatic reveal */
  dramatic: {
    duration: DURATION.slow,
    ease: EASING_ARRAY.smooth,
  },
} as const;

/**
 * Complete animation presets with initial and animate states.
 * Use with motion components: `<motion.div {...ANIMATION.fadeUp} />`
 * Override with spread: `<motion.div {...ANIMATION.fadeUp} transition={{ delay: 0.5 }} />`
 */
export const ANIMATION = {
  /** Fade in from below - most common reveal */
  fadeUp: {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: DURATION.reveal, ease: EASING_ARRAY.smooth },
  },
  
  /** Fade in from above */
  fadeDown: {
    initial: { opacity: 0, y: -40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: DURATION.reveal, ease: EASING_ARRAY.smooth },
  },
  
  /** Scale up reveal - cards, modals */
  scaleUp: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: DURATION.normal, ease: EASING_ARRAY.smooth },
  },
  
  /** Hero title entrance - dramatic Y offset */
  heroTitle: {
    initial: { opacity: 0, y: 80 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: DURATION.word, ease: EASING_ARRAY.smooth },
  },
  
  /** Subtle fade - labels, captions */
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: DURATION.normal, ease: EASING_ARRAY.smooth },
  },
  
  /** Slide in from left */
  slideLeft: {
    initial: { opacity: 0, x: -40 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: DURATION.reveal, ease: EASING_ARRAY.smooth },
  },
  
  /** Slide in from right */
  slideRight: {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: DURATION.reveal, ease: EASING_ARRAY.smooth },
  },
} as const;

/**
 * Stagger container variants for orchestrating child animations.
 * Use with variants prop on parent: `<motion.div variants={STAGGER_VARIANTS.normal}>`
 */
export const STAGGER_VARIANTS = {
  /** Tight stagger for dense lists */
  tight: {
    hidden: {},
    visible: {
      transition: { staggerChildren: STAGGER.tight },
    },
  },
  /** Standard stagger for content grids */
  normal: {
    hidden: {},
    visible: {
      transition: { staggerChildren: STAGGER.normal },
    },
  },
  /** Wide stagger for dramatic reveals */
  wide: {
    hidden: {},
    visible: {
      transition: { staggerChildren: STAGGER.wide },
    },
  },
} as const;

/**
 * Helper to create delayed transition from preset.
 * @example transition={{ ...withDelay(TRANSITION.reveal, DELAY.short) }}
 */
export const withDelay = <T extends TransitionPreset>(
  preset: T,
  delay: number
): T & { delay: number } => ({
  ...preset,
  delay,
});

/**
 * Helper to create staggered delay for indexed items.
 * @example transition={{ ...withStagger(TRANSITION.reveal, index, STAGGER.normal) }}
 */
export const withStagger = <T extends TransitionPreset>(
  preset: T,
  index: number,
  stagger: number = STAGGER.normal,
  baseDelay: number = 0
): T & { delay: number } => ({
  ...preset,
  delay: baseDelay + index * stagger,
});
