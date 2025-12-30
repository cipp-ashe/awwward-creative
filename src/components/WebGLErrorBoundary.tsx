/**
 * WebGLErrorBoundary Component
 * 
 * Specialized error boundary for WebGL/Three.js components.
 * Provides a styled fallback that matches the section aesthetic.
 * 
 * @example
 * <WebGLErrorBoundary sectionLabel="07 — WebGL">
 *   <Canvas>...</Canvas>
 * </WebGLErrorBoundary>
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { SectionLabel } from '@/components/layout/Section';

interface WebGLErrorBoundaryProps {
  /** Content to render when no error */
  children: ReactNode;
  /** Section label to display in fallback */
  sectionLabel?: string;
  /** Title for the fallback (can be string or JSX) */
  title?: ReactNode;
  /** Description for the fallback */
  description?: string;
  /** Additional className */
  className?: string;
}

interface WebGLErrorBoundaryState {
  hasError: boolean;
  errorType: 'webgl' | 'general' | null;
}

export class WebGLErrorBoundary extends Component<WebGLErrorBoundaryProps, WebGLErrorBoundaryState> {
  constructor(props: WebGLErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorType: null };
  }

  static getDerivedStateFromError(error: Error): WebGLErrorBoundaryState {
    // Detect WebGL-specific errors
    const isWebGLError = 
      error.message.includes('WebGL') ||
      error.message.includes('THREE') ||
      error.message.includes('context') ||
      error.message.includes('shader') ||
      error.message.includes('GLSL');

    return { 
      hasError: true, 
      errorType: isWebGLError ? 'webgl' : 'general' 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('WebGLErrorBoundary caught an error:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      const { 
        sectionLabel, 
        title = 'Interactive Depth',
        description,
        className = ''
      } = this.props;

      const fallbackDescription = description || (
        this.state.errorType === 'webgl'
          ? 'WebGL is not supported or unavailable on this device.'
          : 'This component encountered an error.'
      );

      return (
        <div className={`min-h-[50vh] flex items-center justify-center ${className}`}>
          <div className="section-content text-center">
            {sectionLabel && (
              <SectionLabel className="mb-8 block">{sectionLabel}</SectionLabel>
            )}
            
            <h2 className="text-display text-display-md mb-6">
              {title}
            </h2>
            
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              {fallbackDescription}
            </p>

            {/* Decorative fallback visualization */}
            <div className="relative w-48 h-48 mx-auto">
              <div className="absolute inset-0 rounded-full border border-border/30 animate-pulse" />
              <div className="absolute inset-4 rounded-full border border-border/20" />
              <div className="absolute inset-8 rounded-full border border-border/10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-primary/20" />
              </div>
            </div>

            <p className="mt-8 text-mono text-xs text-muted-foreground/50">
              Try refreshing or using a WebGL-compatible browser
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default WebGLErrorBoundary;
