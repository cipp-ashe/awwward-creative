import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useReveal } from '@/contexts/RevealContext';
import { NAVIGATION_SECTIONS } from '@/constants/navigation';
import { SMOOTHING, DELAY, TRANSITION } from '@/constants/animation';
import { useSmoothValue } from '@/hooks/useSmoothValue';
import ThemeToggle from '@/components/ThemeToggle';

const NavigationBar = () => {
  const { isRevealed } = useReveal();
  const [rawScrollProgress, setRawScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('hero');
  const [isVisible, setIsVisible] = useState(true);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const lastScrollY = useRef(0);
  const navRef = useRef<HTMLElement>(null);
  
  // Damping layer: smooth progress for visual bar animation
  // SMOOTHING.ui for snappy UI feedback
  const smoothProgress = useSmoothValue(rawScrollProgress, {
    smoothing: SMOOTHING.ui,
    threshold: 0.001
  });

  // Track scroll progress and direction
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollY / docHeight : 0;
      setRawScrollProgress(progress);

      // Hide nav when scrolling down, show when scrolling up
      const isDown = scrollY > lastScrollY.current && scrollY > 100;
      setIsScrollingDown(isDown);
      setIsVisible(!isDown || scrollY < 100);
      lastScrollY.current = scrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track active section via Intersection Observer
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    NAVIGATION_SECTIONS.forEach((section) => {
      const element = document.getElementById(section.id);
      if (!element) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
              setActiveSection(section.id);
            }
          });
        },
        { threshold: [0.3, 0.5, 0.7], rootMargin: '-10% 0px -10% 0px' }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

  // Smooth scroll to section
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Account for nav height
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  if (!isRevealed) return null;

  return (
    <motion.nav
        ref={navRef}
        initial={{ y: -100, opacity: 0 }}
        animate={{ 
          y: isVisible ? 0 : -100, 
          opacity: isVisible ? 1 : 0 
        }}
        transition={TRANSITION.fast}
        className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
      >
        {/* Background blur */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-md border-b border-border/30" />

        {/* Progress bar - uses smoothed progress for visual polish */}
        <motion.div
          className="absolute bottom-0 left-0 h-px bg-primary origin-left"
          style={{ scaleX: smoothProgress }}
          transition={TRANSITION.instant}
        />

        {/* Nav content */}
        <div className="relative flex items-center justify-between h-16 px-6 md:px-12 max-w-[var(--content-max)] mx-auto pointer-events-auto">
          {/* Logo / Brand */}
          <motion.button
            onClick={() => scrollToSection('hero')}
            className="group flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            aria-label="Go to top"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 80 80"
              fill="none"
              className="overflow-visible"
            >
              {/* Outer ring */}
              <circle
                cx="40"
                cy="40"
                r="35"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
                className="opacity-30 group-hover:opacity-50 transition-opacity"
              />
              
              {/* Inner hexagonal shape */}
              <path
                d="M40 20 L55 35 L55 55 L40 70 L25 55 L25 35 Z"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                className="group-hover:stroke-primary transition-colors"
              />
              
              {/* Center dot */}
              <circle
                cx="40"
                cy="40"
                r="4"
                fill="currentColor"
                className="group-hover:fill-primary transition-colors"
              />
            </svg>
          </motion.button>

          {/* Section links - desktop */}
          <div className="hidden md:flex items-center gap-1">
            {NAVIGATION_SECTIONS.map((section, index) => (
              <motion.button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`relative px-3 py-2 text-mono text-[10px] tracking-wider uppercase transition-colors ${
                  activeSection === section.id
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: DELAY.micro + index * DELAY.xmicro }}
                whileHover={{ y: -2 }}
              >
                <span className="opacity-50 mr-1">{section.number}</span>
                {section.label}
                
                {/* Active indicator */}
                {activeSection === section.id && (
                  <motion.div
                    layoutId="activeSection"
                    className="absolute bottom-0 left-0 right-0 h-px bg-primary"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>

          {/* Right side: Theme toggle + Progress */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {/* Percentage uses raw progress for accuracy */}
            <div className="text-mono text-xs text-muted-foreground">
              <span className="text-primary">{Math.round(rawScrollProgress * 100)}</span>
              <span className="opacity-50">%</span>
            </div>
          </div>
        </div>

        {/* Mobile section indicator */}
        <div className="md:hidden absolute bottom-0 left-0 right-0 flex justify-center pb-1">
          <div className="flex gap-1">
            {NAVIGATION_SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  activeSection === section.id
                    ? 'bg-primary scale-125'
                    : 'bg-border hover:bg-muted-foreground'
                }`}
                aria-label={`Go to ${section.label}`}
              />
            ))}
          </div>
        </div>
    </motion.nav>
  );
};

export default NavigationBar;
