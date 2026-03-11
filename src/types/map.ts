/**
 * Map types for AnyCrawl CLI
 */

export interface MapOptions {
  url: string;
  limit?: number;
  includeSubdomains?: boolean;
  ignoreSitemap?: boolean;
  useIndex?: boolean;
  maxAge?: number;
  output?: string;
  json?: boolean;
  pretty?: boolean;
  apiKey?: string;
  apiUrl?: string;
}
