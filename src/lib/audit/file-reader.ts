/**
 * File system utilities for the audit tool
 * These functions run in Node.js context during the audit script
 */

import * as fs from 'fs';
import * as path from 'path';
import type { PatternMatch, FileContents } from './types';

/**
 * Read a file's contents, returning null if file doesn't exist
 */
export const readFile = (filePath: string): string | null => {
  const fullPath = path.join(process.cwd(), filePath);
  try {
    return fs.readFileSync(fullPath, 'utf-8');
  } catch {
    return null;
  }
};

/**
 * Check if a file exists
 */
export const fileExists = (filePath: string): boolean => {
  const fullPath = path.join(process.cwd(), filePath);
  return fs.existsSync(fullPath);
};

/**
 * Get file size in bytes
 */
export const getFileSize = (filePath: string): number => {
  const fullPath = path.join(process.cwd(), filePath);
  try {
    const stats = fs.statSync(fullPath);
    return stats.size;
  } catch {
    return 0;
  }
};

/**
 * Find all files matching a glob-like pattern in a directory
 * Supports basic patterns like *.tsx, **\/*.ts
 */
export const findFiles = (pattern: string, baseDir: string = '.'): string[] => {
  const results: string[] = [];
  const basePath = path.join(process.cwd(), baseDir);
  
  // Simple recursive directory walker
  const walkDir = (dir: string, relativePath: string = '') => {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
        
        if (entry.isDirectory()) {
          // Skip node_modules and hidden directories
          if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
            walkDir(fullPath, relPath);
          }
        } else if (entry.isFile()) {
          // Check if file matches pattern
          if (matchesPattern(entry.name, pattern)) {
            results.push(path.join(baseDir, relPath));
          }
        }
      }
    } catch {
      // Directory doesn't exist or isn't accessible
    }
  };
  
  walkDir(basePath);
  return results;
};

/**
 * Simple pattern matching (supports *.ext format)
 */
const matchesPattern = (filename: string, pattern: string): boolean => {
  if (pattern.startsWith('*.')) {
    const ext = pattern.slice(1); // Get .tsx, .ts, etc.
    return filename.endsWith(ext);
  }
  return filename === pattern;
};

/**
 * Search for a pattern in a file, returning all matches with line numbers
 */
export const searchInFile = (filePath: string, regex: RegExp): PatternMatch[] => {
  const content = readFile(filePath);
  if (!content) return [];
  
  const matches: PatternMatch[] = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const lineMatches = line.match(regex);
    if (lineMatches) {
      matches.push({
        file: filePath,
        line: index + 1,
        match: lineMatches[0],
        context: line.trim(),
      });
    }
  });
  
  return matches;
};

/**
 * Search for a pattern across multiple files
 */
export const searchInFiles = (filePaths: string[], regex: RegExp): PatternMatch[] => {
  const allMatches: PatternMatch[] = [];
  
  for (const filePath of filePaths) {
    const matches = searchInFile(filePath, regex);
    allMatches.push(...matches);
  }
  
  return allMatches;
};

/**
 * Read multiple files and return a FileContents map
 */
export const readMultipleFiles = (filePaths: string[]): FileContents => {
  const contents: FileContents = {};
  
  for (const filePath of filePaths) {
    const content = readFile(filePath);
    if (content !== null) {
      contents[filePath] = content;
    }
  }
  
  return contents;
};

/**
 * Get all source files for a typical React/Vite project
 */
export const getProjectFiles = (): FileContents => {
  const filesToRead = [
    'src/index.css',
    'tailwind.config.ts',
    'package.json',
    'src/App.tsx',
    'src/main.tsx',
    'index.html',
  ];
  
  // Add all component files
  const componentFiles = findFiles('*.tsx', 'src/components');
  const sectionFiles = findFiles('*.tsx', 'src/components/sections');
  const pageFiles = findFiles('*.tsx', 'src/pages');
  const hookFiles = findFiles('*.ts', 'src/hooks');
  const constantFiles = findFiles('*.ts', 'src/constants');
  
  const allFiles = [
    ...filesToRead,
    ...componentFiles,
    ...sectionFiles,
    ...pageFiles,
    ...hookFiles,
    ...constantFiles,
  ];
  
  return readMultipleFiles(allFiles);
};
