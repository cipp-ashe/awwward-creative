/**
 * Accessibility Analyzer
 * Focus: Strict WCAG check. Flag low contrast or keyboard traps. No "artistic license."
 */

import type { FrictionPoint, FileContents } from '../types';
import {
  CURSOR_NONE,
  SKIP_LINK,
  PREFERS_REDUCED_MOTION,
  IMG_WITHOUT_ALT,
  FOCUS_VISIBLE,
} from '../pattern-matchers';

export const analyzeAccessibility = (files: FileContents): FrictionPoint[] => {
  const issues: FrictionPoint[] = [];
  
  // Check for cursor: none without fallback
  const cursorNoneFiles: string[] = [];
  Object.entries(files).forEach(([path, content]) => {
    if (CURSOR_NONE.test(content)) {
      cursorNoneFiles.push(path);
      CURSOR_NONE.lastIndex = 0;
    }
  });
  
  if (cursorNoneFiles.length > 0) {
    // Check if there's a reduced-motion fallback
    const hasReducedMotionFallback = cursorNoneFiles.some(file => {
      const content = files[file] || '';
      return /prefers-reduced-motion.*cursor|cursor.*prefers-reduced-motion/i.test(content);
    });
    
    if (!hasReducedMotionFallback) {
      issues.push({
        persona: 'accessibility',
        issue: `cursor: none used in ${cursorNoneFiles.map(f => f.split('/').pop()).join(', ')} without reduced-motion fallback. Screen reader and keyboard users lose cursor visibility. WCAG 2.1.1 violation.`,
        severity: 'critical',
        conflictsWith: ['ux-navigation'],
      });
    }
  }
  
  // Check for visual noise without reduced-motion override
  const noisePatterns = Object.entries(files).filter(([path, content]) =>
    /grain|noise|particle|flicker/i.test(path) || 
    /grain|noise|particle|flicker/i.test(content)
  );
  
  if (noisePatterns.length > 0) {
    const hasReducedMotionOverride = noisePatterns.some(([, content]) =>
      PREFERS_REDUCED_MOTION.test(content)
    );
    PREFERS_REDUCED_MOTION.lastIndex = 0;
    
    if (!hasReducedMotionOverride) {
      issues.push({
        persona: 'accessibility',
        issue: 'Film grain/noise/particle effects found without prefers-reduced-motion override. Users with vestibular disorders may experience discomfort. WCAG 2.3.3.',
        severity: 'high',
      });
    }
  }
  
  // Check for skip-to-content link
  const appContent = files['src/App.tsx'] || '';
  const indexHtml = files['index.html'] || '';
  const mainContent = files['src/main.tsx'] || '';
  
  const hasSkipLink = 
    SKIP_LINK.test(appContent) || 
    SKIP_LINK.test(indexHtml) || 
    SKIP_LINK.test(mainContent) ||
    Object.values(files).some(content => /sr-only.*skip|skip.*sr-only/i.test(content));
  
  SKIP_LINK.lastIndex = 0;
  
  if (!hasSkipLink) {
    issues.push({
      persona: 'accessibility',
      issue: 'No skip-to-content link found. Screen reader users must navigate through all decorative elements before reaching main content. WCAG 2.4.1 (Bypass Blocks) violation.',
      severity: 'high',
    });
  }
  
  // Check for images without alt text
  const imagesWithoutAlt: { file: string; count: number }[] = [];
  Object.entries(files).forEach(([path, content]) => {
    if (path.endsWith('.tsx')) {
      const matches = content.match(/<img(?![^>]*alt=)[^>]*>/gi);
      if (matches && matches.length > 0) {
        imagesWithoutAlt.push({ file: path, count: matches.length });
      }
    }
  });
  
  if (imagesWithoutAlt.length > 0) {
    const total = imagesWithoutAlt.reduce((sum, i) => sum + i.count, 0);
    issues.push({
      persona: 'accessibility',
      issue: `${total} image(s) without alt attributes in ${imagesWithoutAlt.map(i => i.file.split('/').pop()).join(', ')}. WCAG 1.1.1 (Non-text Content) violation.`,
      severity: 'critical',
    });
  }
  
  // Check for focus-visible styles
  const hasFocusVisible = 
    Object.values(files).some(content => FOCUS_VISIBLE.test(content)) ||
    files['src/index.css']?.includes('focus-visible');
  
  FOCUS_VISIBLE.lastIndex = 0;
  
  if (!hasFocusVisible) {
    issues.push({
      persona: 'accessibility',
      issue: 'No focus-visible styles detected. Keyboard users cannot see focus location. WCAG 2.4.7 (Focus Visible) violation.',
      severity: 'high',
    });
  }
  
  // Check for uppercase text (reduces legibility)
  const uppercasePatterns: string[] = [];
  Object.entries(files).forEach(([path, content]) => {
    if (path.endsWith('.tsx') && /uppercase.*tracking-widest|tracking-widest.*uppercase/i.test(content)) {
      uppercasePatterns.push(path);
    }
  });
  
  if (uppercasePatterns.length > 3) {
    issues.push({
      persona: 'accessibility',
      issue: `Extensive use of uppercase + tracking-widest (${uppercasePatterns.length} files). Reduces legibility for dyslexic users. WCAG 1.4.8 recommends avoiding all-caps for body text.`,
      severity: 'medium',
    });
  }
  
  // Check for color contrast (heuristic - muted colors often fail)
  const mutedColorUsage = Object.values(files).filter(content =>
    /text-muted-foreground|text-muted|opacity-\d{1,2}[^0]/i.test(content)
  ).length;
  
  if (mutedColorUsage > 5) {
    issues.push({
      persona: 'accessibility',
      issue: 'Extensive use of muted/reduced opacity text. Muted colors typically 3:1 contrast. Body text requires 4.5:1 minimum. Verify WCAG AA compliance.',
      severity: 'high',
    });
  }
  
  // Check for aria-live regions (for dynamic content)
  const hasDynamicContent = Object.values(files).some(content =>
    /toast|notification|alert|loading|counter/i.test(content)
  );
  
  const hasAriaLive = Object.values(files).some(content =>
    /aria-live=["'](?:polite|assertive)/i.test(content)
  );
  
  if (hasDynamicContent && !hasAriaLive) {
    issues.push({
      persona: 'accessibility',
      issue: 'Dynamic content (toasts, alerts, counters) found without aria-live regions. Screen readers won\'t announce updates.',
      severity: 'medium',
    });
  }
  
  return issues;
};
