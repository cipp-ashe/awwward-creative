import { Suspense, lazy, useEffect, useState } from 'react';
import { useLenis } from '@/hooks/useLenis';
import { useGsapScrollTrigger } from '@/hooks/useGsapScrollTrigger';
import CustomCursor from '@/components/CustomCursor';
import GrainOverlay from '@/components/GrainOverlay';
import HeroSection from '@/components/sections/HeroSection';
import MotionSection from '@/components/sections/MotionSection';
import ScrollSection from '@/components/sections/ScrollSection';
import TypographySection from '@/components/sections/TypographySection';
import MicroInteractionsSection from '@/components/sections/MicroInteractionsSection';
import PerformanceSection from '@/components/sections/PerformanceSection';
import FooterSection from '@/components/sections/FooterSection';

// Lazy load WebGL for performance
const WebGLBackground = lazy(() => import('@/components/WebGLBackground'));

const Index = () => {
  const [showWebGL, setShowWebGL] = useState(false);
  
  useLenis();
  useGsapScrollTrigger();

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
    <main className="relative bg-background">
      {/* Background layers */}
      {showWebGL && (
        <Suspense fallback={null}>
          <WebGLBackground />
        </Suspense>
      )}
      <GrainOverlay />
      <CustomCursor />

      {/* Content sections */}
      <HeroSection />
      <MotionSection />
      <ScrollSection />
      <TypographySection />
      <MicroInteractionsSection />
      <PerformanceSection />
      <FooterSection />
    </main>
  );
};

export default Index;
