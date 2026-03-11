/**
 * Crawl command implementation
 */

import type { CrawlOptions } from '../types/crawl';
import { getClient } from '../utils/client';
import { isJobId } from '../utils/job';
import { writeOutput } from '../utils/output';
import { createSpinner } from '../utils/spinner';

const DEFAULT_ENGINE = 'playwright';

/**
 * Handle crawl command
 */
export async function handleCrawlCommand(options: CrawlOptions): Promise<void> {
  const client = await getClient({ apiKey: options.apiKey, apiUrl: options.apiUrl });
  const { urlOrJobId, status, wait, progress, output, pretty } = options;

  // Status check (one-shot): --status flag or job ID without --wait
  if ((status || isJobId(urlOrJobId)) && !wait) {
    const statusData = await client.getCrawlStatus(urlOrJobId);
    const formatted = {
      job_id: statusData.job_id,
      status: statusData.status,
      total: statusData.total,
      completed: statusData.completed,
      failed: statusData.failed,
      credits_used: statusData.credits_used,
      start_time: statusData.start_time,
      expires_at: statusData.expires_at,
    };
    writeOutput(formatted, { output, json: true, pretty });
    return;
  }

  // Wait for existing job by ID: poll until done, then fetch results
  if (wait && isJobId(urlOrJobId)) {
    const jobId = urlOrJobId;
    const pollInterval = (options.pollInterval ?? 3) * 1000; // ms
    const timeoutMs = options.timeout ? options.timeout * 1000 : undefined;
    const startedAt = Date.now();
    const spinner = progress ? createSpinner(`Waiting for crawl ${jobId}...`) : null;
    if (spinner) spinner.start();

    let lastStatus: { status: string; completed: number; total: number } = {
      status: 'pending',
      completed: 0,
      total: 0,
    };

    try {
      while (true) {
        const statusData = await client.getCrawlStatus(jobId);
        lastStatus = {
          status: statusData.status,
          completed: statusData.completed,
          total: statusData.total,
        };
        if (spinner) {
          spinner.update(`${statusData.completed}/${statusData.total} completed, status: ${statusData.status}`);
        }
        if (statusData.status === 'completed') break;
        if (statusData.status === 'failed') {
          throw new Error(`Crawl failed (job_id=${jobId})`);
        }
        if (statusData.status === 'cancelled') {
          break;
        }
        if (timeoutMs !== undefined && Date.now() - startedAt > timeoutMs) {
          throw new Error(`Crawl timed out after ${options.timeout}s (job_id=${jobId})`);
        }
        await new Promise((r) => setTimeout(r, pollInterval));
      }

      if (spinner) spinner.succeed(`Crawl ${lastStatus.status}: ${lastStatus.completed}/${lastStatus.total} pages`);
    } catch (err) {
      if (spinner) spinner.fail(err instanceof Error ? err.message : String(err));
      throw err;
    }

    // Fetch and aggregate all results
    const aggregated: unknown[] = [];
    let skip = 0;
    let total = 0;
    let completed = 0;
    let creditsUsed = 0;
    while (true) {
      const page = await client.getCrawlResults(jobId, skip);
      if (typeof page.total === 'number') total = page.total;
      if (typeof page.completed === 'number') completed = page.completed;
      if (typeof page.creditsUsed === 'number') creditsUsed = page.creditsUsed;
      if (Array.isArray(page.data) && page.data.length > 0) {
        aggregated.push(...page.data);
      }
      if (page.next) {
        skip = aggregated.length;
      } else {
        break;
      }
    }

    writeOutput(
      {
        job_id: jobId,
        status: 'completed',
        total,
        completed,
        creditsUsed,
        data: aggregated,
      },
      { output, json: true, pretty }
    );
    return;
  }

  const url = urlOrJobId;

  const crawlInput = {
    url,
    engine: options.engine ?? DEFAULT_ENGINE,
    limit: options.limit,
    max_depth: options.maxDepth,
    strategy: options.strategy,
    exclude_paths: options.excludePaths,
    include_paths: options.includePaths,
  };

  if (wait) {
    const pollInterval = options.pollInterval ?? 3;
    const timeoutMs = options.timeout ? options.timeout * 1000 : undefined;
    const spinner = progress ? createSpinner(`Crawling ${url}...`) : null;
    if (spinner) spinner.start();

    const result = await client.crawl(
      crawlInput,
      pollInterval,
      timeoutMs
    );

    if (spinner) {
      spinner.succeed(
        `Completed: ${result.completed}/${result.total} pages, ${result.creditsUsed} credits used`
      );
    }

    writeOutput(
      {
        job_id: result.job_id,
        status: result.status,
        total: result.total,
        completed: result.completed,
        creditsUsed: result.creditsUsed,
        data: result.data,
      },
      { output, json: true, pretty }
    );
    return;
  }

  // Start crawl, return job ID
  const created = await client.createCrawl(crawlInput);
  const out = {
    job_id: created.job_id,
    status: created.status,
    message: created.message,
  };
  writeOutput(out, { output, json: true, pretty });
  console.error(`\nJob ID: ${created.job_id}`);
  console.error('Use "anycrawl crawl', created.job_id, '--wait" to wait for completion.\n');
}
