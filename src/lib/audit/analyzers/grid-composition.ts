/**
 * Grid & Composition Analyzer
 * Focus: Negative space. Is the grid honored or intentionally broken?
 */

import type { FrictionPoint, FileContents } from '../types';

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
  const maxWidthPattern = /max-w-(\[?\d*(?:xl|px|rem)\]?|content-(?:narrow|default|wide|max)|[a-z]+)/g;
  const maxWidthValues: { file: string; value: string }[] = [];
  
  Object.entries(files).forEach(([path, content]) => {
    if (path.endsWith('.tsx')) {
      let match;
      const regex = new RegExp(maxWidthPattern.source, 'g');
      while ((match = regex.exec(content)) !== null) {
        const value = match[1];
        // Skip content-width tokens (these are the standardized system)
        if (!contentWidthTokens.includes(value)) {
          maxWidthValues.push({ file: path, value });
        }
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
  
  // Check for inconsistent gap values
  const gapPattern = /gap-(\d+)/g;
  const gapValues: number[] = [];
  
  Object.values(files).forEach(content => {
    let match;
    const regex = new RegExp(gapPattern.source, 'g');
    while ((match = regex.exec(content)) !== null) {
      gapValues.push(parseInt(match[1], 10));
    }
  });
  
  const uniqueGaps = [...new Set(gapValues)].sort((a, b) => a - b);
  
  // Check if gaps follow a modular scale (roughly powers of 2 or golden ratio)
  if (uniqueGaps.length > 4) {
    const isModular = uniqueGaps.every((gap, i) => {
      if (i === 0) return true;
      const ratio = gap / uniqueGaps[i - 1];
      return ratio >= 1.5 && ratio <= 2.5;
    });
    
    if (!isModular) {
      issues.push({
        persona: 'grid-composition',
        issue: `Gap values vary: ${uniqueGaps.join(', ')}. No modular scale detected. Spacing feels arbitrary.`,
        severity: 'high',
      });
    }
  }
  
  // Check for elements breaking section boundaries
  const boundaryBreaks = Object.entries(files).filter(([path, content]) =>
    path.endsWith('.tsx') && 
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
