# DealAtlas Phase 5 — Public-listings explorer (2026-10-25)

## Purpose
Move beyond manually entering the asking price while preserving provenance and source rights.

## Source decision
- Discogs API publicly returned marketplace statistics. Follow-up terms review established that **Marketplace Data, including pricing**, is Restricted Data (https://support.discogs.com/hc/en-us/articles/360009334593-API-Terms-of-Use), which raises commercial-use and transfer restrictions. Do not assume visible attribution alone grants redistribution rights.
- As a precaution, removed Discogs prices from the public UI, emptied published data/market-signals.json, retired the scheduled workflow (no recurring calls), and made manual collector require DISCOGS_MARKETPLACE_PERMISSION_APPROVED=true. Existing historical GitHub commits still contain prior snapshots and should not be copied to another site.
- resell.store provides officially documented public read-only search (https://docs.resell.store/api/marketplace), no API key required and browser CORS permitted. Tested GET /v1/market/search and real browser cross-origin requests. Its public inventory currently includes fictional-sounding samples (e.g. Grovelord, Emberpup, Brickwerk), therefore do **not** assert that all results are purchasable or authentic.

## Implementation
- index.html: Experimental public inventory explorer with on-demand keyword and category search; a prominent source caveat.
- assets/public-listings.mjs: allowlisted official API endpoint, bounded query, pagination, trusted link validation to seller-matching resell.store subdomain, valid numeric USD prices, sold=false check, canonical metadata. No generic web scraping.
- assets/app.js: browse/search direct from the user's browser, fail closed for unavailable/malformed API, multiple page support; show public seller asking prices and reported shipping with direct original source link; compare button prefills asking price and known shipping but ALWAYS clears unrelated sold comparables and expected resale values. Shipping 0 or missing requires user confirmation.
- assets/styles.css: responsive grid and form styling. No image copying.
- No recurring server-side poll or third-party inventory database; product data is not cached centrally.
- Existing eBay official Browse integration stays disabled pending approval.

## Testing
- JavaScript unit tests for URL encoding, malicious URLs, seller/price validation, stale or fake sold flags, and pagination.
- Browser smoke test exercises the real public API + calculator reset, and 390px viewport.
- Public deployment verification required before marking complete.

## Future work
- Seek reliable permitted listing feeds with meaningful coverage and verified history of completed sales (the key missing component). Do not compute discounts from asking-price comparisons alone.
- Verify reseller source legal terms and whether demo data exists before presenting real available offers.
- Add optional personal watchlist for specific product searches, but do not claim push alerts without a functioning notification mechanism.
