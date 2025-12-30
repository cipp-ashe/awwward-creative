/**
 * HeroSection
 * 
 * Landing hero with animated title and scroll-driven parallax.
 * Uses custom centered layout - not wrapped with Section component.
 */

import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { motion } from 'framer-motion';
import { SectionContent } from '@/components/layout/Section';
import { 
  ANIMATION, 
  TRANSITION, 
  DURATION, 
  DELAY, 
  STAGGER, 
  SCROLL_TRIGGER,
  GSAP_ANIMATION,
  withDelay, 
  withStagger 
} from '@/constants/animation';

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title animation on scroll with preset
      gsap.to(titleRef.current, {
        ...GSAP_ANIMATION.heroExit,
        scrollTrigger: {
          trigger: sectionRef.current,
          ...SCROLL_TRIGGER.heroParallax,
        },
      });

      // Subtitle parallax
      gsap.to(subtitleRef.current, {
        y: -50,
        opacity: 0,
        scrollTrigger: {
          trigger: sectionRef.current,
          ...SCROLL_TRIGGER.heroParallax,
          scrub: 1.5,
        },
      });

      // Scroll indicator fade
      gsap.to(scrollIndicatorRef.current, {
        opacity: 0,
        y: 20,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: '10% top',
          end: '30% top',
          scrub: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const titleWords = ['Disciplined', 'misuse', 'of very good', 'primitives'];

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden py-32"
    >
      <SectionContent className="text-center">
        <motion.div
          {...ANIMATION.fadeIn}
          transition={withDelay(TRANSITION.dramatic, DELAY.xshort)}
          className="mb-8 md:mb-12"
        >
          <span className="text-mono text-xs md:text-sm text-muted-foreground tracking-widest uppercase">
            An experimental demonstrator
          </span>
        </motion.div>

        <h1 ref={titleRef} className="text-display text-display-xl mb-8 md:mb-12">
          {titleWords.map((word, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 80, rotateX: -90 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={withStagger(TRANSITION.hero, index, STAGGER.wide, DELAY.short)}
              className={`inline-block mr-[0.25em] ${
                word === 'misuse' ? 'text-primary italic' : ''
              }`}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <motion.div
          ref={subtitleRef}
          {...ANIMATION.fadeUp}
          transition={withDelay(TRANSITION.hero, DELAY.xlong)}
          className="max-w-2xl mx-auto text-center"
        >
          <p className="text-lg md:text-xl text-muted-foreground mb-3">
            This is what motion feels like when it means something.
          </p>
          <p className="text-mono text-xs md:text-sm text-primary/60 tracking-widest">
            GSAP · Lenis · Three.js · Framer Motion — not stacked, orchestrated.
          </p>
        </motion.div>
      </SectionContent>

      {/* Decorative elements */}
      <div className="glow w-[600px] h-[600px] -bottom-1/2 left-1/2 -translate-x-1/2 animate-pulse-glow" />

      {/* Scroll indicator */}
      <motion.div
        ref={scrollIndicatorRef}
        {...ANIMATION.fadeIn}
        transition={withDelay(TRANSITION.hero, DELAY.hero)}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
      >
        <span className="text-mono text-xs text-muted-foreground tracking-widest uppercase">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: DURATION.pulse, repeat: Infinity, ease: 'easeInOut' }}
          className="w-px h-12 bg-gradient-to-b from-primary/50 to-transparent"
        />
      </motion.div>
    </section>
  );
};

export default HeroSection;
