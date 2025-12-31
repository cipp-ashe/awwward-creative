import { Suspense, lazy, ComponentType, ReactNode } from 'react';
import {
  useLenis,
  useScrollTriggerInit,
  usePreloaderState,
  useWebGLVisibility,
  useScrollTriggerRefresh,
} from '@/hooks';
import { RevealProvider } from '@/contexts/RevealContext';
import { NAVIGATION_SECTIONS, SectionConfig } from '@/constants/navigation';
import {
  CustomCursor,
  GrainOverlay,
  Preloader,
  SectionReveal,
  NavigationBar,
  ErrorBoundary,
  WebGLErrorBoundary,
} from '@/components';
// Eager load above-fold sections
import {
  HeroSection,
  MotionSection,
  TypographySection,
  MicroInteractionsSection,
  PerformanceSection,
  FooterSection,
} from '@/components/sections';

// ============================================================================
// LAZY LOADED SECTIONS (Heavy below-fold components)
// ============================================================================

/** Lazy load WebGL background for performance */
const WebGLBackground = lazy(() => import('@/components/WebGLBackground'));

/** Lazy load ScrollSection - GSAP horizontal scroll with pinning */
const ScrollSection = lazy(() => import('@/components/sections/ScrollSection'));

/** Lazy load MorphingTextSection - d3-interpolate + SVG morphing */
const MorphingTextSection = lazy(() => import('@/components/sections/MorphingTextSection'));

/** Lazy load WebGL3DSection - Three.js 3D scene */
const WebGL3DSection = lazy(() => import('@/components/sections/WebGL3DSection'));

// ============================================================================
// SECTION COMPONENT MAPPING
// ============================================================================

/**
 * Maps section IDs to their React components.
 * Order is determined by NAVIGATION_SECTIONS, not this object.
 * 
 * To add a new section:
 * 1. Add config to NAVIGATION_SECTIONS in src/constants/navigation.ts
 * 2. Create component in src/components/sections/
 * 3. Add mapping here
 */
const SECTION_COMPONENTS: Record<string, ComponentType> = {
  hero: HeroSection,
  motion: MotionSection,
  scroll: ScrollSection,           // lazy
  typography: TypographySection,
  micro: MicroInteractionsSection,
  performance: PerformanceSection,
  morphing: MorphingTextSection,   // lazy
  webgl: WebGL3DSection,           // lazy
};

/** Sections that are lazy loaded and need Suspense wrapper */
const LAZY_SECTIONS = new Set(['scroll', 'morphing', 'webgl']);

/**
 * Custom wrappers for sections needing special treatment.
 * Most sections don't need this — only use for error boundaries, etc.
 */
const SECTION_WRAPPERS: Record<string, ComponentType<{ children: ReactNode }>> = {
  webgl: ({ children }) => (
    <WebGLErrorBoundary 
      sectionLabel="07 — WebGL"
      title={<>Interactive <span className="text-primary">Depth</span></>}
    >
      {children}
    </WebGLErrorBoundary>
  ),
};

// ============================================================================
// SECTION RENDERER
// ============================================================================

/**
 * Renders a section with appropriate reveal wrapper based on config.
 */
const renderSection = (config: SectionConfig, index: number) => {
  const Component = SECTION_COMPONENTS[config.id];
  if (!Component) return null;
  
  const Wrapper = SECTION_WRAPPERS[config.id];
  const isLazy = LAZY_SECTIONS.has(config.id);
  
  // Build component with optional wrapper
  let content = Wrapper ? <Wrapper><Component /></Wrapper> : <Component />;
  
  // Wrap lazy sections in Suspense with null fallback (SectionReveal handles loading state)
  if (isLazy) {
    content = <Suspense fallback={null}>{content}</Suspense>;
  }
  
  // Sections with GSAP pin conflicts skip SectionReveal
  if (config.skipRevealWrapper) {
    return <div key={config.id}>{content}</div>;
  }
  
  return (
    <SectionReveal key={config.id} index={index} baseDelay={index === 0 ? 0 : undefined}>
      {content}
    </SectionReveal>
  );
};

// ============================================================================
// MAIN COMPONENTS
// ============================================================================

/**
 * Main page content with all sections and effects.
 * Separated from Index to allow RevealProvider context access.
 */
const IndexContent = () => {
  // Smooth scrolling and scroll-driven animations
  useLenis();
  useScrollTriggerInit();
  useScrollTriggerRefresh();
  
  // Loading and reveal state
  const { isLoading, handlePreloaderComplete } = usePreloaderState();
  
  // Delayed WebGL mount for performance
  const showWebGL = useWebGLVisibility();

  return (
    <>
      {isLoading && (
        <Preloader onComplete={handlePreloaderComplete} minDuration={1000} />
      )}

      <NavigationBar />

      <main className="relative bg-background">
        {showWebGL && (
          <ErrorBoundary fallback={null}>
            <Suspense fallback={null}>
              <WebGLBackground />
            </Suspense>
          </ErrorBoundary>
        )}
        <GrainOverlay />
        <CustomCursor />

        {/* Main content landmark for skip link */}
        <div id="main-content" tabIndex={-1} className="outline-none" />

        {/* Render all sections from config */}
        {NAVIGATION_SECTIONS.map((section, index) => renderSection(section, index))}
        
        {/* Footer is not a navigation section */}
        <SectionReveal index={NAVIGATION_SECTIONS.length}>
          <FooterSection />
        </SectionReveal>
      </main>
    </>
  );
};

/**
 * Index page root with providers.
 */
const Index = () => {
  return (
    <RevealProvider>
      <IndexContent />
    </RevealProvider>
  );
};

export default Index;
