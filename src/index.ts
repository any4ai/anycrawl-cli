#!/usr/bin/env node

/**
 * AnyCrawl CLI
 * Entry point for the CLI application
 */

import { Command } from 'commander';
import { initializeConfig, updateConfig } from './utils/config';
import { ensureAuthenticated, printBanner } from './utils/auth';
import { isUrl, normalizeUrl } from './utils/url';
import { parseFormats } from './utils/options';
import { handleScrapeCommand, handleMultiScrapeCommand } from './commands/scrape';
import { handleCrawlCommand } from './commands/crawl';
import { handleSearchCommand } from './commands/search';
import { handleMapCommand } from './commands/map';
import { viewConfig } from './commands/config';
import { handleLoginCommand } from './commands/login';
import { handleLogoutCommand } from './commands/logout';
import { handleSetupCommand } from './commands/setup';
import { handleInitCommand } from './commands/init';
import { handleVersionCommand } from './commands/version';
import { handleStatusCommand } from './commands/status';
import { handleEnvPullCommand } from './commands/env';
import type { ScrapeOptions, ScrapeFormat } from './types/scrape';
import type { CrawlOptions } from './types/crawl';
import type { SearchOptions } from './types/search';
import type { MapOptions } from './types/map';

const packageJson = require('../package.json');

initializeConfig();

const AUTH_REQUIRED_COMMANDS = ['scrape', 'crawl', 'map', 'search'];

const program = new Command();

program
  .name('anycrawl')
  .description('CLI tool for AnyCrawl web scraping')
  .version(packageJson.version)
  .option('-k, --api-key <key>', 'AnyCrawl API key (or set ANYCRAWL_API_KEY env var)')
  .option('--api-url <url>', 'API URL (or set ANYCRAWL_API_URL env var)')
  .option('--status', 'Show version, auth status, and API health')
  .allowUnknownOption()
  .hook('preAction', async (thisCommand, actionCommand) => {
    const globalOptions = thisCommand.opts();
    const commandOptions = actionCommand.opts();
    if (globalOptions.apiKey) {
      updateConfig({ apiKey: globalOptions.apiKey });
    }
    if (globalOptions.apiUrl) {
      updateConfig({ apiUrl: globalOptions.apiUrl });
    }

    const commandName = actionCommand.name();
    if (AUTH_REQUIRED_COMMANDS.includes(commandName)) {
      const { isCustomApiUrl } = await import('./utils/config');
      const effectiveApiUrl = commandOptions.apiUrl || globalOptions.apiUrl;
      if (!isCustomApiUrl(effectiveApiUrl)) {
        await ensureAuthenticated();
      }
    }
  });

function createScrapeCommand(): Command {
  return new Command('scrape')
    .description('Scrape a URL and extract content')
    .argument('[urls...]', 'URL(s) to scrape')
    .option('-u, --url <url>', 'URL to scrape (alternative to positional argument)')
    .option('-H, --html', 'Output raw HTML (shortcut for --format html)')
    .option(
      '-f, --format <formats>',
      'Output format(s), comma-separated: markdown, html, text, screenshot, screenshot@fullPage, rawHtml, json'
    )
    .option('--engine <engine>', 'Engine: playwright (default), cheerio, puppeteer', 'playwright')
    .option('--wait-for <ms>', 'Wait time before scraping (ms)', parseInt)
    .option('--proxy <url>', 'Proxy URL')
    .option('--timeout <ms>', 'Request timeout (ms)', parseInt)
    .option('--retry', 'Retry on failure', false)
    .option('--include-tags <tags>', 'Comma-separated tags to include')
    .option('--exclude-tags <tags>', 'Comma-separated tags to exclude')
    .option('--only-main-content', 'Include only main content', false)
    .option('--max-age <ms>', 'Cache max age (ms)', parseInt)
    .option('--json-schema <json>', 'JSON schema for structured extraction')
    .option('--json-prompt <prompt>', 'Prompt for JSON extraction')
    .option('-o, --output <path>', 'Output file path')
    .option('--json', 'Output as JSON', false)
    .option('--pretty', 'Pretty print JSON', false)
    .action(async (positionalArgs: string[], options) => {
      let urls: string[] = [];
      if (positionalArgs?.length > 0) {
        urls = positionalArgs.filter((a) => isUrl(a)).map(normalizeUrl);
      }
      if (options.url) urls.push(normalizeUrl(options.url));
      urls = [...new Set(urls)];

      if (urls.length === 0) {
        console.error('Error: URL is required. Use argument or --url option.');
        process.exit(1);
      }

      let formatStr = 'markdown';
      if (options.html) formatStr = 'html';
      else if (options.format) formatStr = options.format;

      let formats: ScrapeFormat[];
      try {
        formats = parseFormats(formatStr);
      } catch (e) {
        console.error(e instanceof Error ? e.message : 'Invalid format');
        process.exit(1);
      }

      const scrapeOpts: ScrapeOptions = {
        url: urls[0],
        engine: options.engine,
        formats,
        output: options.output,
        json: options.json,
        pretty: options.pretty,
        waitFor: options.waitFor,
        proxy: options.proxy,
        timeout: options.timeout,
        retry: options.retry,
        onlyMainContent: options.onlyMainContent,
        maxAge: options.maxAge,
        jsonSchema: options.jsonSchema,
        jsonPrompt: options.jsonPrompt,
      };

      if (options.includeTags) {
        scrapeOpts.includeTags = options.includeTags.split(',').map((t: string) => t.trim());
      }
      if (options.excludeTags) {
        scrapeOpts.excludeTags = options.excludeTags.split(',').map((t: string) => t.trim());
      }

      if (urls.length === 1) {
        await handleScrapeCommand(scrapeOpts);
      } else {
        await handleMultiScrapeCommand(urls, scrapeOpts);
      }
    });
}

program.addCommand(createScrapeCommand());
function createCrawlCommand(): Command {
  const crawlCmd = new Command('crawl')
    .description('Crawl a website (async, returns job ID) or check status')
    .argument('[url-or-job-id]', 'URL to crawl or job ID to check status')
    .option('-u, --url <url>', 'URL to crawl')
    .option('--status', 'Check status of existing job', false)
    .option('--wait', 'Wait for crawl to complete', false)
    .option('--progress', 'Show progress while waiting', false)
    .option('--limit <n>', 'Max pages to crawl', parseInt)
    .option('--max-depth <n>', 'Max crawl depth', parseInt)
    .option('--strategy <s>', 'all|same-domain|same-hostname|same-origin', 'same-domain')
    .option('--include-paths <paths>', 'Comma-separated paths to include')
    .option('--exclude-paths <paths>', 'Comma-separated paths to exclude')
    .option('--scrape-paths <paths>', 'Paths to scrape content (cost optimization)')
    .option('--poll-interval <s>', 'Poll interval when waiting (seconds)', parseFloat)
    .option('--timeout <s>', 'Timeout when waiting (seconds)', parseFloat)
    .option('-o, --output <path>', 'Output file path')
    .option('--pretty', 'Pretty print JSON', false)
    .action(async (positional: string, options) => {
      const urlOrJobId = positional || options.url;
      if (!urlOrJobId) {
        console.error('Error: URL or job ID required');
        process.exit(1);
      }

      const { isJobId } = await import('./utils/job');
      const opts: CrawlOptions = {
        urlOrJobId,
        status: options.status || isJobId(urlOrJobId),
        wait: options.wait,
        progress: options.progress,
        output: options.output,
        pretty: options.pretty,
        engine: options.engine ?? 'playwright',
        limit: options.limit,
        maxDepth: options.maxDepth,
        strategy: options.strategy,
        pollInterval: options.pollInterval,
        timeout: options.timeout,
      };
      if (options.includePaths) {
        opts.includePaths = options.includePaths.split(',').map((p: string) => p.trim());
      }
      if (options.excludePaths) {
        opts.excludePaths = options.excludePaths.split(',').map((p: string) => p.trim());
      }
      if (options.scrapePaths) {
        opts.scrapePaths = options.scrapePaths.split(',').map((p: string) => p.trim());
      }
      await handleCrawlCommand(opts);
    });

  crawlCmd.command('cancel <job-id>').description('Cancel a running crawl job').action(async (jobId: string) => {
    const { getClient } = await import('./utils/client');
    const client = await getClient();
    const result = await client.cancelCrawl(jobId);
    console.log(JSON.stringify(result, null, 2));
  });

  return crawlCmd;
}

function createSearchCommand(): Command {
  return new Command('search')
    .description('Search the web')
    .argument('<query>', 'Search query')
    .option('--limit <n>', 'Max results per page', parseInt)
    .option('--offset <n>', 'Skip results', parseInt)
    .option('--pages <n>', 'Number of result pages (1-20)', parseInt)
    .option('--lang <code>', 'Language code')
    .option('--country <code>', 'Country code')
    .option('--time-range <range>', 'day|week|month|year')
    .option('--safe-search <n>', '0|1|2', parseInt)
    .option('--scrape', 'Scrape result URLs', false)
    .option('--scrape-formats <formats>', 'Comma-separated formats when --scrape')
    .option('--scrape-engine <engine>', 'playwright|cheerio|puppeteer', 'playwright')
    .option('-o, --output <path>', 'Output file path')
    .option('--json', 'Output as JSON', false)
    .option('--pretty', 'Pretty print JSON', false)
    .action(async (query: string, options) => {
      const opts: SearchOptions = {
        query,
        limit: options.limit,
        offset: options.offset,
        pages: options.pages,
        lang: options.lang,
        country: options.country,
        safeSearch: options.safeSearch,
        scrape: options.scrape,
        scrapeFormats: options.scrapeFormats?.split(',').map((s: string) => s.trim()),
        scrapeEngine: options.scrapeEngine,
        output: options.output,
        json: options.json,
        pretty: options.pretty,
      };
      await handleSearchCommand(opts);
    });
}

function createMapCommand(): Command {
  return new Command('map')
    .description('Discover URLs on a website')
    .argument('[url]', 'URL to map')
    .option('-u, --url <url>', 'URL to map')
    .option('--limit <n>', 'Max URLs (1-50000)', parseInt)
    .option('--include-subdomains', 'Include subdomains', false)
    .option('--ignore-sitemap', 'Skip sitemap parsing', false)
    .option('--use-index', 'Use page cache index', true)
    .option('-o, --output <path>', 'Output file path')
    .option('--json', 'Output as JSON', false)
    .option('--pretty', 'Pretty print JSON', false)
    .action(async (positional: string, options) => {
      const url = positional || options.url;
      if (!url) {
        console.error('Error: URL required');
        process.exit(1);
      }
      const opts: MapOptions = {
        url: url.startsWith('http') ? url : `https://${url}`,
        limit: options.limit,
        includeSubdomains: options.includeSubdomains,
        ignoreSitemap: options.ignoreSitemap,
        useIndex: options.useIndex,
        output: options.output,
        json: options.json,
        pretty: options.pretty,
      };
      await handleMapCommand(opts);
    });
}

program.addCommand(createCrawlCommand());
program.addCommand(createSearchCommand());
program.addCommand(createMapCommand());

program
  .command('config')
  .description('Configure AnyCrawl (set API key or trigger login)')
  .option('-k, --api-key <key>', 'Set API key')
  .option('--api-url <url>', 'Set API URL')
  .action(async (options) => {
    const { configure } = await import('./commands/config');
    await configure({
      apiKey: options.apiKey,
      apiUrl: options.apiUrl,
    });
  });

program
  .command('view-config')
  .description('View current configuration (read-only)')
  .action(async () => {
    await viewConfig();
  });

program
  .command('login')
  .description('Login with API key')
  .option('-k, --api-key <key>', 'API key')
  .option('--api-url <url>', 'API URL (default: https://api.anycrawl.dev)')
  .action(async (options) => {
    await handleLoginCommand(options);
  });

program
  .command('logout')
  .description('Logout and clear stored credentials')
  .action(async () => {
    await handleLogoutCommand();
  });

program
  .command('version')
  .description('Display version information')
  .option('--auth-status', 'Also show authentication status', false)
  .action((options) => {
    handleVersionCommand({ authStatus: options.authStatus });
  });

program
  .command('status')
  .description('Show version, auth status, API health, and local .anycrawl status')
  .action(async () => {
    await handleStatusCommand();
  });

program
  .command('env')
  .description('Pull ANYCRAWL_API_KEY into a local .env file')
  .option('-f, --file <path>', 'Target env file (default: .env)')
  .option('--overwrite', 'Overwrite existing ANYCRAWL_API_KEY if present')
  .action(async (options) => {
    await handleEnvPullCommand({
      file: options.file,
      overwrite: options.overwrite,
    });
  });

program
  .command('setup <subcommand>')
  .description('Setup integrations: skills, mcp')
  .option('-g, --global', 'Install globally (user-level)', true)
  .option('-a, --agent <name>', 'Install to a specific agent')
  .action(async (subcommand: string, options) => {
    if (subcommand !== 'skills' && subcommand !== 'mcp') {
      console.error('Unknown subcommand. Use: skills, mcp');
      process.exit(1);
    }
    await handleSetupCommand(subcommand as 'skills' | 'mcp', {
      global: options.global,
      agent: options.agent,
    });
  });

program
  .command('init')
  .description('Install CLI, authenticate, and add skills in one step')
  .option('--skip-install', 'Skip global CLI install')
  .option('--skip-auth', 'Skip authentication')
  .option('--skip-skills', 'Skip skills installation')
  .option('-k, --api-key <key>', 'Authenticate with this API key')
  .action(async (options) => {
    await handleInitCommand(options);
  });

const args = process.argv.slice(2);

async function main() {
  const hasStatus = args.includes('--status');
  const hasVersion = args.includes('--version') || args.includes('-V');
  const hasAuthStatus = args.includes('--auth-status');

  if (hasStatus) {
    await handleStatusCommand();
    return;
  }

  if (hasVersion && hasAuthStatus) {
    handleVersionCommand({ authStatus: true });
    return;
  }

  if (args.length === 0) {
    const { isAuthenticated } = await import('./utils/auth');
    if (!isAuthenticated()) {
      await ensureAuthenticated();
      console.log("You're all set! Try scraping a URL:\n");
      console.log('  anycrawl https://example.com\n');
      console.log('For more commands, run: anycrawl --help\n');
      return;
    }
    printBanner();
    program.outputHelp();
    return;
  }

  if (
    args.length === 1 &&
    (args[0] === '-y' || args[0] === '--yes')
  ) {
    await handleInitCommand({ yes: true, all: true });
    return;
  }

  if (!args[0].startsWith('-') && isUrl(args[0])) {
    const url = normalizeUrl(args[0]);
    const modifiedArgv = [process.argv[0], process.argv[1], 'scrape', url, ...args.slice(1)];
    await program.parseAsync(modifiedArgv);
  } else {
    await program.parseAsync();
  }
}

main().catch((error) => {
  console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
  process.exit(1);
});
