/**
 * Search types for AnyCrawl CLI
 */

export interface SearchOptions {
  query: string;
  limit?: number;
  offset?: number;
  pages?: number;
  lang?: string;
  country?: string;
  timeRange?: 'day' | 'week' | 'month' | 'year';
  safeSearch?: number;
  scrape?: boolean;
  scrapeFormats?: string[];
  scrapeEngine?: 'auto' | 'playwright' | 'cheerio' | 'puppeteer';
  output?: string;
  json?: boolean;
  pretty?: boolean;
  apiKey?: string;
  apiUrl?: string;
}
