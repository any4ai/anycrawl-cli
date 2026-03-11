/**
 * Logout command implementation
 */

import { deleteCredentials, loadCredentials } from '../utils/credentials';
import { updateConfig } from '../utils/config';

export async function handleLogoutCommand(): Promise<void> {
  const credentials = loadCredentials();

  if (!credentials?.apiKey) {
    console.log('No credentials found. You are not logged in.');
    return;
  }

  try {
    deleteCredentials();
    updateConfig({ apiKey: '', apiUrl: '' });
    console.log('✓ Logged out successfully');
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}
