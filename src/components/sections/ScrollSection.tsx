/**
 * ScrollSection
 * 
 * Horizontal scroll demonstration using GSAP ScrollTrigger.
 * Uses custom layout (pinned horizontal scroll) - not wrapped with Section component.
 */

import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { SectionLabel } from '@/components/layout/Section';
import { DURATION, SCROLL_TRIGGER, GSAP_EASE } from '@/constants/animation';

const ScrollSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const horizontalRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const horizontal = horizontalRef.current;
      const section = sectionRef.current;
      if (!horizontal || !section) return;

      // Set initial state for entrance animation
      gsap.set(section, { opacity: 0 });

      // Entrance fade-in animation
      gsap.to(section, {
        opacity: 1,
        duration: DURATION.reveal,
        ease: GSAP_EASE.smooth,
        scrollTrigger: {
          trigger: section,
          ...SCROLL_TRIGGER.reveal,
        },
      });

      // Horizontal scroll animation
      const horizontalScroll = gsap.to(horizontal, {
        x: () => -(horizontal.scrollWidth - window.innerWidth),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${horizontal.scrollWidth - window.innerWidth}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Progress bar
      gsap.to(progressRef.current, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${horizontal.scrollWidth - window.innerWidth}`,
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      return () => {
        horizontalScroll.kill();
      };
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const scrollCards = [
    {
      title: 'Scroll as Timeline',
      content: "Lenis provides the physics. GSAP's ScrollTrigger provides the choreography. Together, scroll becomes an input device, not an afterthought.",
    },
    {
      title: 'Precision Control',
      content: "Every scroll position maps to a specific state. No guessing, no jank. The user's thumb becomes the playhead of a carefully authored experience.",
    },
    {
      title: 'Progressive Reveal',
      content: "Content appears as the user earns it. This is not lazy loading — it is narrative pacing. The scroll bar is the story arc.",
    },
    {
      title: 'Inertia & Ease',
      content: "Smooth scrolling is not just pretty — it buys you time. That extra 200ms of deceleration is 200ms of settled attention.",
    },
  ];

  return (
    <section ref={sectionRef} id="scroll" className="relative min-h-screen overflow-hidden">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-px bg-border z-50">
        <div
          ref={progressRef}
          className="h-full bg-primary origin-left"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>

      {/* Section label */}
      <div className="absolute top-8 left-6 md:left-12 z-10">
        <SectionLabel className="block">02 / Scroll</SectionLabel>
        <div className="text-mono text-xs text-primary/40 tracking-widest uppercase mt-1">
          LENIS / Smooth Scroll
        </div>
      </div>

      {/* Horizontal scroll container */}
      <div ref={horizontalRef} className="flex items-center h-screen">
        {/* Intro panel */}
        <div className="flex-shrink-0 w-screen h-full flex items-center justify-center px-6 md:px-24">
          <div className="max-w-3xl">
            <h2 className="text-display text-display-md mb-6">
              Scroll is the <span className="text-primary">timeline</span>,
              <br />
              not the event
            </h2>
            <p className="text-lg text-muted-foreground">
              This is scroll as input, not event →
            </p>
          </div>
        </div>

        {/* Content cards */}
        {scrollCards.map((card, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-[80vw] md:w-[50vw] h-full flex items-center px-8 md:px-16"
          >
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-8 md:p-12 w-full">
              <span className="text-mono text-xs text-primary/60 mb-4 block">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="text-display text-display-sm mb-4">{card.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{card.content}</p>
            </div>
          </div>
        ))}

        {/* End panel */}
        <div className="flex-shrink-0 w-screen h-full flex items-center justify-center px-6 md:px-24">
          <div className="text-center">
            <p className="text-mono text-sm text-muted-foreground">
              Continue scrolling ↓
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScrollSection;
