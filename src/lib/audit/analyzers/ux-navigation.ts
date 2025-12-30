/**
 * UX/Navigation Analyzer
 * Focus: Is the "happy path" intuitive? Flag "mystery meat" navigation or dead ends.
 */

import type { FrictionPoint, FileContents } from '../types';

export const analyzeUXNavigation = (files: FileContents): FrictionPoint[] => {
  const issues: FrictionPoint[] = [];
  
  // Check for NavigationBar component
  const hasNavigation = Object.keys(files).some(path => 
    /navigation|navbar|header/i.test(path)
  );
  
  if (!hasNavigation) {
    issues.push({
      persona: 'ux-navigation',
      issue: 'No navigation component found. Users lack anchor points for orientation.',
      severity: 'high',
    });
  } else {
    // Check if navigation is conditionally hidden
    const navContent = Object.entries(files).find(([path]) => 
      /navigation|navbar/i.test(path)
    )?.[1] || '';
    
    const isHiddenOnScroll = /hidden|opacity-0|translate.*-100|invisible/i.test(navContent) &&
                             /scroll|onScroll/i.test(navContent);
    
    if (isHiddenOnScroll) {
      // Check if it reappears
      const reappears = /scroll.*up|scrollDirection|show/i.test(navContent);
      if (!reappears) {
        issues.push({
          persona: 'ux-navigation',
          issue: 'Navigation hides on scroll but may not reappear. Users lose anchor points mid-page.',
          severity: 'medium',
        });
      }
    }
  }
  
  // Check for section anchors/IDs
  const sectionIds: string[] = [];
  Object.entries(files).forEach(([path, content]) => {
    if (path.includes('/sections/') && path.endsWith('.tsx')) {
      const idMatch = content.match(/id=["']([^"']+)["']/);
      if (idMatch) {
        sectionIds.push(idMatch[1]);
      }
    }
  });
  
  // Check if navigation links to sections
  // Look for href="#section", scrollToSection, scrollIntoView, or data-driven navigation
  const hasNavigationLinks = Object.values(files).some((content) => {
    // Traditional anchor links
    const hasAnchorLinks = /href=["']#/i.test(content);
    // Button-based scroll navigation (scrollToSection, scrollIntoView patterns)
    const hasScrollNavigation = /scrollTo(Section|Element|Id)|\.scrollIntoView/i.test(content);
    // Data-driven navigation (NAVIGATION_SECTIONS.map, navItems.map, etc.)
    const hasMappedNavigation = /NAVIGATION_SECTIONS\.map|navItems\.map|sections\.map/i.test(content);
    // onClick with section scroll
    const hasClickScroll = /onClick.*scroll|scroll.*onClick/i.test(content);
    
    return hasAnchorLinks || hasScrollNavigation || hasMappedNavigation || hasClickScroll;
  });
  
  if (sectionIds.length > 0 && !hasNavigationLinks) {
    issues.push({
      persona: 'ux-navigation',
      issue: `${sectionIds.length} sections have IDs (${sectionIds.slice(0, 3).join(', ')}) but no navigation links found. Users cannot navigate via menu.`,
      severity: 'medium',
    });
  }
  
  // Check for preloader with artificial delay
  const preloaderContent = Object.entries(files).find(([path, content]) =>
    /preloader/i.test(path) || /minDuration|MIN_DURATION/i.test(content)
  );
  
  if (preloaderContent) {
    const [, content] = preloaderContent;
    const durationMatch = content.match(/(?:minDuration|MIN_DURATION)[:\s=]+(\d+)/i);
    
    if (durationMatch) {
      const duration = parseInt(durationMatch[1], 10);
      if (duration > 1000) {
        issues.push({
          persona: 'ux-navigation',
          issue: `Preloader with ${duration}ms minimum duration. If assets load faster, user waits for aesthetics. Content hostage to animation budget.`,
          severity: duration > 2000 ? 'critical' : 'high',
        });
      }
    }
  }
  
  // Check for custom cursor potentially hiding affordances
  const hasCustomCursor = Object.keys(files).some(path => 
    /cursor/i.test(path)
  );
  
  if (hasCustomCursor) {
    const cursorContent = Object.entries(files).find(([path]) => 
      /cursor/i.test(path)
    )?.[1] || '';
    
    const hidesNativeCursor = /cursor:\s*none|cursor-none/i.test(cursorContent);
    
    if (hidesNativeCursor) {
      issues.push({
        persona: 'ux-navigation',
        issue: 'CustomCursor hides native pointer. Hover states must compensate for lost affordance on clickable elements.',
        severity: 'high',
        conflictsWith: ['accessibility'],
      });
    }
  }
  
  // Check for reveal/scroll animations that might delay content
  const revealPatterns = Object.entries(files).filter(([path, content]) =>
    /reveal|SectionReveal|ScrollReveal/i.test(path) || 
    (/reveal/i.test(content) && /opacity:\s*0|opacity-0/i.test(content))
  );
  
  if (revealPatterns.length > 0) {
    // Check if there's a reduced-motion fallback
    const hasProgressiveEnhancement = Object.values(files).some(content =>
      /noscript|prefers-reduced-motion.*opacity|initial.*opacity.*1/i.test(content)
    );
    
    if (!hasProgressiveEnhancement) {
      issues.push({
        persona: 'ux-navigation',
        issue: 'Reveal animations delay content visibility. No progressive enhancement evidence. If JS fails, content may stay hidden.',
        severity: 'high',
        conflictsWith: ['accessibility'],
      });
    }
  }
  
  // Check for scroll indicator
  const hasScrollIndicator = Object.values(files).some(content =>
    /scroll.*indicator|scroll.*down|arrow.*down.*animate/i.test(content)
  );
  
  const isSinglePageApp = Object.keys(files).filter(path => 
    path.includes('/pages/') && path.endsWith('.tsx')
  ).length <= 2;
  
  if (!hasScrollIndicator && isSinglePageApp) {
    issues.push({
      persona: 'ux-navigation',
      issue: 'No scroll indicator on single-page layout. Users may not realize page scrolls, especially on hero-focused designs.',
      severity: 'low',
    });
  }
  
  return issues;
};
