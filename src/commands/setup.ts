/**
 * Setup command implementation
 * Installs AnyCrawl skills via npx skills add and configures MCP
 */

import { execSync } from 'child_process';
import { getApiKey } from '../utils/config';
import { buildSkillsInstallArgs } from './skills-install';

export type SetupSubcommand = 'skills' | 'mcp';

export interface SetupOptions {
  global?: boolean;
  agent?: string;
}

/**
 * Install skills by running npx skills add any4ai/anycrawl-cli --full-depth
 */
async function installSkills(options: SetupOptions): Promise<void> {
  const args = buildSkillsInstallArgs({
    agent: options.agent,
    global: options.global ?? true,
    includeNpxYes: true,
  });

  const cmd = args.join(' ');
  console.log(`Running: ${cmd}\n`);

  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log('\nRestart your AI coding agent to pick up the new skills.');
  } catch {
    process.exit(1);
  }
}

/**
 * Configure MCP for AnyCrawl
 */
async function installMcp(_options: SetupOptions): Promise<void> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('No API key found. Run `anycrawl login` first.');
    process.exit(1);
  }

  const mcpUrl = `https://mcp.anycrawl.dev/${apiKey}/mcp`;
  console.log('AnyCrawl MCP URL:', mcpUrl);
  console.log('\nAdd this to your MCP configuration (e.g., Cursor MCP settings):');
  console.log(JSON.stringify({ url: mcpUrl }, null, 2));
  console.log('\nOr use add-mcp if available:');
  console.log(`npx add-mcp "${mcpUrl}" --name anycrawl`);
}

export async function handleSetupCommand(
  subcommand: SetupSubcommand,
  options: SetupOptions = {}
): Promise<void> {
  switch (subcommand) {
    case 'skills':
      await installSkills(options);
      break;
    case 'mcp':
      await installMcp(options);
      break;
    default:
      console.error(`Unknown subcommand: ${subcommand}`);
      console.log('\nAvailable: skills, mcp');
      process.exit(1);
  }
}
