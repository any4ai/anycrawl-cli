/**
 * Utility functions for job ID detection and validation
 */

/**
 * Check if a string looks like a UUID/job ID
 * AnyCrawl crawl job IDs are UUIDs
 */
export function isJobId(str: string): boolean {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(str);
}
