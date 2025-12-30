/**
 * Section Layout Components
 * 
 * Provides reusable layout primitives for consistent section structure.
 * 
 * Components:
 * - Section: Main wrapper with padding, optional label, and content container
 * - SectionLabel: Standalone label component  
 * - SectionContent: Content wrapper with max-width and padding
 * - SectionHeader: Title + subtitle header block
 */

import { forwardRef, type ReactNode, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// SECTION LABEL
// ============================================================================

export interface SectionLabelProps {
  /** Label text (e.g., "01 — Motion") */
  children: ReactNode;
  /** Additional classes */
  className?: string;
}

/**
 * Section label - displays in top-left corner or inline
 */
export const SectionLabel = ({ children, className }: SectionLabelProps) => (
  <span className={cn(
    'text-mono text-xs text-primary tracking-widest uppercase',
    className
  )}>
    {children}
  </span>
);

// ============================================================================
// SECTION CONTENT
// ============================================================================

export interface SectionContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Section content wrapper - provides consistent max-width and padding
 */
export const SectionContent = forwardRef<HTMLDivElement, SectionContentProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'w-full max-w-[var(--content-max)] mx-auto px-6 md:px-12',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
SectionContent.displayName = 'SectionContent';

// ============================================================================
// SECTION HEADER
// ============================================================================

export interface SectionHeaderProps {
  /** Section number (e.g., "01") */
  number?: string;
  /** Section label (e.g., "Motion") */
  label?: string;
  /** Main heading - can include JSX for styled portions */
  title: ReactNode;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Additional classes */
  className?: string;
}

/**
 * Section header - combines label, title, and optional subtitle
 */
export const SectionHeader = ({ 
  number, 
  label, 
  title, 
  subtitle, 
  className 
}: SectionHeaderProps) => (
  <div className={cn('mb-12 md:mb-16', className)}>
    {(number || label) && (
      <SectionLabel className="mb-4 block">
        {number && `${number} — `}{label}
      </SectionLabel>
    )}
    <h2 className="text-display text-display-md mb-6">{title}</h2>
    {subtitle && (
      <p className="text-lg text-muted-foreground max-w-2xl">{subtitle}</p>
    )}
  </div>
);

// ============================================================================
// SECTION (MAIN COMPONENT)
// ============================================================================

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  /** Section ID for navigation and anchoring */
  id?: string;
  /** Section label displayed in the corner (e.g., "01 — Motion") */
  label?: string;
  /** Whether to use full viewport height */
  fullHeight?: boolean;
  /** Whether to center content vertically */
  centerContent?: boolean;
  /** Use custom padding (py-32 md:py-48) instead of CSS variable */
  standardPadding?: boolean;
  /** Skip the content wrapper (for custom layouts) */
  noContentWrapper?: boolean;
  /** Additional classes for the content wrapper */
  contentClassName?: string;
  /** Child content */
  children: ReactNode;
}

/**
 * Section component - standardized layout wrapper for page sections
 * 
 * @example
 * // Standard section with label
 * <Section id="motion" label="01 — Motion">
 *   <h2>Motion Design</h2>
 * </Section>
 * 
 * @example
 * // Custom layout (no content wrapper)
 * <Section id="scroll" noContentWrapper>
 *   <div className="custom-horizontal-scroll">...</div>
 * </Section>
 */
export const Section = forwardRef<HTMLElement, SectionProps>(({
  id,
  label,
  fullHeight = false,
  centerContent = false,
  standardPadding = true,
  noContentWrapper = false,
  className,
  contentClassName,
  children,
  ...props
}, ref) => {
  return (
    <section
      ref={ref}
      id={id}
      className={cn(
        'relative w-full',
        fullHeight && 'min-h-screen',
        centerContent && 'flex items-center',
        standardPadding && 'py-32 md:py-48',
        className
      )}
      {...props}
    >
      {/* Absolute positioned label */}
      {label && (
        <div className="absolute top-8 left-6 md:left-12 z-10">
          <SectionLabel>{label}</SectionLabel>
        </div>
      )}

      {/* Content - either wrapped or direct children */}
      {noContentWrapper ? (
        children
      ) : (
        <SectionContent className={contentClassName}>
          {children}
        </SectionContent>
      )}
    </section>
  );
});

Section.displayName = 'Section';

export default Section;
