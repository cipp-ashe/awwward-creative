/**
 * Awwwards Jury Simulation - Dynamic Analyzer
 * 
 * Dynamically analyzes the codebase through 7 expert personas.
 * Reads actual files and detects patterns in real-time.
 */

import { getProjectFiles } from './audit/file-reader';
import {
  analyzeArtDirection,
  analyzeTypography,
  analyzeGridComposition,
  analyzeMotion,
  analyzeUXNavigation,
  analyzeAccessibility,
  analyzeDevPerformance,
} from './audit/analyzers';
import type { 
  FrictionPoint, 
  PillarScore, 
  AuditResult, 
  AuditPillar,
  FileContents,
} from './audit/types';

// Re-export types for external use
export type { FrictionPoint, PillarScore, AuditResult, AuditPillar };
export type ExpertPersona = FrictionPoint['persona'];

// ============================================================================
// SCORING SYSTEM
// ============================================================================

const calculateScores = (frictionPoints: FrictionPoint[]): PillarScore[] => {
  const calculatePillarScore = (
    pillar: AuditPillar,
    personas: ExpertPersona[],
    rationale: string
  ): PillarScore => {
    const relevantIssues = frictionPoints.filter(p => personas.includes(p.persona));
    const criticals = relevantIssues.filter(i => i.severity === 'critical').length;
    const highs = relevantIssues.filter(i => i.severity === 'high').length;
    const mediums = relevantIssues.filter(i => i.severity === 'medium').length;
    
    // Adjusted scoring: less aggressive penalties
    const score = Math.max(1, Math.min(10, 
      10 - (criticals * 2) - (highs * 1) - (mediums * 0.3)
    ));
    
    return {
      pillar,
      score: Math.round(score * 10) / 10,
      rationale: `${criticals} critical, ${highs} high, ${mediums} medium severity issues in ${rationale}.`,
    };
  };

  return [
    calculatePillarScore('design', ['art-direction', 'typography', 'grid-composition'], 'art direction, typography, and composition'),
    calculatePillarScore('usability', ['ux-navigation', 'accessibility'], 'navigation and accessibility'),
    calculatePillarScore('creativity', ['motion', 'art-direction'], 'motion design and art direction'),
    calculatePillarScore('content', ['typography', 'grid-composition', 'dev-performance'], 'typography, grid, and technical implementation'),
  ];
};

// ============================================================================
// SYNTHESIS GENERATION
// ============================================================================

const generateSynthesis = (frictionPoints: FrictionPoint[], scores: PillarScore[]): string => {
  const conflicts = frictionPoints.filter(p => p.conflictsWith && p.conflictsWith.length > 0);
  const criticalIssues = frictionPoints.filter(p => p.severity === 'critical');
  const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;

  let synthesis = `**Average Score: ${Math.round(avgScore * 10) / 10}/10**\n\n`;

  if (conflicts.length > 0) {
    synthesis += `**Expert Conflicts Detected:**\n\n`;
    conflicts.slice(0, 3).forEach(conflict => {
      synthesis += `- **${conflict.persona}** vs **${conflict.conflictsWith?.join(', ')}**: ${conflict.issue.slice(0, 100)}...\n\n`;
    });
  }

  synthesis += `**Most Impactful Action:**\n\n`;
  if (criticalIssues.length > 0) {
    const topIssue = criticalIssues[0];
    synthesis += `Address **${topIssue.persona}** issue: ${topIssue.issue}\n\n`;
  } else {
    synthesis += `No critical issues found. Focus on high-severity items for polish.\n\n`;
  }

  synthesis += `**Summary:** ${frictionPoints.length} issues detected (${criticalIssues.length} critical). `;
  synthesis += avgScore >= 8 ? 'Strong foundation.' : avgScore >= 6 ? 'Needs refinement.' : 'Significant work required.';

  return synthesis;
};

// ============================================================================
// MAIN AUDIT FUNCTION
// ============================================================================

export const runAwwwardsAudit = (): AuditResult => {
  // Read all project files dynamically
  const files: FileContents = getProjectFiles();
  const filesAnalyzed = Object.keys(files).length;

  // Run all analyzers with actual file contents
  const frictionPoints: FrictionPoint[] = [
    ...analyzeArtDirection(files),
    ...analyzeTypography(files),
    ...analyzeGridComposition(files),
    ...analyzeMotion(files),
    ...analyzeUXNavigation(files),
    ...analyzeAccessibility(files),
    ...analyzeDevPerformance(files),
  ];

  const scores = calculateScores(frictionPoints);
  const synthesis = generateSynthesis(frictionPoints, scores);
  const overallScore = Math.round((scores.reduce((sum, s) => sum + s.score, 0) / scores.length) * 10) / 10;

  return {
    scores,
    frictionPoints,
    synthesis,
    overallScore,
    timestamp: new Date().toISOString(),
    filesAnalyzed,
  };
};

// ============================================================================
// FORMATTING
// ============================================================================

export const formatAuditResult = (result: AuditResult): string => {
  const severityEmoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' };
  
  let output = `# Awwwards Jury Simulation Report\n\n`;
  output += `*Generated: ${result.timestamp}*\n`;
  output += `*Files Analyzed: ${result.filesAnalyzed}*\n\n`;
  output += `## Overall Score: ${result.overallScore}/10\n\n`;

  output += `## Pillar Scores\n\n`;
  result.scores.forEach(s => {
    output += `- **${s.pillar.charAt(0).toUpperCase() + s.pillar.slice(1)}**: ${s.score}/10 — ${s.rationale}\n`;
  });

  output += `\n## Synthesis\n\n${result.synthesis}\n\n`;

  output += `## Friction Points (${result.frictionPoints.length} total)\n\n`;
  
  const grouped = result.frictionPoints.reduce((acc, fp) => {
    acc[fp.persona] = acc[fp.persona] || [];
    acc[fp.persona].push(fp);
    return acc;
  }, {} as Record<string, FrictionPoint[]>);

  Object.entries(grouped).forEach(([persona, issues]) => {
    output += `### ${persona}\n\n`;
    issues.forEach(issue => {
      output += `${severityEmoji[issue.severity]} **[${issue.severity.toUpperCase()}]** ${issue.issue}\n\n`;
    });
  });

  return output;
};
