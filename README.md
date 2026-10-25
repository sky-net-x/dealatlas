# DealAtlas — international price exploration

**Status (25 Oct 2026): free research preview.** DealAtlas has real outbound marketplace search links, live daily FX conversion via Frankfurter, a resale scenario evaluator with user-entered sold-price samples, and **clearly marked synthetic comparisons**. The valuation additions were published to GitHub Pages and successfully smoke-tested in a real browser on 25 Oct 2026.

This is **not** a live bargain finder yet. No sold-price history or automated claims about profits are provided.

## Structure
- index.html — public website
- assets/ — CSS, UI JavaScript and pricing math
- data/demo-scenarios.json — synthetic illustrative values ONLY
- data/live-listings.json — empty until approved feed connects
- scripts/ — optional official eBay Browse API fetcher
- .github/workflows/ — optional refresh job, disabled by default
- research/ — project decisions, sources and next steps
- tests/ — Node built-in tests and a CDP browser smoke test
- assets/valuation.mjs — resale scenario calculations, lower-quartile sensitivity, break-even price

## Local run, no installation required
Run: python -m http.server 8000
Open http://localhost:8000 (file:// loads may block JSON).

Run tests: `node --test tests/logic.test.mjs tests/valuation.test.mjs`

Optional browser test, only with an existing local Chromium CDP endpoint on port 9222: `node tests/browser-smoke.mjs`. It uses a temporary tab and does not create a second Chromium profile.

## Publish for $0
1. Create a public GitHub repository (dealatlas).
2. Upload all files preserving directories.
3. Settings → Pages → Deploy from branch → main → /(root).
4. The site will use https://YOUR-USERNAME.github.io/dealatlas/

## Enable official eBay listing snapshots (after approval)
Add GitHub repository secrets named EBAY_CLIENT_ID and EBAY_CLIENT_SECRET.
Add repository variable ENABLE_EBAY_FEED=true. Then trigger Actions → Refresh approved eBay listings.
The token is used in Python server-side, not embedded in public HTML/JS.

Never put credentials in the repo. This feed shows unverified listings, NOT proven deals. Stop if API access is denied; no workaround via prohibited scraping.

## Data integrity
- Sample prices are synthetic and prominently labeled.
- The actual marketplaces are linked via outbound searches.
- Currency data: public Frankfurter reference rates, not live trading quotes.
- No true resale benchmark until verified sold comps are available.
