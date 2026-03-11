/**
 * Version command implementation
 * Displays the CLI version and optionally auth status
 */

import { isAuthenticated } from '../utils/auth';

const packageJson = require('../../package.json');

export interface VersionOptions {
  authStatus?: boolean;
}

/**
 * Display version information
 */
export function handleVersionCommand(options: VersionOptions = {}): void {
  console.log(`version: ${packageJson.version}`);

  if (options.authStatus) {
    const authenticated = isAuthenticated();
    console.log(`authenticated: ${authenticated}`);
  }
}
