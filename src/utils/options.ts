/**
 * Option parsing utilities
 */

import type { ScrapeFormat } from '../types/scrape';

const VALID_FORMATS: ScrapeFormat[] = [
  'markdown',
  'html',
  'text',
  'screenshot',
  'screenshot@fullPage',
  'rawHtml',
  'json',
];

export function parseFormats(formatString: string): ScrapeFormat[] {
  const inputFormats = formatString
    .split(',')
    .map((f) => f.trim().toLowerCase())
    .filter((f) => f.length > 0);

  const invalidFormats: string[] = [];
  const validFormats: ScrapeFormat[] = [];

  for (const input of inputFormats) {
    const normalized =
      input === 'screenshot@fullpage' ? 'screenshot@fullPage' : input;
    if (VALID_FORMATS.includes(normalized as ScrapeFormat)) {
      validFormats.push(normalized as ScrapeFormat);
    } else {
      invalidFormats.push(input);
    }
  }

  if (invalidFormats.length > 0) {
    throw new Error(
      `Invalid format(s): ${invalidFormats.join(', ')}. Valid formats: ${VALID_FORMATS.join(', ')}`
    );
  }

  return [...new Set(validFormats)];
}
