# DealAtlas — international price exploration

**Status (25 Oct 2026): free research preview.** DealAtlas has real outbound marketplace search links, live daily FX conversion via Frankfurter, a resale scenario evaluator with user-entered sold-price samples, and **clearly marked synthetic comparisons**. The valuation additions were published to GitHub Pages and successfully smoke-tested in a real browser on 25 Oct 2026.

This is **not** a live bargain finder yet. No sold-price history or automated claims about profits are provided.

## Structure
- index.html — public website
- assets/ — CSS, UI JavaScript and pricing math
- data/demo-scenarios.json — synthetic illustrative values ONLY
- data/live-listings.json — empty until approved eBay feed connects
- data/market-signals.json — **short-lived Discogs marketplace asking-price floors**, fetched from official endpoints; expires after 5.5 hours; not completed sales or verified opportunities
- scripts/collect_discogs.py — no-key authorized source collector (selected known vinyl release IDs)
- .github/workflows/refresh-public-signals.yml — scheduled public signal refresh (every 3 hours)
- scripts/ — optional official eBay Browse API fetcher
- .github/workflows/ — optional refresh job, disabled by default
- research/ — project decisions, sources and next steps
- tests/ — Node and Python tests plus a CDP browser smoke test
- assets/valuation.mjs — resale scenario calculations, lower-quartile sensitivity, break-even price
- assets/source-signals.mjs — strict source validation and expiry checks

## Local run, no installation required
Run: python -m http.server 8000
Open http://localhost:8000 (file:// loads may block JSON).

Run tests: `node --test tests/logic.test.mjs tests/valuation.test.mjs tests/source-signals.test.mjs` and `python -m unittest discover -s tests -p 'test_*.py'`

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
- Six automatically collected Discogs prices are the lowest **current asking price** across that release's offers; they do not identify a specific buyer, seller, grade or sale, and must never be passed to the resale calculator as sold comparables.
- Data is attributed and linked directly to the corresponding Discogs release and has a strict 5.5-hour display lifetime in accordance with Discogs API terms. Failure to refresh hides prices rather than presenting stale ones. The code respects the public endpoint request-rate limit.
- A public resell.store API was inspected but omitted from the live product pending source authenticity and listing provenance review; it is not a verified sold-comparable provider.
- Sample comparison prices are synthetic and prominently labeled.
- The actual marketplaces are linked via outbound searches.
- Currency data: public Frankfurter reference rates, not live trading quotes.
- No true resale benchmark until verified sold comps are available.
