/**
 * TypographySection
 * 
 * Demonstrates kinetic typography with variable fonts and scroll-driven reveals.
 */

import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { motion } from 'framer-motion';
import { Section, SectionLabel } from '@/components/layout/Section';
import { DURATION, DELAY, EASING_ARRAY } from '@/constants/animation';

const TypographySection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const charsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const [fontWeight, setFontWeight] = useState(400);

  const mainText = 'Text is geometry and interface';

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Character-by-character reveal
      charsRef.current.forEach((char, i) => {
        if (!char) return;
        
        gsap.from(char, {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: `top ${80 - i * 2}%`,
            end: `top ${50 - i * 2}%`,
            scrub: 1,
          },
          opacity: 0,
          y: 40,
          rotateX: -90,
          transformOrigin: 'bottom center',
        });
      });

      // Font weight animation based on scroll
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 50%',
        end: 'bottom 50%',
        onUpdate: (self) => {
          const weight = Math.round(300 + self.progress * 400);
          setFontWeight(weight);
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <Section ref={sectionRef} id="typography">
      <SectionLabel className="mb-8 block">03 — Typography</SectionLabel>

      {/* Main animated text */}
      <div className="mb-16 overflow-hidden">
        <h2
          className="text-display text-display-lg"
          style={{ fontWeight, fontVariationSettings: `'wght' ${fontWeight}` }}
        >
          {mainText.split('').map((char, i) => (
            <span
              key={i}
              ref={(el) => (charsRef.current[i] = el)}
              className="inline-block"
              style={{ 
                transformStyle: 'preserve-3d',
                perspective: '1000px',
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </h2>
      </div>

      {/* Content grid */}
      <div className="grid md:grid-cols-3 gap-8 md:gap-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: DURATION.reveal }}
          className="space-y-4"
        >
          <h3 className="text-display text-xl">Variable Axes</h3>
          <p className="text-muted-foreground">
            Modern variable fonts expose weight, width, and slant as continuous 
            parameters. Animation becomes typographic expression.
          </p>
          <p className="text-mono text-sm text-primary/60">
            Current weight: {fontWeight}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: DURATION.reveal, delay: DELAY.micro }}
          className="space-y-4"
        >
          <h3 className="text-display text-xl">Kinetic Type</h3>
          <p className="text-muted-foreground">
            Letters are shapes. Words are compositions. Sentences are sequences 
            that unfold in time. Typography inherits the language of motion graphics.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: DURATION.reveal, delay: DELAY.xshort }}
          className="space-y-4"
        >
          <h3 className="text-display text-xl">Split & Reveal</h3>
          <p className="text-muted-foreground">
            Text can be decomposed into characters, words, or lines — each 
            becoming an independent actor in the animation timeline.
          </p>
        </motion.div>
      </div>

      {/* Demo: Hover effect on large text */}
      <div className="mt-24 py-12 border-y border-border/30">
        <motion.p
          className="text-display text-display-sm text-center text-muted-foreground/50 hover:text-foreground transition-colors duration-700"
          whileHover={{ letterSpacing: '0.05em' }}
          transition={{ duration: 0.6, ease: EASING_ARRAY.smooth }}
        >
          Hover to feel typographic space expand
        </motion.p>
      </div>
    </Section>
  );
};

export default TypographySection;
