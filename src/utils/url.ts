/**
 * URL utility functions
 */

/**
 * Check if a string looks like a URL (with or without protocol)
 */
export function isUrl(str: string): boolean {
  if (/^https?:\/\//i.test(str)) {
    try {
      const url = new URL(str);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return true;
    }
  }

  if (str.includes('.') && !str.startsWith('-') && !str.includes(' ')) {
    const domainPattern =
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(\/.*)?$/;
    return domainPattern.test(str);
  }

  return false;
}

/**
 * Normalize URL by adding https:// if missing
 */
export function normalizeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  return `https://${url}`;
}

/**
 * Get the origin (scheme + host) from a URL
 */
export function getOrigin(url: string): string {
  try {
    const parsed = new URL(normalizeUrl(url));
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return url;
  }
}
