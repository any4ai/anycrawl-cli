/**
 * Scrape command implementation
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ScrapeFormat } from '@anycrawl/js-sdk';
import type { ScrapeOptions } from '../types/scrape';
import { getClient } from '../utils/client';
import { writeOutput, shouldOutputJson } from '../utils/output';

const DEFAULT_ENGINE = 'auto';

/**
 * Generate a filename from a URL for saving to .anycrawl/
 */
function urlToFilename(url: string, ext: string = '.md'): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const host = parsed.hostname.replace(/^www\./, '');
    const pathPart = parsed.pathname
      .replace(/^\/|\/$/g, '')
      .replace(/\//g, '-');
    if (!pathPart) return `${host}${ext}`;
    return `${host}-${pathPart}${ext}`;
  } catch {
    return url.replace(/[^a-zA-Z0-9.-]/g, '_') + ext;
  }
}

/**
 * Execute a single scrape and return the result (for multi-URL use)
 */
async function executeScrape(options: ScrapeOptions): Promise<unknown> {
  const client = await getClient({
    apiKey: options.apiKey,
    apiUrl: options.apiUrl,
  });
  const formats: ScrapeFormat[] =
    options.formats && options.formats.length > 0
      ? (options.formats as ScrapeFormat[])
      : ['markdown'];
  const jsonOptions =
    options.jsonSchema || options.jsonPrompt
      ? {
          schema: options.jsonSchema
            ? JSON.parse(options.jsonSchema)
            : undefined,
          user_prompt: options.jsonPrompt,
        }
      : undefined;

  const result = await client.scrape({
    url: options.url,
    engine: options.engine ?? DEFAULT_ENGINE,
    formats,
    wait_for: options.waitFor,
    proxy: options.proxy,
    timeout: options.timeout,
    retry: options.retry,
    include_tags: options.includeTags,
    exclude_tags: options.excludeTags,
    json_options: jsonOptions,
  });

  if (result.status === 'failed') {
    throw new Error(result.error as string);
  }
  return result;
}

/**
 * Handle scrape for multiple URLs concurrently.
 * Each result is saved as a separate file in .anycrawl/ (or --output dir)
 */
export async function handleMultiScrapeCommand(
  urls: string[],
  options: ScrapeOptions
): Promise<void> {
  const outputPath = options.output || '.anycrawl';
  const looksLikeFile = /\.(json|md|html|txt)$/i.test(outputPath);
  const dir = looksLikeFile ? path.dirname(outputPath) : outputPath;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const forceJson = shouldOutputJson(options.output, options.json);
  const ext = forceJson ? '.json' : '.md';
  const formats =
    options.formats && options.formats.length > 0
      ? options.formats
      : ['markdown'];
  const rawFormats = ['markdown', 'html', 'rawHtml', 'text'];
  const singleFormat = formats[0] as string;
  const outputRaw = formats.length === 1 && rawFormats.includes(singleFormat);

  let completedCount = 0;
  let errorCount = 0;
  const total = urls.length;
  process.stderr.write(`Scraping ${total} URLs...\n`);

  const promises = urls.map(async (url) => {
    const scrapeOpts: ScrapeOptions = { ...options, url };
    try {
      const result = (await executeScrape(scrapeOpts)) as Record<
        string,
        unknown
      >;
      const currentCount = ++completedCount;

      const filename = urlToFilename(url, ext);
      const filepath = path.join(dir, filename);

      let content: string;
      if (forceJson) {
        content = options.pretty
          ? JSON.stringify(result, null, 2)
          : JSON.stringify(result);
      } else if (
        outputRaw &&
        result[singleFormat] !== undefined &&
        result[singleFormat] !== null
      ) {
        const val = result[singleFormat];
        content = Array.isArray(val)
          ? val.join('\n')
          : typeof val === 'string'
            ? val
            : JSON.stringify(result);
      } else {
        content = options.pretty
          ? JSON.stringify(result, null, 2)
          : JSON.stringify(result);
      }

      fs.writeFileSync(filepath, content, 'utf-8');
      process.stderr.write(`[${currentCount}/${total}] Saved: ${filepath}\n`);
    } catch (err) {
      errorCount++;
      completedCount++;
      process.stderr.write(
        `[${completedCount}/${total}] Error: ${url} - ${err instanceof Error ? err.message : String(err)}\n`
      );
    }
  });

  await Promise.all(promises);

  process.stderr.write(`\nCompleted: ${total - errorCount}/${total} succeeded`);
  if (errorCount > 0) {
    process.stderr.write(`, ${errorCount} failed`);
  }
  process.stderr.write('\n');

  if (errorCount === total) {
    process.exit(1);
  }
}

/**
 * Execute the scrape command (single URL)
 */
export async function handleScrapeCommand(
  options: ScrapeOptions
): Promise<void> {
  const formats: ScrapeFormat[] =
    options.formats && options.formats.length > 0
      ? (options.formats as ScrapeFormat[])
      : ['markdown'];

  const result = (await executeScrape(options)) as Record<string, unknown> & {
    status?: string;
    error?: string;
  };
  const forceJson = shouldOutputJson(options.output, options.json);

  if (forceJson) {
    writeOutput(result, {
      output: options.output,
      json: true,
      pretty: options.pretty,
    });
    return;
  }

  // Single format - output raw content when applicable
  const rawFormats = ['markdown', 'html', 'rawHtml', 'text'];
  const singleFormat = formats[0];

  if (formats.length === 1 && rawFormats.includes(singleFormat)) {
    const data = result as Record<string, unknown>;
    const val = data[singleFormat];
    if (val !== undefined && val !== null) {
      let content: string;
      if (Array.isArray(val)) {
        content = val.join('\n');
      } else if (typeof val === 'string') {
        content = val;
      } else {
        content = JSON.stringify(result, null, options.pretty ? 2 : 0);
      }
      writeOutput(content, {
        output: options.output,
        pretty: options.pretty,
      });
      return;
    }
  }

  {
    writeOutput(result, {
      output: options.output,
      json: true,
      pretty: options.pretty,
    });
  }
}
