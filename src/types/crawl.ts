/**
 * Crawl types for AnyCrawl CLI
 */

export interface CrawlOptions {
  urlOrJobId: string;
  status?: boolean;
  wait?: boolean;
  progress?: boolean;
  output?: string;
  pretty?: boolean;
  apiKey?: string;
  apiUrl?: string;
  pollInterval?: number;
  timeout?: number;
  engine?: 'auto' | 'playwright' | 'cheerio' | 'puppeteer';
  limit?: number;
  maxDepth?: number;
  strategy?: 'all' | 'same-domain' | 'same-hostname' | 'same-origin';
  includePaths?: string[];
  excludePaths?: string[];
  scrapePaths?: string[];
}
