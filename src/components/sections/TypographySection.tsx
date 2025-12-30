/**
 * TypographySection
 * 
 * Demonstrates kinetic typography with variable fonts and scroll-driven reveals.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { motion } from 'framer-motion';
import { Section, SectionLabel } from '@/components/layout/Section';
import { useMotionConfigSafe } from '@/contexts/MotionConfigContext';
import { 
  ANIMATION, 
  TRANSITION, 
  DURATION, 
  DELAY, 
  STAGGER,
  EASING_ARRAY,
  withDelay, 
  withStagger 
} from '@/constants/animation';

const TypographySection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const charsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [fontWeight, setFontWeight] = useState(400);
  const [originIndex, setOriginIndex] = useState(0);
  const { isReducedMotion } = useMotionConfigSafe();

  const mainText = 'Text is geometry and interface';
  const hoverWords = ['Hover', 'to', 'feel', 'typographic', 'space', 'expand'];

  // Find closest word to cursor on hover entry
  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isReducedMotion) return;
    
    const cursorX = e.clientX;
    let closestIndex = 0;
    let closestDist = Infinity;
    
    wordRefs.current.forEach((ref, i) => {
      if (!ref) return;
      const rect = ref.getBoundingClientRect();
      const wordCenterX = rect.left + rect.width / 2;
      const dist = Math.abs(cursorX - wordCenterX);
      
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    });
    
    setOriginIndex(closestIndex);
  }, [isReducedMotion]);

  // Calculate delay based on distance from origin word
  const getWordDelay = (wordIndex: number): number => {
    return Math.abs(wordIndex - originIndex) * STAGGER.tight;
  };

  useEffect(() => {
    const charCount = charsRef.current.filter(Boolean).length;
    
    const ctx = gsap.context(() => {
      // Character-by-character reveal with normalized stagger
      // Distributes all characters across a fixed scroll range (80%→30% start, 50%→20% end)
      const startRange = { from: 80, to: 30 };
      const endRange = { from: 50, to: 20 };
      
      charsRef.current.forEach((char, i) => {
        if (!char) return;
        
        const progress = charCount > 1 ? i / (charCount - 1) : 0;
        const startPercent = startRange.from - progress * (startRange.from - startRange.to);
        const endPercent = endRange.from - progress * (endRange.from - endRange.to);
        
        gsap.from(char, {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: `top ${startPercent}%`,
            end: `top ${endPercent}%`,
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
          {...ANIMATION.fadeUp}
          whileInView={ANIMATION.fadeUp.animate}
          viewport={{ once: true, margin: '-100px' }}
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
          {...ANIMATION.fadeUp}
          whileInView={ANIMATION.fadeUp.animate}
          viewport={{ once: true, margin: '-100px' }}
          transition={withStagger(TRANSITION.reveal, 1)}
          className="space-y-4"
        >
          <h3 className="text-display text-xl">Kinetic Type</h3>
          <p className="text-muted-foreground">
            Letters are shapes. Words are compositions. Sentences are sequences 
            that unfold in time. Typography inherits the language of motion graphics.
          </p>
        </motion.div>

        <motion.div
          {...ANIMATION.fadeUp}
          whileInView={ANIMATION.fadeUp.animate}
          viewport={{ once: true, margin: '-100px' }}
          transition={withStagger(TRANSITION.reveal, 2)}
          className="space-y-4"
        >
          <h3 className="text-display text-xl">Split & Reveal</h3>
          <p className="text-muted-foreground">
            Text can be decomposed into characters, words, or lines — each 
            becoming an independent actor in the animation timeline.
          </p>
        </motion.div>
      </div>

      {/* Demo: Hover effect on large text - cursor-relative cascade */}
      <div className="mt-24 py-12 border-y border-border/30">
        <motion.div
          className="text-display text-display-sm text-center flex flex-wrap justify-center gap-x-[0.3em]"
          initial="rest"
          whileHover="hover"
          animate="rest"
          onMouseEnter={handleMouseEnter}
        >
          {hoverWords.map((word, i) => (
            <motion.span
              key={i}
              ref={(el) => (wordRefs.current[i] = el)}
              style={{ 
                color: 'hsl(var(--muted-foreground) / 0.5)',
                willChange: 'letter-spacing, color, transform'
              }}
              variants={{
                rest: { 
                  letterSpacing: '0em',
                  y: 0,
                  color: 'hsl(var(--muted-foreground) / 0.5)'
                },
                hover: { 
                  letterSpacing: '0.08em',
                  y: -2,
                  color: 'hsl(var(--foreground))'
                }
              }}
              transition={{
                duration: DURATION.normal,
                ease: EASING_ARRAY.smooth,
                delay: getWordDelay(i),
              }}
            >
              {word}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </Section>
  );
};

export default TypographySection;
