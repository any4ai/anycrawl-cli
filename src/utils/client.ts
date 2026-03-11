/**
 * AnyCrawl client utility
 * Provides a singleton client instance initialized with global configuration
 * Uses dynamic import for ESM-only @anycrawl/js-sdk
 */

import type { AnyCrawlClient } from '@anycrawl/js-sdk';
import {
  getConfig,
  validateConfig,
  updateConfig,
  type GlobalConfig,
} from './config';

let clientInstance: AnyCrawlClient | null = null;

const DEFAULT_API_URL = 'https://api.anycrawl.dev';

function normalizeApiKey(value: string | null | undefined): string | undefined {
  return value === null || value === undefined ? undefined : value;
}

/**
 * Get or create the AnyCrawl client instance
 */
export async function getClient(options?: {
  apiKey?: string;
  apiUrl?: string;
}): Promise<AnyCrawlClient> {
  // Use Function to preserve native import() - TS would compile import() to require() otherwise
  const dynamicImport = new Function('specifier', 'return import(specifier)') as (s: string) => Promise<typeof import('@anycrawl/js-sdk')>;
  const { AnyCrawlClient } = await dynamicImport('@anycrawl/js-sdk');

  if (options) {
    const configUpdate: Partial<GlobalConfig> = {};
    if (options.apiKey !== undefined) {
      configUpdate.apiKey = normalizeApiKey(options.apiKey);
    }
    if (options.apiUrl !== undefined) {
      configUpdate.apiUrl = normalizeApiKey(options.apiUrl);
    }
    if (Object.keys(configUpdate).length > 0) {
      updateConfig(configUpdate);
    }

    const config = getConfig();
    const apiKey = normalizeApiKey(options.apiKey) ?? config.apiKey ?? '';
    const apiUrl = normalizeApiKey(options.apiUrl) ?? config.apiUrl ?? DEFAULT_API_URL;

    const normalizedKey = apiKey === null ? '' : apiKey;
    validateConfig(normalizedKey || undefined);

    return new AnyCrawlClient(normalizedKey, apiUrl);
  }

  if (!clientInstance) {
    const config = getConfig();
    validateConfig(config.apiKey);

    const apiKey = config.apiKey ?? '';
    const apiUrl = config.apiUrl ?? DEFAULT_API_URL;

    clientInstance = new AnyCrawlClient(apiKey, apiUrl);
  }

  return clientInstance;
}

/**
 * Reset the client instance (useful for testing)
 */
export function resetClient(): void {
  clientInstance = null;
}
