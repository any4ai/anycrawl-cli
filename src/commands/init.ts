/**
 * Init command - one command to install CLI, authenticate, and add skills
 */

import { execSync } from 'child_process';
import { isAuthenticated } from '../utils/auth';
import { saveCredentials } from '../utils/credentials';
import { updateConfig } from '../utils/config';
import { handleSetupCommand } from './setup';
import { ensureAuthenticated } from '../utils/auth';

export interface InitOptions {
  global?: boolean;
  agent?: string;
  all?: boolean;
  yes?: boolean;
  skipInstall?: boolean;
  skipAuth?: boolean;
  skipSkills?: boolean;
  apiKey?: string;
}

export async function handleInitCommand(options: InitOptions = {}): Promise<void> {
  const cyan = '\x1b[36m';
  const reset = '\x1b[0m';
  const dim = '\x1b[2m';
  const bold = '\x1b[1m';
  const green = '\x1b[32m';

  console.log('');
  console.log(`  ${cyan}◇ ${bold}anycrawl${reset} ${dim}init${reset}`);
  console.log('');

  if (!options.skipInstall) {
    console.log('[1/3] Installing anycrawl-cli globally...');
    try {
      execSync('npm install -g anycrawl-cli', { stdio: 'inherit' });
      console.log(`${green}✓${reset} CLI installed\n`);
    } catch {
      console.error('\nFailed to install. Try: npm install -g anycrawl-cli\n');
      process.exit(1);
    }
  }

  if (!options.skipAuth) {
    console.log('[2/3] Authenticating...');
    if (isAuthenticated()) {
      console.log(`${green}✓${reset} Already authenticated\n`);
    } else if (options.apiKey) {
      saveCredentials({ apiKey: options.apiKey });
      updateConfig({ apiKey: options.apiKey });
      console.log(`${green}✓${reset} Authenticated\n`);
    } else {
      await ensureAuthenticated();
      console.log('');
    }
  }

  if (!options.skipSkills) {
    console.log('[3/3] Installing AnyCrawl skill...');
    try {
      await handleSetupCommand('skills', {
        global: options.global,
        agent: options.agent,
      });
      console.log(`${green}✓${reset} Skill installed\n`);
    } catch (e) {
      console.error('\nFailed to install skills:', e instanceof Error ? e.message : e);
      console.log('Retry with: anycrawl setup skills\n');
    }
  }

  console.log(`${green}${bold}Setup complete!${reset} Run ${dim}anycrawl --help${reset} to get started.\n`);
}
