/**
 * GrainOverlay Component
 * 
 * Renders a fixed, full-viewport grain texture overlay for visual aesthetic.
 * Uses CSS-defined SVG noise pattern with configurable opacity via --grain-opacity.
 * 
 * The overlay is:
 * - Fixed position covering entire viewport
 * - Pointer-events disabled (click-through)
 * - Highest z-index to sit above all content
 * - aria-hidden for accessibility
 * 
 * @example
 * <GrainOverlay />
 */
const GrainOverlay = () => {
  return <div className="grain" aria-hidden="true" />;
};

export default GrainOverlay;
