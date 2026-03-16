---
name: anycrawl-scrape
description: |
  Extract clean markdown from any URL, including JavaScript-rendered SPAs. Use when the user provides a URL and wants its content, says "scrape", "grab", "fetch", "pull", "get the page", "extract from this URL", or "read this webpage". Returns LLM-optimized markdown.
allowed-tools:
  - Bash(anycrawl *)
  - Bash(npx anycrawl *)
---

# anycrawl scrape

Scrape one or more URLs. Returns clean, LLM-optimized markdown. Multiple URLs are scraped concurrently.

## When to use

- You have a specific URL and want its content
- The page is static or JS-rendered (SPA)

## Quick start

```bash
# Shorthand: URL as first argument
anycrawl "https://example.com"

# Basic markdown extraction
anycrawl scrape "https://example.com" -o .anycrawl/page.md

# Main content only, no nav/footer
anycrawl scrape "https://example.com" --only-main-content -o .anycrawl/page.md

# Wait for JS to render, then scrape
anycrawl scrape "https://example.com" --wait-for 3000 -o .anycrawl/page.md

# Multiple URLs (each saved to .anycrawl/)
anycrawl scrape "https://example.com" "https://example.com/blog" "https://example.com/docs"

# Get markdown and links together
anycrawl scrape "https://example.com" --format markdown,links -o .anycrawl/page.json --json
```

## Options

| Option                   | Description                                                          |
| ------------------------ | -------------------------------------------------------------------- |
| `-f, --format <formats>` | markdown, html, text, rawHtml, screenshot, screenshot@fullPage, json |
| `--engine`               | playwright (default), cheerio, puppeteer                             |
| `--only-main-content`    | Strip nav, footer, sidebar — main content only                       |
| `--wait-for <ms>`        | Wait for JS rendering before scraping                                |
| `--include-tags <tags>`  | Only include these HTML tags                                         |
| `--exclude-tags <tags>`  | Exclude these HTML tags                                              |
| `-o, --output <path>`    | Output file path                                                     |

## Tips

- Single format outputs raw content. Multiple formats (e.g., `--format markdown,links`) output JSON.
- Always quote URLs — shell interprets `?` and `&` as special characters.
- Naming: `.anycrawl/{site}-{path}.md`

## See also

- [anycrawl-search](../anycrawl-search/SKILL.md) — find pages when you don't have a URL
- [anycrawl-map](../anycrawl-map/SKILL.md) — discover URLs within a site
- [anycrawl-crawl](../anycrawl-crawl/SKILL.md) — bulk extract from a site
