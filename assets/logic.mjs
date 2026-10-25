// DealAtlas: pricing math. No price data is inferred by AI.
export const MARKETPLACE_IDS = {US:'EBAY_US',DE:'EBAY_DE',GB:'EBAY_GB',AU:'EBAY_AU',FR:'EBAY_FR'};
export const CURRENCIES = {US:'USD',DE:'EUR',GB:'GBP',JP:'JPY',AU:'AUD'};
export function toUSD(amount, currency, usdBaseRates) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value < 0) return null;
  if (currency === 'USD') return value;
  const rate = Number(usdBaseRates?.[currency]);
  return Number.isFinite(rate) && rate > 0 ? value / rate : null;
}
export function calculateGap({price, currency, targetUsd, shippingUsd=0, otherCostsUsd=0}, rates) {
  const askingUsd = toUSD(price,currency,rates);
  const target = Number(targetUsd), shipping=Number(shippingUsd), extras=Number(otherCostsUsd);
  if (askingUsd===null || [target,shipping,extras].some(v=>!Number.isFinite(v)||v<0) || target===0) return null;
  const totalCost=askingUsd+shipping+extras;
  const gap=target-totalCost;
  return {askingUsd,totalCost,gap,percent:(gap/target)*100};
}
export function marketplaceUrl(market, query) {
  const q=encodeURIComponent(String(query||'').trim());
  const urls={
    US:'https://www.ebay.com/sch/i.html?_nkw='+q+'&LH_BIN=1&_sop=15',
    DE:'https://www.ebay.de/sch/i.html?_nkw='+q+'&LH_BIN=1&_sop=15',
    GB:'https://www.ebay.co.uk/sch/i.html?_nkw='+q+'&LH_BIN=1&_sop=15',
    JP:'https://jp.mercari.com/search?keyword='+q,
    AU:'https://www.ebay.com.au/sch/i.html?_nkw='+q+'&LH_BIN=1&_sop=15'
  };
  return urls[market]||urls.US;
}
export function shortMoney(value, currency='USD') {
  if(!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US',{style:'currency',currency,maximumFractionDigits:currency==='JPY'?0:2}).format(value);
}
export function rangeForScenario(scenario, markets, rates) {
  const prices=markets.map(m=>({market:m,amount:scenario.prices[m.id],usd:toUSD(scenario.prices[m.id],m.currency,rates)})).filter(x=>x.usd!==null);
  if (prices.length<2) return null;
  prices.sort((a,b)=>a.usd-b.usd);
  return {low:prices[0],high:prices[prices.length-1],difference:prices[prices.length-1].usd-prices[0].usd,percent:(prices[prices.length-1].usd-prices[0].usd)/prices[prices.length-1].usd*100,prices};
}
