/**
 * Authentication utilities for AnyCrawl CLI
 * API key only - no browser OAuth
 */

import * as readline from 'readline';
import {
  loadCredentials,
  saveCredentials,
} from './credentials';
import { updateConfig, getApiKey } from './config';

const DEFAULT_API_URL = 'https://api.anycrawl.dev';

function promptInput(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function envVarLogin(): { apiKey: string; apiUrl: string } | null {
  const apiKey = process.env.ANYCRAWL_API_KEY;
  if (apiKey && apiKey.length > 0) {
    return {
      apiKey,
      apiUrl: process.env.ANYCRAWL_API_URL || DEFAULT_API_URL,
    };
  }
  return null;
}

function printBanner(): void {
  const cyan = '\x1b[36m';
  const reset = '\x1b[0m';
  const dim = '\x1b[2m';
  const bold = '\x1b[1m';
  const packageJson = require('../../package.json');
  const version = packageJson.version || 'unknown';

  console.log('');
  console.log(
    `  ${cyan}◇ ${bold}anycrawl${reset} ${dim}cli${reset} ${dim}v${version}${reset}`
  );
  console.log(`  ${dim}Web scraping for LLMs${reset}`);
  console.log('');
}

async function manualLogin(
  apiUrl: string = DEFAULT_API_URL
): Promise<{ apiKey: string; apiUrl: string }> {
  const isCustomUrl = apiUrl !== DEFAULT_API_URL;
  console.log('');

  if (isCustomUrl) {
    const apiKey = await promptInput(
      'Enter your API key (press Enter to skip for self-hosted): '
    );
    return { apiKey: apiKey.trim(), apiUrl };
  }

  const apiKey = await promptInput('Enter your AnyCrawl API key: ');

  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('API key cannot be empty');
  }

  return { apiKey: apiKey.trim(), apiUrl };
}

async function interactiveLogin(
  apiUrl?: string
): Promise<{ apiKey: string; apiUrl: string }> {
  const effectiveApiUrl = apiUrl || DEFAULT_API_URL;

  const envResult = envVarLogin();
  if (envResult) {
    printBanner();
    console.log('✓ Using ANYCRAWL_API_KEY from environment variable\n');
    return envResult;
  }

  printBanner();

  if (effectiveApiUrl !== DEFAULT_API_URL) {
    console.log(`Configuring CLI for custom API: ${effectiveApiUrl}\n`);
    return manualLogin(effectiveApiUrl);
  }

  console.log('Welcome! To get started, authenticate with your AnyCrawl account.\n');
  console.log('Tip: Get your API key from https://anycrawl.dev/dashboard');
  console.log('     Or set ANYCRAWL_API_KEY environment variable\n');

  return manualLogin(effectiveApiUrl);
}

export { printBanner };

export function isAuthenticated(): boolean {
  const apiKey = getApiKey();
  return !!apiKey && apiKey.length > 0;
}

export async function ensureAuthenticated(): Promise<string> {
  const existingKey = getApiKey();
  if (existingKey) return existingKey;

  try {
    const result = await interactiveLogin();

    saveCredentials({
      apiKey: result.apiKey,
      apiUrl: result.apiUrl,
    });

    updateConfig({
      apiKey: result.apiKey,
      apiUrl: result.apiUrl,
    });

    console.log('\n✓ Login successful!');
    return result.apiKey;
  } catch (error) {
    console.error(
      '\nAuthentication failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    process.exit(1);
  }
}
