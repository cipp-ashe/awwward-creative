#!/usr/bin/env node
/**
 * CLI runner for Awwwards Jury Simulation
 * 
 * Usage:
 *   npm run audit
 *   node scripts/run-audit.ts
 */

import { runAwwwardsAudit, formatAuditResult } from '../src/lib/awwwards-audit';
import * as fs from 'fs';
import * as path from 'path';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const colorizeOutput = (markdown: string): string => {
  // Color scores based on value
  markdown = markdown.replace(/(\d+\.\d+)\/10/g, (match, score) => {
    const numScore = parseFloat(score);
    const color = numScore >= 8 ? colors.green : numScore >= 6 ? colors.yellow : colors.red;
    return `${color}${match}${colors.reset}`;
  });

  // Color severity levels
  markdown = markdown.replace(/🔴 \*\*\[CRITICAL\]\*\*/g, `${colors.red}🔴 **[CRITICAL]**${colors.reset}`);
  markdown = markdown.replace(/🟠 \*\*\[HIGH\]\*\*/g, `${colors.yellow}🟠 **[HIGH]**${colors.reset}`);
  markdown = markdown.replace(/🟡 \*\*\[MEDIUM\]\*\*/g, `${colors.yellow}🟡 **[MEDIUM]**${colors.reset}`);

  // Color headers
  markdown = markdown.replace(/^(#{1,3}) (.+)$/gm, `${colors.cyan}$1 $2${colors.reset}`);

  // Color emphasis
  markdown = markdown.replace(/\*\*(.+?)\*\*/g, `${colors.bright}$1${colors.reset}`);

  return markdown;
};

const main = () => {
  console.log(`${colors.magenta}${colors.bright}`);
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                ║');
  console.log('║             AWWWARDS JURY SIMULATION                           ║');
  console.log('║             Aiming for Site of the Year                        ║');
  console.log('║                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  console.log();

console.log(`${colors.cyan}Scanning codebase...${colors.reset}`);
  console.log();

  // Run audit
  const result = runAwwwardsAudit();
  
  console.log(`${colors.green}✓ Analyzed ${result.filesAnalyzed} files${colors.reset}`);
  console.log(`${colors.cyan}Generated at: ${result.timestamp}${colors.reset}`);
  console.log();
  
  const markdown = formatAuditResult(result);

  // Output to console with colors
  console.log(colorizeOutput(markdown));

  // Save to file
  const outputPath = path.join(process.cwd(), 'AUDIT_REPORT.md');
  fs.writeFileSync(outputPath, markdown);

  console.log(`${colors.green}✓ Audit report saved to: ${outputPath}${colors.reset}`);
  console.log();

  // Threshold for CI/CD pass
  const SCORE_THRESHOLD = 8.0;

  // Exit with code based on overall score
  if (result.overallScore < SCORE_THRESHOLD) {
    console.log(`${colors.red}${colors.bright}FAILURE: Score ${result.overallScore}/10 is below threshold (${SCORE_THRESHOLD})${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`${colors.green}${colors.bright}PASS: Score ${result.overallScore}/10 meets threshold${colors.reset}`);
    process.exit(0);
  }
};

main();
