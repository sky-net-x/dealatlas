# DealAtlas — international bargain research preview

**Status: 25 October 2026.** DealAtlas is a free, public prototype for exploring asking prices, marketplace listings and hypothetical resale economics. It is **not** an automated verified bargain-finder.

Live: https://sky-net-x.github.io/dealatlas/
Repo: https://github.com/sky-net-x/dealatlas

## What works

- Search links to major international marketplaces (eBay US/DE/GB/AU and Mercari Japan). These open third-party searches; results are not imported.
- A **public marketplace explorer pilot** calling resell.store's documented, no-key, read-only search API directly from the user's browser. This displays individual seller claims (title, ask, shipping if available) with links back to the seller. It may include demonstration/seeded listings. Neither seller identity, stock, authenticity nor prices have been independently verified.
- One-click copy of a publicly posted asking price into the resale scenario evaluator. Expected resale value and sold-price evidence **must not** be inferred from that asking price.
- Calculator with actual daily reference FX rates, user-entered actual sold comparables, resale fees, shipping, duties, expenses, return reserve and conservative scenario.
- Clear synthetic labels on the six design/demo comparison scenarios.
- Free GitHub Pages hosting; no accounts, payments or API secrets.

## Data rights and dependencies

- Official eBay Browse API integration remains inactive pending Developer Program approval. `data/live-listings.json` stays empty.
- **Discogs marketplace pricing has been disabled.** Its official API calls succeeded in an earlier prototype, but its terms classify Marketplace Data, including prices, as *Restricted Data*, subject to commercial-use and third-party-transfer limits. Pending explicit written permission, the site no longer loads or displays those prices; the scheduled workflow is retired and `data/market-signals.json` contains no price values. The historical GitHub commit record may still contain prior snapshots and should not be redistributed.
- Public resell.store search documentation: https://docs.resell.store/api/marketplace . API access and public browsing are expressly documented. Seller statements and even real-world availability remain unverified; no results are represented as bargains. No listing data is stored by DealAtlas; the browser fetches it on demand. Its catalog is small and may contain demonstrations.
- Any future sponsored advertising, affiliate arrangement or commercial integration must undergo provider-specific usage review.
- No headless scraping, rotating proxies, hidden API access, unauthorized requests or invented sold-price data.

## Project map

- `index.html` — responsive website
- `assets/app.js` — browser UI, live source calls, product prefill
- `assets/public-listings.mjs` — validated public marketplace adapter (URL and schema checks)
- `assets/logic.mjs`, `assets/valuation.mjs` — currencies, sold samples and resale calculations
- `data/demo-scenarios.json` — **synthetic examples**, not actual seller prices
- `data/live-listings.json` — empty approved-eBay placeholder
- `scripts/fetch_ebay.py` — inactive optional authorized official API collector
- `scripts/collect_discogs.py` — disabled collector, retained solely for rights review
- `.github/workflows/refresh-public-signals.yml` — archived/disabled workflow
- `research/` — decisions and phased implementation notes
- `tests/` — browser, Python and JavaScript checks

## Development checks

Serve the site over HTTP: `python -m http.server 8000`

Run Node checks:
`node --test tests/logic.test.mjs tests/valuation.test.mjs tests/public-listings.test.mjs tests/source-signals.test.mjs`

Run Python checks:
`python -m unittest discover -s tests -p 'test_*.py'`

Optional real Chromium smoke test, only if existing CDP is available on localhost port 9222:
`node tests/browser-smoke.mjs`

**Next**: obtain permitted, verifiable completed-sale data (currently missing), broaden reliable inventory integrations, then calculate opportunity scores only when product identity, condition, total purchase cost and source sales evidence can be established.
