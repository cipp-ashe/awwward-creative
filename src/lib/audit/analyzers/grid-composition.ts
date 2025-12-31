/**
 * Grid & Composition Analyzer
 * Focus: Negative space. Is the grid honored or intentionally broken?
 */

import type { FrictionPoint, FileContents } from '../types';

/**
 * Determines if a file path is relevant for grid-level composition checks.
 * Only sections, pages, and layout components make grid decisions.
 * UI components (dialogs, sheets, toasts) have legitimate local max-width needs.
 */
const isGridRelevantFile = (path: string): boolean => {
  // Must be a TSX file
  if (!path.endsWith('.tsx')) return false;
  
  // Exclude UI component library (dialogs, sheets, toasts have local constraints)
  if (path.includes('/ui/')) return false;
  
  // Exclude error boundaries (edge case fallback layouts)
  if (path.includes('ErrorBoundary')) return false;
  
  // Include only grid-relevant files
  return (
    path.includes('/sections/') ||
    path.includes('/pages/') ||
    path.includes('/layout/')
  );
};

export const analyzeGridComposition = (files: FileContents): FrictionPoint[] => {
  const issues: FrictionPoint[] = [];
  
  // Define the CONTENT_WIDTH token system - these are valid/intentional
  const contentWidthTokens = [
    'content-narrow',   // 42rem
    'content-default',  // 64rem
    'content-wide',     // 80rem
    'content-max',      // 87.5rem
  ];
  
  // Check for hardcoded max-width without using the token system
  // SCOPED: Only check grid-relevant files (sections, pages, layout)
  const maxWidthPattern = /max-w-(\[?\d*(?:xl|px|rem)\]?|content-(?:narrow|default|wide|max)|[a-z]+)/g;
  const maxWidthValues: { file: string; value: string }[] = [];
  
  Object.entries(files)
    .filter(([path]) => isGridRelevantFile(path))
    .forEach(([path, content]) => {
      let match;
      const regex = new RegExp(maxWidthPattern.source, 'g');
      while ((match = regex.exec(content)) !== null) {
        const value = match[1];
        // Skip content-width tokens (these are the standardized system)
        if (!contentWidthTokens.includes(value)) {
          maxWidthValues.push({ file: path, value });
        }
      }
    });
  
  const uniqueMaxWidths = [...new Set(maxWidthValues.map(m => m.value))];
  // Only flag if there are hardcoded values outside the token system
  if (uniqueMaxWidths.length > 2) {
    issues.push({
      persona: 'grid-composition',
      issue: `${uniqueMaxWidths.length} different max-width values outside token system (${uniqueMaxWidths.join(', ')}). Use max-w-content-* tokens.`,
      severity: 'critical',
    });
  } else if (uniqueMaxWidths.length > 0 && uniqueMaxWidths.length <= 2) {
    // Warn about remaining non-token values
    issues.push({
      persona: 'grid-composition',
      issue: `${uniqueMaxWidths.length} max-width value(s) not using token system: ${uniqueMaxWidths.join(', ')}. Consider migrating to max-w-content-* tokens.`,
      severity: 'medium',
    });
  }
  
  // Define the SPACING token system - these are valid/intentional
  const spacingTokens = ['section-2xs', 'section-xs', 'section-sm', 'section-md', 'section-lg', 'section-xl'];
  
  // Check for inconsistent gap values (excluding token-based gaps)
  // SCOPED: Only check grid-relevant files (sections, pages, layout)
  const gapPattern = /gap-(\d+|section-(?:2xs|xs|sm|md|lg|xl))/g;
  const numericGapValues: number[] = [];
  let tokenGapCount = 0;
  
  Object.entries(files)
    .filter(([path]) => isGridRelevantFile(path))
    .forEach(([, content]) => {
      let match;
      const regex = new RegExp(gapPattern.source, 'g');
      while ((match = regex.exec(content)) !== null) {
        const value = match[1];
        if (spacingTokens.includes(value)) {
          tokenGapCount++;
        } else {
          numericGapValues.push(parseInt(value, 10));
        }
      }
    });
  
  const uniqueGaps = [...new Set(numericGapValues)].sort((a, b) => a - b);
  
  // Check if numeric gaps follow a modular scale (roughly powers of 2 or golden ratio)
  if (uniqueGaps.length > 4) {
    const isModular = uniqueGaps.every((gap, i) => {
      if (i === 0) return true;
      const ratio = gap / uniqueGaps[i - 1];
      return ratio >= 1.5 && ratio <= 2.5;
    });
    
    if (!isModular) {
      issues.push({
        persona: 'grid-composition',
        issue: `Gap values vary: ${uniqueGaps.join(', ')}. No modular scale detected. Consider using gap-section-* tokens.`,
        severity: 'high',
      });
    }
  }
  
  // Check for elements breaking section boundaries
  // SCOPED: Only check grid-relevant files
  const boundaryBreaks = Object.entries(files).filter(([path, content]) =>
    isGridRelevantFile(path) && 
    /-(?:bottom|top)-(?:\d+\/\d+|full|screen)|overflow-visible/i.test(content)
  );
  
  if (boundaryBreaks.length > 0 && boundaryBreaks.length < 3) {
    issues.push({
      persona: 'grid-composition',
      issue: `Only ${boundaryBreaks.length} element(s) break section boundaries. If intentional violation, apply consistently. If not, constrain elements.`,
      severity: 'medium',
    });
  }
  
  // Check for consistent section heights or breathing space
  const sectionFiles = Object.entries(files).filter(([path]) => 
    path.includes('/sections/') && path.endsWith('.tsx')
  );
  
  const sectionPaddings: { file: string; padding: string }[] = [];
  sectionFiles.forEach(([path, content]) => {
    const paddingMatch = content.match(/py-(\d+)|padding[^:]*:\s*['"]([^'"]+)['"]/);
    if (paddingMatch) {
      sectionPaddings.push({ file: path, padding: paddingMatch[1] || paddingMatch[2] });
    }
  });
  
  const uniquePaddings = [...new Set(sectionPaddings.map(s => s.padding))];
  if (sectionFiles.length > 3 && uniquePaddings.length > 2) {
    issues.push({
      persona: 'grid-composition',
      issue: `Sections use ${uniquePaddings.length} different vertical paddings. No rhythm system ensures consistent breathing space.`,
      severity: 'high',
    });
  }
  
  // Check for layout component usage
  const hasLayoutComponent = Object.keys(files).some(path => 
    path.includes('layout/') || path.includes('Layout')
  );
  
  if (!hasLayoutComponent) {
    issues.push({
      persona: 'grid-composition',
      issue: 'No centralized layout component found. Grid decisions scattered across individual components.',
      severity: 'medium',
    });
  }
  
  return issues;
};
