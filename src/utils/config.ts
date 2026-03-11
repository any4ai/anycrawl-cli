/**
 * Global configuration system
 */

import { loadCredentials } from './credentials';

export interface GlobalConfig {
  apiKey?: string;
  apiUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
  backoffFactor?: number;
}

let globalConfig: GlobalConfig = {};

/**
 * Initialize global configuration
 */
export function initializeConfig(config: Partial<GlobalConfig> = {}): void {
  const storedCredentials = loadCredentials();

  globalConfig = {
    apiKey:
      config.apiKey ||
      process.env.ANYCRAWL_API_KEY ||
      storedCredentials?.apiKey,
    apiUrl:
      config.apiUrl ||
      process.env.ANYCRAWL_API_URL ||
      storedCredentials?.apiUrl,
    timeoutMs: config.timeoutMs,
    maxRetries: config.maxRetries,
    backoffFactor: config.backoffFactor,
  };
}

/**
 * Get the current global configuration
 */
export function getConfig(): GlobalConfig {
  return { ...globalConfig };
}

/**
 * Update global configuration (merges with existing)
 */
export function updateConfig(config: Partial<GlobalConfig>): void {
  globalConfig = { ...globalConfig, ...config };
}

/**
 * Get API key from global config or provided value
 */
export function getApiKey(providedKey?: string): string | undefined {
  if (providedKey) return providedKey;
  if (globalConfig.apiKey) return globalConfig.apiKey;
  if (process.env.ANYCRAWL_API_KEY) return process.env.ANYCRAWL_API_KEY;
  const storedCredentials = loadCredentials();
  return storedCredentials?.apiKey;
}

const DEFAULT_API_URL = 'https://api.anycrawl.dev';

/**
 * Check if using a custom (non-cloud) API URL
 */
export function isCustomApiUrl(apiUrl?: string): boolean {
  const url = apiUrl || globalConfig.apiUrl;
  return !!url && url !== DEFAULT_API_URL;
}

/**
 * Validate that required configuration is present
 */
export function validateConfig(apiKey?: string): void {
  if (isCustomApiUrl()) return;

  const key = getApiKey(apiKey);
  if (!key) {
    throw new Error(
      'API key is required. Set ANYCRAWL_API_KEY environment variable, use --api-key flag, or run "anycrawl login" to set the API key.'
    );
  }
}

/**
 * Reset global configuration (useful for testing)
 */
export function resetConfig(): void {
  globalConfig = {};
}
