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

Current site (Phase 5, published and production-browser-tested 2026-10-25): international outbound searches, real daily FX, synthetic demo cards, resale calculator, and an on-demand public seller listing search pilot via the documented no-key resell.store API. Listings may be seeded/demo and sellers, stock and price are NOT independently verified. Public query results are loaded directly in the browser, not cached by the app. Clicking 'Check costs' transfers asking price/known shipping and clears old resale value and sold comparables. Discogs marketplace statistics were DISABLED and published JSON emptied after a terms review identified Marketplace Data as Restricted Data; the recurring workflow was retired and collector requires explicit rights-approval env var. Do not re-enable without written rights clearance. eBay official API still awaiting Developer approval; data/live-listings.json remains empty. 26 Node tests and local/production Chrome smoke tests passed. Canonical details in research/phase5-public-explorer.md.

Trust: Never invent current bargains, sold prices or authenticity. Do not use rotating proxies to circumvent platform controls. Do not request passwords in chat. Project repo is public.
