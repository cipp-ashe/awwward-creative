/**
 * Section Layout Component
 * 
 * A reusable wrapper for page sections that provides:
 * - Consistent padding and max-width
 * - Optional section label (e.g., "01 - Motion")
 * - Standard structure for content containers
 * 
 * @example
 * <Section id="motion" label="01 - Motion">
 *   <h2>Motion Design</h2>
 *   <p>Content here...</p>
 * </Section>
 */

import { forwardRef, type ReactNode, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  /** Section ID for navigation and anchoring */
  id?: string;
  /** Section label displayed in the corner (e.g., "01 - Motion") */
  label?: string;
  /** Whether to use full viewport height */
  fullHeight?: boolean;
  /** Whether to center content vertically */
  centerContent?: boolean;
  /** Additional classes for the content wrapper */
  contentClassName?: string;
  /** Child content */
  children: ReactNode;
}

/**
 * Section component - standardized layout wrapper for page sections
 */
export const Section = forwardRef<HTMLElement, SectionProps>(({
  id,
  label,
  fullHeight = true,
  centerContent = true,
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
        'py-[var(--section-padding)]',
        className
      )}
      {...props}
    >
      {/* Section label */}
      {label && (
        <div className="absolute top-8 left-6 md:left-12 text-mono text-xs text-muted-foreground tracking-wider uppercase">
          {label}
        </div>
      )}

      {/* Content container */}
      <div
        className={cn(
          'w-full max-w-[var(--content-max)] mx-auto px-6 md:px-12',
          contentClassName
        )}
      >
        {children}
      </div>
    </section>
  );
});

Section.displayName = 'Section';

/**
 * SectionHeader - standardized header for sections
 */
export interface SectionHeaderProps {
  /** Main heading text */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Additional classes */
  className?: string;
}

export const SectionHeader = ({ title, subtitle, className }: SectionHeaderProps) => {
  return (
    <div className={cn('mb-12 md:mb-16', className)}>
      <h2 className="text-display text-display-lg mb-4">{title}</h2>
      {subtitle && (
        <p className="text-muted-foreground text-lg max-w-2xl">{subtitle}</p>
      )}
    </div>
  );
};

export default Section;
