---
name: anycrawl
description: |
  Web scraping, search, crawling, and site mapping via the AnyCrawl CLI. Use when the user wants to search the web, scrape a page, find URLs on a site, or bulk extract content. Returns clean LLM-optimized markdown. Must be pre-installed and authenticated.
allowed-tools:
  - Bash(anycrawl *)
  - Bash(npx anycrawl *)
---

# AnyCrawl CLI

Web scraping, search, and crawling CLI. Returns clean markdown optimized for LLM context windows. Default engine: playwright.

Run `anycrawl --help` or `anycrawl <command> --help` for full option details.

## Prerequisites

Must be installed and authenticated. Run `anycrawl login` or set `ANYCRAWL_API_KEY`.

If not ready, see [rules/install.md](rules/install.md). For output handling guidelines, see [rules/security.md](rules/security.md).

## Workflow escalation

1. **Search** - No specific URL yet. Find pages, answer questions, discover sources.
2. **Scrape** - Have a URL. Extract its content directly.
3. **Map** - Need to locate URLs within a site. Use `map` to discover URLs, then scrape.
4. **Crawl** - Need bulk content from an entire site section (e.g., all /docs/).

| Need                        | Command  | Skill               |
| --------------------------- | -------- | ------------------- |
| Find pages on a topic       | `search` | [anycrawl-search](../anycrawl-search/SKILL.md)  |
| Get a page's content        | `scrape` | [anycrawl-scrape](../anycrawl-scrape/SKILL.md)  |
| Find URLs within a site     | `map`    | [anycrawl-map](../anycrawl-map/SKILL.md)       |
| Bulk extract a site section | `crawl`  | [anycrawl-crawl](../anycrawl-crawl/SKILL.md)   |

**Avoid redundant fetches:** `search --scrape` already fetches full page content. Don't re-scrape those URLs. Check `.anycrawl/` for existing data before fetching again.

## Output & Organization

Write results to `.anycrawl/` with `-o`. Add `.anycrawl/` to `.gitignore`. Always quote URLs in shell commands. Never read entire output files at once — use `grep`, `head`, or incremental reads.

## Documentation

- [AnyCrawl API Docs](https://docs.anycrawl.dev)
