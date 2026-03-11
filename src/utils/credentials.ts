/**
 * OS-level credential storage utility
 * Stores credentials in platform-specific application data directories
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface StoredCredentials {
  apiKey?: string;
  apiUrl?: string;
}

/**
 * Get the platform-specific config directory
 */
function getConfigDir(): string {
  const homeDir = os.homedir();
  const platform = os.platform();

  switch (platform) {
    case 'darwin': // macOS
      return path.join(
        homeDir,
        'Library',
        'Application Support',
        'anycrawl-cli'
      );
    case 'win32': // Windows
      return path.join(homeDir, 'AppData', 'Roaming', 'anycrawl-cli');
    default: // Linux and others
      return path.join(homeDir, '.config', 'anycrawl-cli');
  }
}

/**
 * Get the credentials file path
 */
function getCredentialsPath(): string {
  return path.join(getConfigDir(), 'credentials.json');
}

/**
 * Ensure the config directory exists
 */
function ensureConfigDir(): void {
  const configDir = getConfigDir();
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true, mode: 0o700 });
  }
}

/**
 * Set file permissions to be readable/writable only by the owner
 */
function setSecurePermissions(filePath: string): void {
  try {
    fs.chmodSync(filePath, 0o600);
  } catch {
    // Ignore errors on Windows or if file doesn't exist
  }
}

/**
 * Load credentials from OS storage
 */
export function loadCredentials(): StoredCredentials | null {
  try {
    const credentialsPath = getCredentialsPath();
    if (!fs.existsSync(credentialsPath)) {
      return null;
    }
    const data = fs.readFileSync(credentialsPath, 'utf-8');
    return JSON.parse(data) as StoredCredentials;
  } catch {
    return null;
  }
}

/**
 * Save credentials to OS storage
 */
export function saveCredentials(credentials: StoredCredentials): void {
  try {
    ensureConfigDir();
    const credentialsPath = getCredentialsPath();
    const existing = loadCredentials();
    const merged: StoredCredentials = { ...existing, ...credentials };
    fs.writeFileSync(credentialsPath, JSON.stringify(merged, null, 2), 'utf-8');
    setSecurePermissions(credentialsPath);
  } catch (error) {
    throw new Error(
      `Failed to save credentials: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Delete stored credentials
 */
export function deleteCredentials(): void {
  try {
    const credentialsPath = getCredentialsPath();
    if (fs.existsSync(credentialsPath)) {
      fs.unlinkSync(credentialsPath);
    }
  } catch (error) {
    throw new Error(
      `Failed to delete credentials: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get the config directory path (for informational purposes)
 */
export function getConfigDirectoryPath(): string {
  return getConfigDir();
}
