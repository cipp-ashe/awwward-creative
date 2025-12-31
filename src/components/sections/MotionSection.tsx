/**
 * MotionSection
 * 
 * Demonstrates scroll-driven animation with GSAP and easing curves.
 * Uses damped scroll progress for smooth easing indicator updates.
 */

import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { Section, SectionContent, SectionLabel } from '@/components/layout/Section';
import EasingCurveIndicator from '@/components/EasingCurveIndicator';
import { SMOOTHING, STAGGER, SCROLL_TRIGGER, GSAP_ANIMATION, withGsapStagger } from '@/constants/animation';
import { useSmoothValue } from '@/hooks/useSmoothValue';

const MotionSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  const [rawScrollProgress, setRawScrollProgress] = useState(0);
  const lastProgressRef = useRef(0);
  
  // Damping layer: smooth scroll progress for visual indicators
  // SMOOTHING.scroll for cinematic scroll-driven animations
  const scrollProgress = useSmoothValue(rawScrollProgress, {
    smoothing: SMOOTHING.scroll,
    threshold: 0.0001
  });

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Heading reveal with preset
      gsap.from(headingRef.current, {
        ...GSAP_ANIMATION.slideUp,
        scrollTrigger: {
          trigger: sectionRef.current,
          ...SCROLL_TRIGGER.scrubReveal,
        },
      });

      // Content stagger with preset
      const paragraphs = contentRef.current?.querySelectorAll('p');
      if (paragraphs) {
        gsap.from(paragraphs, {
          ...withGsapStagger(GSAP_ANIMATION.fadeUp, STAGGER.normal),
          scrollTrigger: {
            trigger: contentRef.current,
            ...SCROLL_TRIGGER.scrubReveal,
            start: 'top 70%',
          },
        });
      }

      // Demo animation - continuous motion
      gsap.to(demoRef.current?.querySelectorAll('.motion-box'), {
        x: (i) => (i % 2 === 0 ? 100 : -100),
        rotation: (i) => (i % 2 === 0 ? 15 : -15),
        stagger: STAGGER.normal,
        scrollTrigger: {
          trigger: demoRef.current,
          ...SCROLL_TRIGGER.scrubSlow,
        },
      });

      // Track scroll progress for easing indicator
      // Throttle React updates to reduce re-renders (only on significant change)
      ScrollTrigger.create({
        trigger: sectionRef.current,
        ...SCROLL_TRIGGER.progress,
        onUpdate: (self) => {
          const progress = self.progress;
          // Only trigger React update on significant changes (reduces re-renders by ~95%)
          if (Math.abs(progress - lastProgressRef.current) > 0.005) {
            lastProgressRef.current = progress;
            setRawScrollProgress(progress);
          }
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <Section ref={sectionRef} id="motion">
      <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-start">
        <div>
          <SectionLabel className="mb-2 block">01 / Motion</SectionLabel>
          <div className="text-mono text-xs text-primary/40 tracking-widest uppercase mb-4">
            GSAP / ScrollTrigger
          </div>
          <h2 ref={headingRef} className="text-display text-display-md mb-8">
            Animation is not decoration — it's{' '}
            <span className="text-primary">interface</span>
          </h2>
        </div>

        <div ref={contentRef} className="space-y-6 text-lg text-muted-foreground">
          <p>
            GSAP's scripted precision maps motion to scroll position, not time. 
            Framer Motion handles local, reactive animations. Together, they choreograph 
            what users feel, not just what they see.
          </p>
          <p>
            The distinction matters: scroll-driven animation treats the viewport as a 
            timeline. Every pixel of scroll becomes a frame of intent. This is motion 
            as narrative architecture.
          </p>
          <p className="text-mono text-sm border-l-2 border-primary/30 pl-4 py-2">
            "Animate absence. Things fade, drift, dissolve."
          </p>
        </div>
      </div>

      {/* Easing Curve Indicator */}
      <div className="mt-16 max-w-content-narrow mx-auto md:mx-0 md:ml-auto">
        <EasingCurveIndicator scrollProgress={scrollProgress} />
      </div>

      {/* Motion demo */}
      <div ref={demoRef} className="mt-16 flex justify-center gap-6 overflow-hidden py-12">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="motion-box w-16 h-16 md:w-24 md:h-24 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center"
            style={{ opacity: 1 - i * 0.15 }}
          >
            <span className="text-mono text-xs text-primary/60">{i + 1}</span>
          </div>
        ))}
      </div>
    </Section>
  );
};

export default MotionSection;
