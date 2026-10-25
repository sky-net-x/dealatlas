# DealAtlas — Phase 6: Private Product Watchlist (2026-10-25)

## Features
- Users can save up to six product queries, categories and maximum asking prices in USD.
- Data is stored **only in this browser's localStorage**; no account, cloud database, tracking cookie, sign-up or payment.
- Checks are strictly **user-initiated**; never claim background watches, automatic alerting or push notification.
- A single-source official resell.store public read-only API (no key) is queried when the user clicks Check. Queries use price-asc and inspect up to 20 currently offered seller listings per watch; show up to five under the asking-price threshold. Only the first page is checked, and "zero" is not proof of nonexistence.
- The matching algorithm does NOT establish comparable resale value, verified transaction price, authenticity, seller reputation, price history, safe purchase or profit.
- Results exist only until the page reloads; the saved watch criteria persist, but old matches are never silently reused as current.
- Each watch links the search to the existing international search panel across eBay US/DE/GB/AU and Mercari JP, and launches a fresh read-only public resell.store query.

## Integrity / design choices
- Site labels the public API as experimental and possibly seeded/demo.
- Watch is limited to 2–80 character query, approved categories, $0.01–$1,000,000 max seller asking price. No sensitive data intended.
- Bounded safe versioned local storage; invalid or malformed records discarded.
- Search endpoint /v1/market/search has server-side pagination and documented price-asc sorting, but per source API no completed-sales evidence.
- No scheduled, bulk crawling: each watch check queries a single 20-result page only when clicked.
- Seller-provided shipping may be missing or pickup-only; price threshold intentionally refers to asking price BEFORE shipping, customs, tax and platform fees.
- Product results are linked to original sellers, not represented as affiliate recommendations.

## Research / dependencies
- Official resell.store public marketplace API is documented to allow no-key searches, with category, query, limit, offset and sort options: https://docs.resell.store/api/marketplace .
- eBay Browse documented as access-token API, with production access subject to usage requirements. User's developer account remains under review: https://developer.ebay.com/api-docs/buy/buy-requirements.html .
- No independent sold-price feed found/authorized yet; do not claim real bargain discovery.
- Discogs restricted marketplace prices remain disabled and have zero active refresh jobs.

## Verification
- 33 Node tests including 7 dedicated watchlist tests passed.
- 3 Python tests passed.
- Local browser full flow: save Lamy 2000 / Collectibles / $180; check source; see candidate asking $150; reload persists criteria without old result; remove watch; no horizontal mobile overflow.
- Publish to GitHub main and verify public Pages behavior separately.
