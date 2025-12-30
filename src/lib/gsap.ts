/**
 * GSAP Configuration
 * 
 * Single registration point for all GSAP plugins.
 * Import gsap and ScrollTrigger from this file to ensure plugins are registered.
 * 
 * @example
 * import { gsap, ScrollTrigger } from '@/lib/gsap';
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register plugins once at module load
gsap.registerPlugin(ScrollTrigger);

// Re-export for use throughout the app
export { gsap, ScrollTrigger };
