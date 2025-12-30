/**
 * Shared types for the dynamic Awwwards audit system
 */

export type ExpertPersona = 
  | 'art-direction'
  | 'typography'
  | 'grid-composition'
  | 'motion'
  | 'ux-navigation'
  | 'accessibility'
  | 'dev-performance';

export type AuditPillar = 'design' | 'usability' | 'creativity' | 'content';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Represents a single issue identified by an expert persona.
 */
export interface FrictionPoint {
  /** The expert persona that identified this issue */
  persona: ExpertPersona;
  /** Detailed description of the issue with file:line references */
  issue: string;
  /** Severity level determining score impact */
  severity: Severity;
  /** File where the issue was found */
  file?: string;
  /** Line number(s) where issue occurs */
  line?: number | string;
  /** Other expert personas whose recommendations conflict with this one */
  conflictsWith?: ExpertPersona[];
}

export interface PillarScore {
  pillar: AuditPillar;
  score: number; // 1-10
  rationale: string;
}

export interface AuditResult {
  scores: PillarScore[];
  frictionPoints: FrictionPoint[];
  synthesis: string;
  overallScore: number;
  /** Timestamp of when the audit was run */
  timestamp: string;
  /** Files that were analyzed */
  filesAnalyzed: number;
}

/**
 * File content map passed to analyzers
 */
export interface FileContents {
  [filePath: string]: string;
}

/**
 * Pattern match result from file search
 */
export interface PatternMatch {
  file: string;
  line: number;
  match: string;
  context?: string;
}

/**
 * Analyzer function signature
 */
export type AnalyzerFn = (files: FileContents) => FrictionPoint[];
