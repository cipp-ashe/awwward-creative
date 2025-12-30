import { Suspense, lazy, useEffect, useState, useCallback } from 'react';
import { useLenis } from '@/hooks/useLenis';
import { useGsapScrollTrigger } from '@/hooks/useGsapScrollTrigger';
import { RevealProvider, useReveal } from '@/contexts/RevealContext';
import CustomCursor from '@/components/CustomCursor';
import GrainOverlay from '@/components/GrainOverlay';
import Preloader from '@/components/Preloader';
import SectionReveal from '@/components/SectionReveal';
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
    // Small delay to ensure preloader exit animation completes
    setTimeout(() => {
      triggerReveal();
    }, 100);
  }, [triggerReveal]);

  useEffect(() => {
    // Delay WebGL loading for better perceived performance
    const timer = setTimeout(() => {
      setShowWebGL(true);
    }, 100);

    // Hide default cursor on desktop
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
      {/* Preloader */}
      {isLoading && (
        <Preloader onComplete={handlePreloaderComplete} minDuration={2500} />
      )}

      <main className="relative bg-background">
        {/* Background layers */}
        {showWebGL && (
          <Suspense fallback={null}>
            <WebGLBackground />
          </Suspense>
        )}
        <GrainOverlay />
        <CustomCursor />

        {/* Content sections with staggered reveal */}
        <SectionReveal index={0} baseDelay={0}>
          <HeroSection />
        </SectionReveal>
        
        <SectionReveal index={1}>
          <MotionSection />
        </SectionReveal>
        
        <SectionReveal index={2}>
          <ScrollSection />
        </SectionReveal>
        
        <SectionReveal index={3}>
          <TypographySection />
        </SectionReveal>
        
        <SectionReveal index={4}>
          <MorphingTextSection />
        </SectionReveal>
        
        <SectionReveal index={5}>
          <WebGL3DSection />
        </SectionReveal>
        
        <SectionReveal index={6}>
          <MicroInteractionsSection />
        </SectionReveal>
        
        <SectionReveal index={7}>
          <PerformanceSection />
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
