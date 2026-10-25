// Discogs marketplace signals are asking-price floors, never verified sales.
// Fail closed when data is stale, malformed or cites another destination.
export const MAX_SIGNAL_AGE_MS = 5.5 * 60 * 60 * 1000;

export function parseSignalSnapshot(data, nowMs = Date.now()) {
  if (!data || data.schemaVersion !== 1 ||
      data.source !== 'Discogs API' ||
      data.kind !== 'current_asking_price_floor_not_sold') {
    return {error: 'No validated price signals available.'};
  }
  const at=Date.parse(data.fetchedAt), end=Date.parse(data.expiresAt);
  if (!Number.isFinite(nowMs) || !Number.isFinite(at) || !Number.isFinite(end)
      || at > nowMs+5*60*1000 || end <= nowMs || end <= at
      || end-at > MAX_SIGNAL_AGE_MS || nowMs-at > MAX_SIGNAL_AGE_MS) {
    return {error: 'Price signals expired. Check prices at the original marketplace.'};
  }
  if (!Array.isArray(data.items) || !data.items.length || data.items.length > 20) {
    return {error: 'No validated price signals available.'};
  }
  const unique = new Set();
  const items=[];
  for (const x of data.items) {
    if (!x || !/^\d{1,12}$/.test(String(x.id)) || unique.has(String(x.id)) ||
        typeof x.title !== 'string' || !x.title.trim() || x.title.length > 160 ||
        !Number.isFinite(x.lowestAsk) || x.lowestAsk <= 0 ||
        x.currency !== 'USD' || !Number.isInteger(x.listingsCount) || x.listingsCount < 1 ||
        x.url !== 'https://www.discogs.com/release/'+x.id ||
        x.priceType !== 'lowest_current_asking_price' ||
        x.soldPriceVerified !== false || x.conditionVerified !== false) {
      return {error:'A price signal failed validation; nothing is shown.'};
    }
    unique.add(String(x.id));
    items.push(x);
  }
  return {items,fetchedAt:data.fetchedAt,expiresAt:data.expiresAt};
}
