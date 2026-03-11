/**
 * Login command implementation
 * API key only - no browser OAuth
 */

import { saveCredentials, getConfigDirectoryPath } from '../utils/credentials';
import { updateConfig } from '../utils/config';
import { isAuthenticated, ensureAuthenticated } from '../utils/auth';

const DEFAULT_API_URL = 'https://api.anycrawl.dev';

export interface LoginOptions {
  apiKey?: string;
  apiUrl?: string;
}

/**
 * Main login command handler
 */
export async function handleLoginCommand(options: LoginOptions = {}): Promise<void> {
  const apiUrl = (options.apiUrl || DEFAULT_API_URL).replace(/\/$/, '');

  if (isAuthenticated() && !options.apiKey) {
    console.log('You are already logged in.');
    console.log(`Credentials stored at: ${getConfigDirectoryPath()}`);
    console.log('\nTo login with a different account:');
    console.log('  anycrawl logout && anycrawl login');
    return;
  }

  if (options.apiKey) {
    try {
      saveCredentials({ apiKey: options.apiKey, apiUrl });
      updateConfig({ apiKey: options.apiKey, apiUrl });
      console.log('✓ Login successful!');
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
    return;
  }

  await ensureAuthenticated();
}
