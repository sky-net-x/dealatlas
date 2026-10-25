# DealAtlas — handoff for AI agents

Context: This is the user's free-first international deals discovery business MVP. The user wants $0 spending and does NOT want a paywall or subscription initially.

Project roots:
- Windows folder: Documents/Docker/MCP Environment/DealAtlas
- GitHub: https://github.com/sky-net-x/dealatlas
- Published: https://sky-net-x.github.io/dealatlas/

Existing Teaching MCP on Docker:
- workspace_list now recognizes FOUR direct mounted workspaces: default (Education), prefab, converters, and dealatlas (/dealatlas). All direct file and command tools work; Chromium's stale profile locks were cleared 2026-10-25.
- Windows Chrome is connected via the Teaching MCP browser automation in Education/Browser-Automation/windows-browser.js.
- A browser window's file:// URL can read the Windows DealAtlas project; Chrome CDP may save files to an arbitrary dedicated destination using Browser.setDownloadBehavior. Avoid duplicating authoritative project materials under Education.
- The direct Docker bind mount and named workspace configuration are installed and verified. Do not recreate the container unnecessarily or remove existing projects.

Current site (Phase 6, 2026-10-25): free international outbound searches, live daily FX, synthetic demo scenarios, manual resale evaluator, experimental live seller-asking-price discovery (resell.store public no-key API, may be seeded/demo) and a LOCAL-ONLY private watchlist. Each watch has product keywords, approved category and USD max asking price; up to 6, stored in localStorage, user clicks to manually check up to 20 source results per watch sorted by asking price; no background monitoring/notification. The watch links to five global marketplace searches. 33 Node tests, 3 Python tests and browser tests pass. Retail provenance remains unverified; no sold-price feed. Discogs Marketplace Data restricted: collector disabled, published data emptied, scheduled automation retired. eBay API still pending user approval; data/live-listings.json empty. Work directly in /dealatlas. Publish via scripts/publish_github_browser.mjs using authorized Windows Chrome CDP, and verify public GitHub Pages afterward. Canonical details research/phase6-watchlist.md.

Trust: Never invent current bargains, sold prices or authenticity. Do not use rotating proxies to circumvent platform controls. Do not request passwords in chat. Project repo is public.
