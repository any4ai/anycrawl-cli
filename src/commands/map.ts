/**
 * Map command implementation
 * Uses direct API call - @anycrawl/js-sdk does not yet expose map()
 */

import type { MapOptions } from '../types/map';
import { getConfig, getApiKey } from '../utils/config';
import { writeOutput } from '../utils/output';

const DEFAULT_API_URL = 'https://api.anycrawl.dev';

/**
 * Handle map command
 */
export async function handleMapCommand(options: MapOptions): Promise<void> {
  const apiKey = options.apiKey ?? getApiKey();
  const apiUrl = (options.apiUrl ?? getConfig().apiUrl ?? DEFAULT_API_URL).replace(/\/$/, '');

  if (!apiKey) {
    throw new Error('API key required. Run anycrawl login or set ANYCRAWL_API_KEY.');
  }

  const body: Record<string, unknown> = {
    url: options.url,
  };
  if (options.limit != null) body.limit = options.limit;
  if (options.includeSubdomains != null) body.include_subdomains = options.includeSubdomains;
  if (options.ignoreSitemap != null) body.ignore_sitemap = options.ignoreSitemap;
  if (options.useIndex != null) body.use_index = options.useIndex;
  if (options.maxAge != null) body.max_age = options.maxAge;

  const res = await fetch(`${apiUrl}/v1/map`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!data.success) {
    const msg = data.message || data.error || 'Map request failed';
    const details = data.details;
    if (res.status === 402 && details?.available_credits != null) {
      throw new Error(`${msg} (available_credits: ${details.available_credits})`);
    }
    if (details?.issues?.length) {
      const issues = details.issues.map((i: { field?: string; message?: string }) => `${i.field}: ${i.message}`).join('; ');
      throw new Error(`${msg} - ${issues}`);
    }
    throw new Error(msg);
  }

  const links = data.data || [];

  if (options.json || (options.output && options.output.endsWith('.json'))) {
    writeOutput(links, {
      output: options.output,
      json: true,
      pretty: options.pretty,
    });
  } else {
    const lines = links.map((l: { url: string }) => l.url).join('\n');
    writeOutput(lines, { output: options.output });
  }
}
