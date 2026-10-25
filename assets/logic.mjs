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

// A link to eBay's sold-items search is a research aid, not a verified transaction price.
export function soldSearchUrl(market, query) {
  const bases={US:'https://www.ebay.com',DE:'https://www.ebay.de',GB:'https://www.ebay.co.uk',AU:'https://www.ebay.com.au'};
  if(!bases[market]) return null;
  return bases[market]+'/sch/i.html?_nkw='+encodeURIComponent(String(query||'').trim())+'&LH_Sold=1&LH_Complete=1';
}

// Converts user-entered actual sold comparables to a median market benchmark.
// Only explicitly currency-labelled amounts are accepted; no artificial listings.
export function estimateFromSoldComparables(raw, rates) {
  const lines=String(raw||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  if(lines.length<3) return {error:'Enter at least 3 genuinely sold, comparable items.'};
  if(lines.length>40) return {error:'Use up to 40 comparable sale prices.'};
  const values=[];
  for(let i=0;i<lines.length;i++){
    const match=lines[i].match(/^(?:(USD|EUR|GBP|JPY|AUD)\s+([\d,.]+)|([\d,.]+)\s+(USD|EUR|GBP|JPY|AUD))$/i);
    if(!match) return {error:'Line '+(i+1)+': use a price and currency such as 850 USD or 780 EUR.'};
    const currency=(match[1]||match[4]).toUpperCase();
    const numberText=match[2]||match[3];
    if(!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(numberText)) {
      return {error:'Line '+(i+1)+': use a positive numeric price, e.g. 1,250 USD.'};
    }
    const number=Number(numberText.replaceAll(',',''));
    if(!Number.isFinite(number)||number<=0||number>1000000000) return {error:'Line '+(i+1)+': the price must be positive and reasonable.'};
    const usd=toUSD(number,currency,rates);
    if(usd===null) return {error:'A daily FX rate for '+currency+' is unavailable. Reconnect or use USD comparables.'};
    values.push(usd);
  }
  values.sort((a,b)=>a-b);
  const middle=Math.floor(values.length/2);
  const median=values.length%2?values[middle]:(values[middle-1]+values[middle])/2;
  return {count:values.length,medianUsd:median,minUsd:values[0],maxUsd:values[values.length-1],valuesUsd:values};
}
