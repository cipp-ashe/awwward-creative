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
import { SMOOTHING } from '@/constants/animation';
import { useSmoothValue } from '@/hooks/useSmoothValue';

const MotionSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  const [rawScrollProgress, setRawScrollProgress] = useState(0);
  
  // Damping layer: smooth scroll progress for visual indicators
  // SMOOTHING.scroll for cinematic scroll-driven animations
  const scrollProgress = useSmoothValue(rawScrollProgress, {
    smoothing: SMOOTHING.scroll,
    threshold: 0.0001
  });

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Heading reveal
      gsap.from(headingRef.current, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          end: 'top 30%',
          scrub: 1,
        },
        opacity: 0,
        y: 100,
        skewY: 5,
      });

      // Content stagger
      const paragraphs = contentRef.current?.querySelectorAll('p');
      if (paragraphs) {
        gsap.from(paragraphs, {
          scrollTrigger: {
            trigger: contentRef.current,
            start: 'top 70%',
            end: 'top 30%',
            scrub: 1,
          },
          opacity: 0,
          y: 60,
          stagger: 0.1,
        });
      }

      // Demo animation - continuous motion
      gsap.to(demoRef.current?.querySelectorAll('.motion-box'), {
        scrollTrigger: {
          trigger: demoRef.current,
          start: 'top 80%',
          end: 'bottom 20%',
          scrub: 2,
        },
        x: (i) => (i % 2 === 0 ? 100 : -100),
        rotation: (i) => (i % 2 === 0 ? 15 : -15),
        stagger: 0.1,
      });

      // Track scroll progress for easing indicator
      // Writes to raw value - damping layer handles smoothing
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          setRawScrollProgress(self.progress);
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <Section ref={sectionRef} id="motion">
      <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-start">
        <div>
          <SectionLabel className="mb-4 block">01 — Motion</SectionLabel>
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
            "Animate absence as much as presence — things fade, drift, or dissolve out."
          </p>
        </div>
      </div>

      {/* Easing Curve Indicator */}
      <div className="mt-16 max-w-sm mx-auto md:mx-0 md:ml-auto">
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
