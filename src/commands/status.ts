/**
 * Status command implementation
 * Displays CLI version, auth status, API health, and local .anycrawl status
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { isAuthenticated } from '../utils/auth';
import { getConfig, validateConfig } from '../utils/config';
import { loadCredentials } from '../utils/credentials';
import { getClient } from '../utils/client';

const packageJson = require('../../package.json');

type AuthSource = 'env' | 'stored' | 'none';

interface StatusResult {
  version: string;
  authenticated: boolean;
  authSource: AuthSource;
  apiHealthy?: boolean;
  error?: string;
}

interface LocalStatus {
  gitignoreExists: boolean;
  gitignoreHasAnycrawl: boolean;
  anycrawlDirExists: boolean;
  anycrawlFileCount: number;
}

function getAuthSource(): AuthSource {
  if (process.env.ANYCRAWL_API_KEY) {
    return 'env';
  }
  const stored = loadCredentials();
  if (stored?.apiKey) {
    return 'stored';
  }
  return 'none';
}

/**
 * Get full status information
 */
export async function getStatus(): Promise<StatusResult> {
  const authSource = getAuthSource();
  const result: StatusResult = {
    version: packageJson.version,
    authenticated: isAuthenticated(),
    authSource,
  };

  if (!result.authenticated) {
    return result;
  }

  try {
    const config = getConfig();
    const apiKey = config.apiKey;
    validateConfig(apiKey);

    const client = await getClient();
    const health = await client.healthCheck();
    result.apiHealthy = health?.status === 'ok';
  } catch (error: unknown) {
    result.error = error instanceof Error ? error.message : 'Failed to fetch status';
  }

  return result;
}

function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Check local repo status for .gitignore and .anycrawl
 */
async function getLocalStatus(cwd: string): Promise<LocalStatus> {
  const gitignorePath = path.join(cwd, '.gitignore');
  let gitignoreExists = false;
  let gitignoreHasAnycrawl = false;

  try {
    const content = await fs.readFile(gitignorePath, 'utf8');
    gitignoreExists = true;
    const lines = content.split(/\r?\n/);
    gitignoreHasAnycrawl = lines.some((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        return false;
      }
      return /^\/?\.anycrawl(?:\/|$)/.test(trimmed);
    });
  } catch {
    gitignoreExists = false;
  }

  const anycrawlDir = path.join(cwd, '.anycrawl');
  let anycrawlDirExists = false;
  let anycrawlFileCount = 0;

  async function countFiles(dir: string): Promise<number> {
    let count = 0;
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        count += await countFiles(fullPath);
      } else if (entry.isFile() && !entry.name.startsWith('.')) {
        count += 1;
      }
    }
    return count;
  }

  try {
    const stat = await fs.stat(anycrawlDir);
    if (stat.isDirectory()) {
      anycrawlDirExists = true;
      anycrawlFileCount = await countFiles(anycrawlDir);
    }
  } catch {
    anycrawlDirExists = false;
  }

  return {
    gitignoreExists,
    gitignoreHasAnycrawl,
    anycrawlDirExists,
    anycrawlFileCount,
  };
}

/**
 * Handle status command output
 */
export async function handleStatusCommand(): Promise<void> {
  const cyan = '\x1b[36m';
  const reset = '\x1b[0m';
  const dim = '\x1b[2m';
  const bold = '\x1b[1m';
  const green = '\x1b[32m';
  const red = '\x1b[31m';

  const status = await getStatus();
  const localStatus = await getLocalStatus(process.cwd());

  console.log('');
  console.log(
    `  ${cyan}◇ ${bold}anycrawl${reset} ${dim}cli${reset} ${dim}v${status.version}${reset}`
  );
  console.log('');

  if (status.authenticated) {
    const sourceLabel =
      status.authSource === 'env'
        ? 'via ANYCRAWL_API_KEY'
        : 'via stored credentials';
    console.log(
      `  ${green}●${reset} Authenticated ${dim}${sourceLabel}${reset}`
    );
    if (status.apiHealthy !== undefined) {
      const apiLabel = status.apiHealthy ? 'ok' : 'unreachable';
      console.log(`  ${status.apiHealthy ? green : red}●${reset} API ${dim}${apiLabel}${reset}`);
    }
    if (status.error) {
      console.log(`  ${dim}Could not reach API: ${status.error}${reset}`);
    }
  } else {
    console.log(`  ${red}●${reset} Not authenticated`);
    console.log(`  ${dim}Run 'anycrawl login' to authenticate${reset}`);
  }

  console.log('');
  if (localStatus.anycrawlDirExists) {
    console.log(
      `  ${dim}.anycrawl:${reset} present ${dim}- ${formatNumber(localStatus.anycrawlFileCount)} files${reset}`
    );
  } else {
    console.log(
      `  ${dim}.anycrawl:${reset} not found ${dim}- no local cache${reset}`
    );
  }
  if (localStatus.gitignoreExists) {
    const ignoredLabel = localStatus.gitignoreHasAnycrawl ? 'yes' : 'no';
    console.log(
      `  ${dim}.gitignore:${reset} present ${dim}- .anycrawl ignored: ${ignoredLabel}${reset}`
    );
  } else {
    console.log(
      `  ${dim}.gitignore:${reset} missing ${dim}- add .anycrawl/ to ignore cache${reset}`
    );
  }
  console.log('');
}
