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

Current site: free static HTML/CSS/JS with synthetic examples, real daily FX, international outbound searches, plus a resale scenario evaluator with user-entered sold comps and costs. Phase 3 published to GitHub Pages and browser-tested 2026-10-25. Live-listings.json is still empty. Official eBay integration remains inactive pending Developer review.

Trust: Never invent current bargains, sold prices or authenticity. Do not use rotating proxies to circumvent platform controls. Do not request passwords in chat. Project repo is public.
