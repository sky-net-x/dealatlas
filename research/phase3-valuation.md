# DealAtlas Phase 3 — Valuation Engine (2026-10-25)

## Implementation completed in directly mounted Windows DealAtlas MCP workspace
- Added assets/valuation.mjs for explicit resale scenario maths:
  - asking price converted to USD at published reference FX rates
  - exchange-rate buffer charged on the asking price
  - acquisition cost including shipping, other costs, and return/risk reserve
  - resale proceeds after percentage and fixed sale fees
  - scenario net at expected resale value
  - when user enters 3–40 genuine sold comparables, sample median and sample 25th percentile
  - break-even resale price and maximum break-even purchase price, including detection of mathematically nonviable cases
  - caution on small (<5) and wide-spread samples (IQR/median >25%)
- Updated index.html with fee/reserve/FX assumptions inputs, default 12% fee and 2% buffer prominently called EXAMPLE assumptions; no claim these are actual marketplace rates.
- Updated assets/app.js to use the new evaluator and display sensitivity and cost breakdown. Provenance text explicitly states all sold inputs are user-provided and unverified.
- Added mobile styling in assets/styles.css.
- Added 7 new Node unit tests in tests/valuation.test.mjs; 14 tests total pass.
- Added tests/browser-smoke.mjs: tests actual local Chromium UI via existing CDP, both provided-comps and manually assumed resale value, and 390px mobile layout; passed.

## Verified
- 14 / 14 Node unit tests passed.
- Node syntax check for app.js passed; optional Python eBay API script compiles.
- Browser smoke test passed: fixture net +USD 7 at median, -USD 169 at lower quartile; 390px document width at 390px viewport.
- Source folder physically mounted to MCP under /dealatlas; read/write verified.

## Guardrails and dependencies
- eBay Developer API is still **under review** as the user confirmed.
- data/live-listings.json remains empty; no authorized real listings were collected.
- No sold-price examples were automatically obtained or authenticated. The lower quartile is descriptive only, not an uncertainty/confidence interval.
- No fees, VAT, duties, authenticity, liability or future resale price are verified; user must input relevant assumptions.
- Published via the authenticated GitHub browser to the main branch on 2026-10-25. Production site smoke test passed after deployment. The local project folder has **no .git directory**; future updates need an authorized GitHub sync.
- Do not represent this phase as a functioning automated deal finder.

## Next priority
- Maintain the published calculator with real-world feedback while developing independent, provenance-backed data ingestion.
- Develop provenance-backed independent sold-price ingestion as permitted sources become available.
- eBay listing collector is staged but must stay disabled until eBay authorizes the API account.
