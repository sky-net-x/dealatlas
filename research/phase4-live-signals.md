# DealAtlas Phase 4 — Authorized Live Market Signals
Date: 2026-10-25

## What is actually new
- Identified a public, official Discogs API read surface. No developer credentials required for reading known releases and marketplace stats.
- Confirmed live HTTP 200 JSON from /releases/{id} and /marketplace/stats/{id}?curr_abbr=USD.
- Added scripts/collect_discogs.py to collect six curated vinyl releases using a conservative read cadence, normalize prices, refuse invalid responses, and atomically update data/market-signals.json.
- Public site renders real *lowest asking price* and current count of items offered (not individual listings or confirmed sales), with exact per-record attribution "Data provided by Discogs." and direct link back to original release.
- The collector never claims "bargains", authenticity, completed sale, condition match, profit or delivered price.
- Snapshot expires 5 hours 30 minutes after collection. The browser validates source, data types, canonical safe URLs, current timestamps, expiry, duplicate IDs, and price type; expired prices are hidden.
- Added GitHub Actions scheduled refresh every three hours (UTC). If API call fails, action fails without replacing previously published JSON; site automatically hides old values.
- Added tests for stale/future timestamps, provenance, malformed values and invalid URLs; added browser smoke assertions. Total: 19 Node and 3 Python tests.

## Important provider policies
- Discogs API TOU: https://support.discogs.com/hc/en-us/articles/360009334593-API-Terms-of-Use
- Current dynamic API data must not be displayed more than six hours old.
- Attribution links must point directly back to the source; no nofollow.
- The platform disclaimer is prominently visible beside the data.
- No Discogs API images or restricted profile information are collected; no scraped HTML.
- Commercial plans, marketing and third-party redistribution need specific terms review before any change to the product model.

## Other research
- resell.store publicly documents a read-only no-key marketplace search: https://docs.resell.store/api/marketplace . Tested direct GET successfully and observed a small ~52-listing catalog with plausible-looking but potentially demo/seeded entries; not considered independently verified deals. NOT ingested into the public product.
- Vollector public API documentation appeared in search but live endpoint was HTTP 404 on test; not used.
- eBay Developer account still under review, so approved Browse API ingestion stays disabled.

## Next
- Monitor scheduled GitHub Actions release and verify the next fresh snapshot is actually published.
- Expand approved provider and partner sources to individual verifiable seller listings across categories.
- Add consent-safe, provenance-backed actual completed sales only once verifiable sold price feeds exist; never derive profit from listing floor values.
- Only then add a conservative opportunity ranking and user alert pipeline.
