/**
 * Search command implementation
 */

import type { SearchOptions } from '../types/search';
import { getClient } from '../utils/client';
import { writeOutput } from '../utils/output';

/**
 * Handle search command
 */
export async function handleSearchCommand(
  options: SearchOptions
): Promise<void> {
  const client = await getClient({
    apiKey: options.apiKey,
    apiUrl: options.apiUrl,
  });

  const searchInput: Parameters<typeof client.search>[0] = {
    query: options.query,
    engine: 'google',
    limit: options.limit ?? 10,
    offset: options.offset,
    pages: options.pages,
    lang: options.lang,
    country: options.country,
    safeSearch: options.safeSearch,
  };

  if (options.scrape && options.scrapeFormats) {
    searchInput.scrape_options = {
      engine: options.scrapeEngine ?? 'playwright',
      formats: options.scrapeFormats as ('markdown' | 'html' | 'text')[],
    };
  } else if (options.scrape) {
    searchInput.scrape_options = {
      engine: options.scrapeEngine ?? 'playwright',
      formats: ['markdown'],
    };
  }

  const result = await client.search(searchInput);

  writeOutput(result, {
    output: options.output,
    json: options.json ?? true,
    pretty: options.pretty,
  });
}
