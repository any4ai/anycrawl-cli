# AnyCrawl CLI

Command-line interface for [AnyCrawl](https://anycrawl.dev). Scrape, crawl, search, and map websites from your terminal.

## Installation

```bash
npm install -g anycrawl-cli
```

Or use the one-command setup:

```bash
npx -y anycrawl-cli init
```

## Quick Start

Authenticate with your API key (get one at [anycrawl.dev/dashboard](https://anycrawl.dev/dashboard)):

```bash
anycrawl login --api-key <your-api-key>
```

Or set the environment variable:

```bash
export ANYCRAWL_API_KEY=<your-api-key>
```

Then try:

```bash
# Scrape a URL ( shorthand )
anycrawl https://example.com

# Search the web
anycrawl search "web scraping tools"

# Discover URLs on a site
anycrawl map https://example.com

# Crawl a website
anycrawl crawl https://example.com --wait -o results.json
```

## Commands

| Command | Description |
|---------|-------------|
| `scrape [urls...]` | Scrape URL(s) and extract content (default: markdown) |
| `crawl [url-or-job-id]` | Crawl a website or check crawl status |
| `search <query>` | Search the web with optional result scraping |
| `map [url]` | Discover URLs on a website |
| `login` | Authenticate with API key |
| `logout` | Clear stored credentials |
| `config` | View or update configuration |
| `setup skills` | Install AnyCrawl skill for AI coding agents |
| `setup mcp` | Get MCP configuration for AnyCrawl |

## Options

- **Default engine**: `playwright` (best for dynamic content)
- **Output**: Use `-o` or `--output` to save to file. Recommended: `.anycrawl/` directory
- **Global**: `-k, --api-key`, `--api-url` work with any command

### Scrape

```bash
anycrawl scrape https://example.com -o page.md
anycrawl scrape https://example.com --format html,links --json -o data.json
```

Options: `--engine`, `--format`, `--wait-for`, `--proxy`, `--output`, `--json`, `--pretty`

### Crawl

```bash
anycrawl crawl https://example.com
anycrawl crawl <job-id>              # Check status
anycrawl crawl https://example.com --wait --progress -o crawl.json
anycrawl crawl cancel <job-id>       # Cancel a job
```

Options: `--wait`, `--progress`, `--limit`, `--max-depth`, `--include-paths`, `--exclude-paths`

### Search

```bash
anycrawl search "machine learning" -o .anycrawl/search.json
anycrawl search "tutorials" --scrape --limit 5
```

Options: `--limit`, `--pages`, `--lang`, `--country`, `--scrape`, `--scrape-formats`

### Map

```bash
anycrawl map https://example.com -o urls.txt
anycrawl map https://example.com --limit 500 --json
```

Options: `--limit`, `--include-subdomains`, `--ignore-sitemap`

## Skills & MCP

Install the AnyCrawl skill for Cursor, Codex, and other AI coding agents:

```bash
anycrawl setup skills
```

For MCP integration, run `anycrawl setup mcp` to get your MCP URL.

## Documentation

- [AnyCrawl API Docs](https://docs.anycrawl.dev)

## Self-hosted

For self-hosted AnyCrawl instances:

```bash
export ANYCRAWL_API_URL=https://your-api.example.com
anycrawl scrape https://example.com
```

Or use `--api-url` with any command.
