/**
 * Navigation & Section Configuration
 * 
 * SINGLE SOURCE OF TRUTH for all page sections.
 * 
 * This config drives:
 * - NavigationBar section links and active state detection
 * - Index.tsx section rendering order
 * - Intersection Observer targets
 * - Smooth scroll destinations
 * 
 * @invariant IDs must be unique across all sections
 * @invariant Order determines navigation display and reveal cascade
 * @invariant Sections with `skipRevealWrapper: true` handle their own entrance animations
 */

import { ComponentType, ReactNode } from 'react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Configuration for a single page section.
 */
export interface SectionConfig {
  /** Unique DOM ID for the section (used for scroll/observer) */
  id: string;
  
  /** Display label in navigation (keep short for mobile) */
  label: string;
  
  /** Section number for visual hierarchy (e.g., "01") */
  number: string;
  
  /**
   * If true, section will NOT be wrapped in SectionReveal.
   * Required for sections using GSAP ScrollTrigger with `pin: true`
   * which conflicts with Framer Motion layout animations.
   */
  skipRevealWrapper?: boolean;
  
  /**
   * Custom wrapper component for special rendering needs.
   * Used for WebGLErrorBoundary, etc.
   */
  wrapper?: ComponentType<{ children: ReactNode }>;
  
  /**
   * Props to pass to the custom wrapper component.
   */
  wrapperProps?: Record<string, unknown>;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * All page sections in display order.
 * 
 * To add a new section:
 * 1. Add entry here with unique id, label, number
 * 2. Create component in src/components/sections/
 * 3. Import and add to SECTION_COMPONENTS map in Index.tsx
 * 
 * @example
 * { id: 'newfeature', label: 'Feature', number: '08' }
 */
export const NAVIGATION_SECTIONS: readonly SectionConfig[] = [
  { id: 'hero', label: 'Intro', number: '00' },
  { id: 'motion', label: 'Motion', number: '01' },
  { id: 'scroll', label: 'Scroll', number: '02', skipRevealWrapper: true },
  { id: 'typography', label: 'Type', number: '03', skipRevealWrapper: true },
  { id: 'micro', label: 'Micro', number: '04' },
  { id: 'performance', label: 'Perf', number: '05' },
  { id: 'morphing', label: 'Morph', number: '06' },
  { id: 'webgl', label: 'WebGL', number: '07' },
] as const;

// ============================================================================
// DERIVED VALUES
// ============================================================================

/**
 * Set of all valid section IDs for type-safe lookups.
 */
export const SECTION_IDS = new Set(NAVIGATION_SECTIONS.map(s => s.id));

/**
 * Map of section ID to config for O(1) lookup.
 */
export const SECTION_BY_ID = Object.fromEntries(
  NAVIGATION_SECTIONS.map(s => [s.id, s])
) as Record<string, SectionConfig>;

/**
 * Total number of sections (useful for progress calculations).
 */
export const SECTION_COUNT = NAVIGATION_SECTIONS.length;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/**
 * Union type of all valid section IDs.
 * Useful for type-safe function parameters.
 */
export type SectionId = typeof NAVIGATION_SECTIONS[number]['id'];
