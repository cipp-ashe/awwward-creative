/**
 * Core Components
 * 
 * Public components for building the application shell and experience.
 * Does NOT include shadcn/ui components (import those individually).
 * 
 * @example
 * import { 
 *   Preloader, 
 *   NavigationBar, 
 *   ErrorBoundary,
 *   SectionReveal 
 * } from '@/components';
 */

// Error Handling
export { ErrorBoundary } from './ErrorBoundary';
export { WebGLErrorBoundary } from './WebGLErrorBoundary';

// Navigation & Layout
export { default as NavigationBar } from './NavigationBar';
export { NavLink } from './NavLink';

// Loading & Transitions
export { default as Preloader } from './Preloader';
export { default as SectionReveal } from './SectionReveal';

// Scroll & Reveal Animations
export { default as ScrollReveal, StaggerContainer, StaggerItem } from './ScrollReveal';

// Visual Effects
export { default as GrainOverlay } from './GrainOverlay';
export { default as CustomCursor } from './CustomCursor';
export { default as ParticleTrail } from './ParticleTrail';
export { default as WebGLBackground } from './WebGLBackground';

// Theme
export { default as ThemeToggle } from './ThemeToggle';

// Indicators
export { default as EasingCurveIndicator } from './EasingCurveIndicator';
