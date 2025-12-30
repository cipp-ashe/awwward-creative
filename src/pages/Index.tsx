import { Suspense, lazy, useEffect, useState, useCallback } from 'react';
import { useLenis } from '@/hooks/useLenis';
import { useGsapScrollTrigger } from '@/hooks/useGsapScrollTrigger';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RevealProvider, useReveal } from '@/contexts/RevealContext';
import CustomCursor from '@/components/CustomCursor';
import GrainOverlay from '@/components/GrainOverlay';
import Preloader from '@/components/Preloader';
import SectionReveal from '@/components/SectionReveal';
import NavigationBar from '@/components/NavigationBar';
import ErrorBoundary from '@/components/ErrorBoundary';
import WebGLErrorBoundary from '@/components/WebGLErrorBoundary';
import HeroSection from '@/components/sections/HeroSection';
import MotionSection from '@/components/sections/MotionSection';
import ScrollSection from '@/components/sections/ScrollSection';
import TypographySection from '@/components/sections/TypographySection';
import MorphingTextSection from '@/components/sections/MorphingTextSection';
import WebGL3DSection from '@/components/sections/WebGL3DSection';
import MicroInteractionsSection from '@/components/sections/MicroInteractionsSection';
import PerformanceSection from '@/components/sections/PerformanceSection';
import FooterSection from '@/components/sections/FooterSection';

// Lazy load WebGL background for performance
const WebGLBackground = lazy(() => import('@/components/WebGLBackground'));

const IndexContent = () => {
  const [showWebGL, setShowWebGL] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { triggerReveal } = useReveal();
  
  useLenis();
  useGsapScrollTrigger();

  const handlePreloaderComplete = useCallback(() => {
    setIsLoading(false);
    setTimeout(() => {
      triggerReveal();
    }, 100);
  }, [triggerReveal]);

  // Refresh ScrollTrigger after fonts load to fix pin position calculations
  useEffect(() => {
    document.fonts.ready.then(() => {
      ScrollTrigger.refresh();
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWebGL(true);
    }, 100);

    const mediaQuery = window.matchMedia('(min-width: 768px)');
    if (mediaQuery.matches && !('ontouchstart' in window)) {
      document.body.style.cursor = 'none';
    }

    return () => {
      clearTimeout(timer);
      document.body.style.cursor = 'auto';
    };
  }, []);

  return (
    <>
      {isLoading && (
        <Preloader onComplete={handlePreloaderComplete} minDuration={2500} />
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

        <SectionReveal index={0} baseDelay={0}>
          <div id="hero">
            <HeroSection />
          </div>
        </SectionReveal>
        
        <SectionReveal index={1}>
          <div id="motion">
            <MotionSection />
          </div>
        </SectionReveal>
        
        {/* ScrollSection uses GSAP ScrollTrigger with pin - cannot be wrapped in SectionReveal */}
        <div id="scroll">
          <ScrollSection />
        </div>
        
        <SectionReveal index={3}>
          <div id="typography">
            <TypographySection />
          </div>
        </SectionReveal>
        
        <SectionReveal index={4}>
          <div id="micro">
            <MicroInteractionsSection />
          </div>
        </SectionReveal>
        
        <SectionReveal index={5}>
          <div id="performance">
            <PerformanceSection />
          </div>
        </SectionReveal>
        
        <SectionReveal index={6}>
          <div id="morphing">
            <MorphingTextSection />
          </div>
        </SectionReveal>
        
        <SectionReveal index={7}>
          <div id="webgl">
            <WebGLErrorBoundary 
              sectionLabel="07 — WebGL"
              title={<>Interactive <span className="text-primary">Depth</span></>}
            >
              <WebGL3DSection />
            </WebGLErrorBoundary>
          </div>
        </SectionReveal>
        
        <SectionReveal index={8}>
          <FooterSection />
        </SectionReveal>
      </main>
    </>
  );
};

const Index = () => {
  return (
    <RevealProvider>
      <IndexContent />
    </RevealProvider>
  );
};

export default Index;
