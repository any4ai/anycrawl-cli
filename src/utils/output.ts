/**
 * Output utilities for CLI
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Write output to file or stdout
 */
export function writeOutput(
  content: string | object,
  options: {
    output?: string;
    json?: boolean;
    pretty?: boolean;
  } = {}
): void {
  const { output: outputPath, json = false, pretty = false } = options;

  let outputContent: string;
  if (typeof content === 'object') {
    outputContent = pretty
      ? JSON.stringify(content, null, 2)
      : JSON.stringify(content);
  } else {
    outputContent = content;
  }

  if (outputPath) {
    const dir = path.dirname(outputPath);
    if (dir && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, outputContent, 'utf-8');
    console.error(`Output written to: ${outputPath}`);
  } else {
    if (!outputContent.endsWith('\n')) {
      outputContent += '\n';
    }
    process.stdout.write(outputContent);
  }
}

/**
 * Determine if output should be JSON based on flag or file extension
 */
export function shouldOutputJson(
  outputPath?: string,
  jsonFlag?: boolean
): boolean {
  if (jsonFlag) return true;
  if (outputPath && outputPath.toLowerCase().endsWith('.json')) {
    return true;
  }
  return false;
}
