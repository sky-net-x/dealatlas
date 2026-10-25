# Verification — 2026-10-25

## Browser smoke test (Linux Chromium through Teaching MCP)
- Website HTTP status: 200
- Page title: DealAtlas — Great deals don't stop at borders.
- Initial illustrative cards: 6
- Filtering Watches: 2
- Market detail rows in expanded scenario: 5
- Daily FX feed reached: Frankfurter data dated 2026-10-25
- Calculator example: EUR 900 ask + USD 40 shipping + USD 75 other costs vs USD 1200 hypothetical benchmark returned about USD 75.28 gap using actual published EUR conversion
- Outbound market links: 5
- Mobile viewport 390px: document scrollWidth = 390, viewport = 390
- JavaScript page errors: zero
- Node 4 unit tests: pass
- Python optional API collector: syntax valid; no credentials -> does not modify feed.

## Evidence
- site-desktop.png: headless browser capture
- site-mobile.png: headless browser capture

## Important limitations
No live bargain scoring, sold comps, seller verification, cross-border tax calculator or eBay API feed yet. Sample prices are invented solely as UX fixtures. Do not present these examples as authentic market quotes.

## Ready for publishing
Static assets can be deployed to public GitHub Pages for $0. Requires GitHub repository plus Pages activation.
