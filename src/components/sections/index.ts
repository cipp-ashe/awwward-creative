/**
 * Section Components
 * 
 * All page sections for the main landing page.
 * Each section is a self-contained component with its own ID for navigation.
 * 
 * CODE-SPLITTING BOUNDARY:
 * ScrollSection, MorphingTextSection, and WebGL3DSection are NOT exported here.
 * They are lazy-loaded directly in Index.tsx to enable proper tree-shaking.
 * Do NOT re-add them to this barrel file.
 * 
 * @example
 * import { HeroSection, MotionSection } from '@/components/sections';
 */

// Eager-loaded sections (above-fold or lightweight)
export { default as HeroSection } from './HeroSection';
export { default as MotionSection } from './MotionSection';
export { default as TypographySection } from './TypographySection';
export { default as MicroInteractionsSection } from './MicroInteractionsSection';
export { default as PerformanceSection } from './PerformanceSection';
export { default as FooterSection } from './FooterSection';

// LAZY-LOADED (imported directly in Index.tsx):
// - ScrollSection (GSAP horizontal scroll with pinning)
// - MorphingTextSection (d3-interpolate + SVG morphing)
// - WebGL3DSection (Three.js 3D scene)
