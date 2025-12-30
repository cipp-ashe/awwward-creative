import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const MotionSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);

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
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="section py-32 md:py-48">
      <div className="section-content">
        <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-start">
          <div>
            <span className="text-mono text-xs text-primary tracking-widest uppercase mb-4 block">
              01 — Motion
            </span>
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

        {/* Motion demo */}
        <div ref={demoRef} className="mt-24 flex justify-center gap-6 overflow-hidden py-12">
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
      </div>
    </section>
  );
};

export default MotionSection;
