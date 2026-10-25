# DealAtlas — Technical plan

Date: 2026-10-25
Temporary product name: DealAtlas.

## Target product
Free global price discovery of underpriced collectible goods, user value before monetization. Revenue may eventually come from ads or partnerships. Marketplace matching deferred.

## Available today
1. Daily public FX via https://frankfurter.dev/ (v2, free, keyless).
2. Real outbound searches to eBay US, DE, GB, AU and Mercari JP.
3. Normalization and price-gap calculator for a user-entered listing, including costs.
4. Illustrative synthetic examples, never presented as real listings.
5. Static web architecture eligible for free GitHub Pages.

## Unsolved dependencies
- Live discovery needs approved marketplace API data. eBay Browse API uses app token and approval (https://www.developer.ebay.com/develop/api/buy).
- Listed asking prices do NOT establish value. For real bargains need verified sold comparables, condition, and authenticity.
- International profitability needs origin/destination shipping, import tariffs, VAT, exchange spreads, resale platform fees and return risk.
- Japan: outbound marketplace search only so far.
- Risk of sold-out listings demands snapshots, timestamps and stale-link handling.

## Staged next steps
A. Connect approved official eBay API and safely refresh listing snapshots.
B. Add reliable permitted sold-comparable data (auction houses, partners, opt-in merchants).
C. Conservative ranking by estimated price gap, condition and landed cost; disclose confidence/uncertainty.
D. Manually verify at least twenty candidates before displaying public "deal" scores.
E. Measure user utility, repeat visits and referrals; then research ad revenue separately.

## Sources checked
- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- https://www.developer.ebay.com/develop/api/buy
- https://developer.ebay.com/api-docs/static/oauth-client-credentials-grant.html
- https://frankfurter.dev/

## Guardrails
All services/tools must be free for this initial build. No circumvention of CAPTCHA, anti-bot, API authorization or access restrictions. No live listing claims from synthetic sample data.
