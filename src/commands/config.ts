/**
 * Config command implementation
 * configure: set API key/URL (with login flow when not authenticated)
 * viewConfig: read-only display of current configuration
 */

import { loadCredentials, getConfigDirectoryPath } from '../utils/credentials';
import { getConfig } from '../utils/config';
import { isAuthenticated } from '../utils/auth';

export interface ConfigureOptions {
  apiKey?: string;
  apiUrl?: string;
}

/**
 * Configure - set API key/URL or trigger login when not authenticated
 */
export async function configure(options: ConfigureOptions = {}): Promise<void> {
  if (!isAuthenticated() || options.apiKey || options.apiUrl) {
    const { handleLoginCommand } = await import('./login');
    await handleLoginCommand({
      apiKey: options.apiKey,
      apiUrl: options.apiUrl,
    });
    return;
  }
  await viewConfig();
  console.log('To re-authenticate, run: anycrawl logout && anycrawl login\n');
}

/**
 * View current configuration (read-only)
 */
export async function viewConfig(): Promise<void> {
  const credentials = loadCredentials();
  const config = getConfig();

  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│          AnyCrawl Configuration         │');
  console.log('└─────────────────────────────────────────┘\n');

  if (isAuthenticated()) {
    const maskedKey = credentials?.apiKey
      ? `${credentials.apiKey.substring(0, 6)}...${credentials.apiKey.slice(-4)}`
      : 'Not set';

    console.log('Status: ✓ Authenticated\n');
    console.log(`API Key:  ${maskedKey}`);
    console.log(`API URL:  ${config.apiUrl || 'https://api.anycrawl.dev'}`);
    console.log(`Config:   ${getConfigDirectoryPath()}`);
    console.log('\nCommands:');
    console.log('  anycrawl logout       Clear credentials');
    console.log('  anycrawl login        Re-authenticate');
  } else {
    console.log('Status: Not authenticated\n');
    console.log('Run any command to start authentication, or use:');
    console.log('  anycrawl login        Authenticate with API key');
  }
  console.log('');
}
