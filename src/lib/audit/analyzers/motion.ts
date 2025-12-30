/**
 * Motion Analyzer
 * Focus: Easing curves. Are animations masking poor UX? Do parent/child animations conflict?
 */

import type { FrictionPoint, FileContents } from '../types';
import {
  GSAP_ANIMATION,
  FRAMER_MOTION,
  SCROLL_TRIGGER,
  INFINITE_ANIMATION,
  SCRUB_VALUE,
  USE_FRAME,
} from '../pattern-matchers';

export const analyzeMotion = (files: FileContents): FrictionPoint[] => {
  const issues: FrictionPoint[] = [];
  
  // Track animation library usage per file
  const animationUsage: {
    file: string;
    hasGsap: boolean;
    hasFramer: boolean;
    hasScrollTrigger: boolean;
    hasUseFrame: boolean;
  }[] = [];
  
  Object.entries(files).forEach(([path, content]) => {
    if (path.endsWith('.tsx') || path.endsWith('.ts')) {
      animationUsage.push({
        file: path,
        hasGsap: GSAP_ANIMATION.test(content),
        hasFramer: FRAMER_MOTION.test(content),
        hasScrollTrigger: SCROLL_TRIGGER.test(content),
        hasUseFrame: USE_FRAME.test(content),
      });
      // Reset lastIndex for global regex
      GSAP_ANIMATION.lastIndex = 0;
      FRAMER_MOTION.lastIndex = 0;
      SCROLL_TRIGGER.lastIndex = 0;
      USE_FRAME.lastIndex = 0;
    }
  });
  
  // Check for files mixing GSAP and Framer Motion
  const mixedFiles = animationUsage.filter(f => f.hasGsap && f.hasFramer);
  
  if (mixedFiles.length > 0) {
    // This is intentional architecture per the memories - only flag if on sibling elements
    issues.push({
      persona: 'motion',
      issue: `${mixedFiles.length} file(s) mix GSAP and Framer Motion (${mixedFiles.map(f => f.file.split('/').pop()).join(', ')}). Verify timing is intentionally orchestrated between imperative and declarative systems.`,
      severity: 'medium',
      conflictsWith: ['ux-navigation'],
    });
  }
  
  // Check for infinite animations
  const infiniteAnimationFiles: string[] = [];
  Object.entries(files).forEach(([path, content]) => {
    if (path.endsWith('.tsx') && INFINITE_ANIMATION.test(content)) {
      infiniteAnimationFiles.push(path);
      INFINITE_ANIMATION.lastIndex = 0;
    }
  });
  
  if (infiniteAnimationFiles.length > 0) {
    // Check if these also have scroll-driven animations
    const conflictFiles = infiniteAnimationFiles.filter(file => {
      const content = files[file] || '';
      return SCROLL_TRIGGER.test(content) || /scrub:/i.test(content);
    });
    
    if (conflictFiles.length > 0) {
      issues.push({
        persona: 'motion',
        issue: `Infinite loop animations conflict with scroll-driven effects in: ${conflictFiles.map(f => f.split('/').pop()).join(', ')}. User unsure if motion is physics-based or timed.`,
        severity: 'high',
      });
    }
  }
  
  // Check for inconsistent scrub values
  const scrubValues: number[] = [];
  Object.values(files).forEach(content => {
    let match;
    const regex = /scrub:\s*([\d.]+|true)/g;
    while ((match = regex.exec(content)) !== null) {
      const value = match[1] === 'true' ? 1 : parseFloat(match[1]);
      if (!isNaN(value)) {
        scrubValues.push(value);
      }
    }
  });
  
  const uniqueScrubValues = [...new Set(scrubValues)];
  if (uniqueScrubValues.length > 2) {
    issues.push({
      persona: 'motion',
      issue: `Inconsistent scrub values: ${uniqueScrubValues.join(', ')}. ${uniqueScrubValues.length} different "scrub speeds" implies indecision about scroll feel.`,
      severity: 'medium',
    });
  }
  
  // Check for prefers-reduced-motion support
  const hasReducedMotionSupport = Object.values(files).some(content =>
    /prefers-reduced-motion|prefersReducedMotion|reducedMotion/i.test(content)
  );
  
  if (!hasReducedMotionSupport && animationUsage.some(a => a.hasGsap || a.hasFramer)) {
    issues.push({
      persona: 'motion',
      issue: 'No prefers-reduced-motion detection found. Users with vestibular disorders may experience discomfort.',
      severity: 'high',
      conflictsWith: ['accessibility'],
    });
  }
  
  // Check for animation preset consistency
  const hasAnimationConstants = Object.keys(files).some(path => 
    path.includes('constants/animation') || path.includes('animation.ts')
  );
  
  if (!hasAnimationConstants) {
    issues.push({
      persona: 'motion',
      issue: 'No centralized animation constants found. Easing curves and durations likely inconsistent across components.',
      severity: 'medium',
    });
  }
  
  // Check for scale animations on text
  const scaleOnTextFiles = Object.entries(files).filter(([path, content]) =>
    path.endsWith('.tsx') && 
    /scale.*(?:title|heading|text|h1|h2|h3)|(?:title|heading|text).*scale/i.test(content)
  );
  
  if (scaleOnTextFiles.length > 0) {
    issues.push({
      persona: 'motion',
      issue: `Scale animations on text elements in ${scaleOnTextFiles.length} file(s). At small viewport sizes, scaled text may become illegible.`,
      severity: 'medium',
    });
  }
  
  return issues;
};
