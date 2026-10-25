# DealAtlas — handoff for AI agents

Context: This is the user's free-first international deals discovery business MVP. The user wants $0 spending and does NOT want a paywall or subscription initially.

Project roots:
- Windows folder: Documents/Docker/MCP Environment/DealAtlas
- GitHub: https://github.com/sky-net-x/dealatlas
- Published: https://sky-net-x.github.io/dealatlas/

Existing Teaching MCP on Docker:
- workspace_list recognizes default (Education), prefab, converters, but not yet direct DealAtlas mount.
- Windows Chrome is connected via the Teaching MCP browser automation in Education/Browser-Automation/windows-browser.js.
- A browser window's file:// URL can read the Windows DealAtlas project; Chrome CDP may save files to an arbitrary dedicated destination using Browser.setDownloadBehavior. Avoid duplicating authoritative project materials under Education.
- Future agents should add a direct Docker bind mount and workspace configuration if practical, with care not to disrupt existing three project mappings.

Current site: zero-dependency static HTML/CSS/JS + synthetic sample scenarios, real daily FX, marketplace search links, user-entered valuation calculator. Live-listings.json is empty. Optional server-side official eBay script is included but deliberately inactive until developer account approval.

Trust: Never invent current bargains, sold prices or authenticity. Do not use rotating proxies to circumvent platform controls. Do not request passwords in chat. Project repo is public.
