/**
 * ErrorBoundary Component
 * 
 * Catches JavaScript errors in child components and displays a fallback UI.
 * Especially useful for WebGL components that may fail on unsupported devices.
 * 
 * @example
 * <ErrorBoundary fallback={<div>Something went wrong</div>}>
 *   <WebGLComponent />
 * </ErrorBoundary>
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  /** Content to render when no error */
  children: ReactNode;
  /** Fallback UI to display on error */
  fallback?: ReactNode;
  /** Custom error handler callback */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Optional className for the fallback container */
  className?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={this.props.className || 'flex items-center justify-center p-8'}>
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Something went wrong</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
