/**
 * Section Type Definitions
 */

import type { ReactNode } from 'react';

/**
 * Base props for all section components
 */
export interface BaseSectionProps {
  /** Section ID for navigation */
  id?: string;
  /** Additional CSS classes */
  className?: string;
  /** Child content */
  children?: ReactNode;
}

/**
 * Section with label props
 */
export interface LabeledSectionProps extends BaseSectionProps {
  /** Section label (e.g., "01 - Motion") */
  label?: string;
  /** Section number for display */
  number?: string;
  /** Section title */
  title?: string;
}

/**
 * Section metadata for navigation
 */
export interface SectionMeta {
  /** Unique section ID */
  id: string;
  /** Display label */
  label: string;
  /** Section number (e.g., "01") */
  number: string;
}

/**
 * Navigation section configuration
 */
export interface NavSection {
  id: string;
  label: string;
  number: string;
}
