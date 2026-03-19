/**
 * Scrape types for AnyCrawl CLI
 * Aligned with @anycrawl/js-sdk ScrapeFormat
 */

export type ScrapeFormat =
  | 'markdown'
  | 'html'
  | 'text'
  | 'screenshot'
  | 'screenshot@fullPage'
  | 'rawHtml'
  | 'json';

export interface ScrapeOptions {
  url: string;
  engine?: 'auto' | 'playwright' | 'cheerio' | 'puppeteer';
  formats?: ScrapeFormat[];
  output?: string;
  json?: boolean;
  pretty?: boolean;
  apiKey?: string;
  apiUrl?: string;
  waitFor?: number;
  proxy?: string;
  timeout?: number;
  retry?: boolean;
  includeTags?: string[];
  excludeTags?: string[];
  onlyMainContent?: boolean;
  maxAge?: number;
  jsonSchema?: string;
  jsonPrompt?: string;
}
