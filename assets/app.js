import {toUSD, marketplaceUrl, soldSearchUrl, estimateFromSoldComparables, shortMoney, rangeForScenario} from './logic.mjs';
import {describeSoldSample, evaluateResaleCase} from './valuation.mjs';
import {parseSignalSnapshot} from './source-signals.mjs';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const escapeHtml = (value) => String(value??'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const marketFlags = {US:'🇺🇸',DE:'🇩🇪',GB:'🇬🇧',JP:'🇯🇵',AU:'🇦🇺'};
const marketNames = {US:'United States',DE:'Germany',GB:'United Kingdom',JP:'Japan',AU:'Australia'};
let scenarios = [], markets = [];
let fx = {USD:1}, fxDate = null, fxReady = false, currentCategory='All', currentSearch='', sortBy='gap';

function marketLinks(query) {
  const clean=String(query||'').trim() || 'vintage collectibles';
  return markets.map(m => '<a target="_blank" rel="noopener noreferrer" href="'+escapeHtml(marketplaceUrl(m.id,clean))+'" title="Search '+escapeHtml(m.platform)+'">'+marketFlags[m.id]+' '+m.id+' ↗</a>').join('');
}
function updateQuickLinks(query) {
  $('#quick-market-link-items').innerHTML = marketLinks(query);
}
function renderHero() {
  const product=scenarios.find(x=>x.id==='seiko-skx007');
  if(!product || !markets.length)return;
  const prices=markets.map(m => ({market:m,price:product.prices[m.id],usd:toUSD(product.prices[m.id],m.currency,fx)}));
  const available=prices.filter(x=>x.usd!==null);
  const min=available.length?Math.min(...available.map(x=>x.usd)):null;
  const max=available.length?Math.max(...available.map(x=>x.usd)):null;
  $('#hero-market-rows').innerHTML = prices.map(x=>{
   const fraction = x.usd===null || !max ? 0 : Math.round(x.usd/max*100);
   const cheapest = min!==null && x.usd===min;
   return '<div class="market-row '+(cheapest?'cheapest':'')+'"><span class="market-label"><span class="flag">'+marketFlags[x.market.id]+'</span>'+x.market.id+'</span><div class="bar-track"><div class="bar-fill" style="width:'+fraction+'%"></div></div><span class="market-price">'+escapeHtml(shortMoney(x.price,x.market.currency))+'</span></div>';
  }).join('');
  $('#fx-status').textContent = fxReady ? 'FX rates · '+fxDate : 'FX feed unavailable · prices in local currency';
}
function scenarioCard(item){
 const range=rangeForScenario(item,markets,fx);
 const low=range?.low, high=range?.high;
 const diff=range ? shortMoney(range.difference) : 'FX unavailable';
 const subtitle=range ? (marketFlags[low.market.id]+' '+low.market.id+' to '+marketFlags[high.market.id]+' '+high.market.id+' · sample only') : 'Local sample prices only';
 const details=markets.map(m=>
  '<tr><td>'+marketFlags[m.id]+' '+escapeHtml(m.name)+'</td><td>'+escapeHtml(shortMoney(item.prices[m.id],m.currency))+'</td><td><a href="'+escapeHtml(marketplaceUrl(m.id,item.query))+'" rel="noopener noreferrer" target="_blank" aria-label="Search '+escapeHtml(item.name)+' in '+escapeHtml(m.name)+'">Search ↗</a></td></tr>'
 ).join('');
 const marketId=low?.market?.id||'US';
 return '<article class="scenario-card" data-scenario="'+escapeHtml(item.id)+'">'+
 '<div class="scenario-art"><span class="category-small">'+escapeHtml(item.category)+'</span><span class="item-icon" aria-hidden="true">'+item.icon+'</span></div>'+
 '<div class="scenario-body"><h3>'+escapeHtml(item.name)+'</h3><p class="scenario-desc">'+escapeHtml(item.description)+'</p>'+
 '<span class="range-label">HYPOTHETICAL CROSS-MARKET PRICE RANGE</span>'+
 '<div class="range-value">'+escapeHtml(diff)+' <small>difference</small></div>'+
 '<div class="range-note">'+subtitle+'</div>'+
 '<div class="scenario-actions"><button type="button" class="expand-btn" aria-expanded="false">Compare all 5</button><a target="_blank" rel="noopener noreferrer" href="'+escapeHtml(marketplaceUrl(marketId,item.query))+'">Search listings ↗</a></div>'+
 '<div class="details"><table class="details-table"><tbody>'+details+'</tbody></table>'+
 '<p class="details-caption">Illustrative figures for UI testing only. Search links lead to current marketplace results; prices above do not come from those results. Cross-border taxes, fees, condition and shipping are excluded.</p></div>'+
 '</div></article>';
}
function renderGlobalMarketSearch(){
  const query=currentSearch.trim();
  const panel=$('#global-market-results');
  if(!query || !markets.length){panel.hidden=true;return}
  panel.hidden=false;
  $('#global-product-name').textContent=query;
  $('#global-market-grid').innerHTML=markets.map(m=>{
    const sold=soldSearchUrl(m.id,query);
    return '<div class="market-destination"><span class="dest-flag">'+marketFlags[m.id]+'</span><h4>'+escapeHtml(m.name)+'</h4><small>'+escapeHtml(m.platform)+' · '+escapeHtml(m.currency)+'</small>'+
    '<div class="dest-actions"><a target="_blank" rel="noopener noreferrer" href="'+escapeHtml(marketplaceUrl(m.id,query))+'">Live listings ↗</a>'+
    (sold?'<a target="_blank" rel="noopener noreferrer" href="'+escapeHtml(sold)+'">Sold search ↗</a>':'')+
    '</div></div>';
  }).join('');
}

function renderScenarios() {
  const query=currentSearch.toLowerCase().trim();
  let filtered=scenarios.filter(x=>(currentCategory==='All'||x.category===currentCategory) && (!query || (x.name+' '+x.category+' '+x.query).toLowerCase().includes(query)));
  if(sortBy==='name')filtered.sort((a,b)=>a.name.localeCompare(b.name));
  else filtered.sort((a,b)=>(rangeForScenario(b,markets,fx)?.difference ?? -1)-(rangeForScenario(a,markets,fx)?.difference ?? -1));
  $('#scenario-cards').innerHTML=filtered.length?filtered.map(scenarioCard).join(''):'<div class="no-data">No illustrative examples match this search. You can still search real listings across five countries using the comparison tool below.</div>';
  $$('.expand-btn').forEach(btn=>btn.addEventListener('click',()=>{
    const details=btn.closest('.scenario-body').querySelector('.details');
    const open=details.classList.toggle('open');
    btn.setAttribute('aria-expanded',String(open));
    btn.textContent=open?'Hide markets':'Compare all 5';
  }));
}
function updateUI(){renderHero();renderScenarios();renderGlobalMarketSearch();renderMarketSignals();updateQuickLinks($('#deal-query').value||currentSearch);}

async function loadSampleData(){
 const response=await fetch('data/demo-scenarios.json',{cache:'no-store'});
 if(!response.ok)throw new Error('Demo data HTTP '+response.status);
 const payload=await response.json();
 if(!Array.isArray(payload.markets)||!Array.isArray(payload.scenarios))throw new Error('Invalid scenario data');
 markets=payload.markets;scenarios=payload.scenarios;
 updateUI();
}
async function loadFX(){
 try{
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),11000);
  let response;
  try{response=await fetch('https://api.frankfurter.dev/v2/rates?base=USD&quotes=EUR,GBP,JPY,AUD',{signal:controller.signal});}
  finally{clearTimeout(timeout)}
  if(!response.ok)throw new Error('FX HTTP '+response.status);
  const rows=await response.json();
  if(!Array.isArray(rows))throw new Error('Unexpected FX response');
  const next={USD:1};
  for(const row of rows){
   if(['EUR','GBP','JPY','AUD'].includes(row.quote)&&Number.isFinite(Number(row.rate))&&Number(row.rate)>0)next[row.quote]=Number(row.rate);
  }
  if(Object.keys(next).length<5)throw new Error('Incomplete FX quotes');
  fx=next;fxDate=rows[0]?.date||'daily';fxReady=true;
 }catch(error){
  fxReady=false;
  console.warn('FX feed unavailable; cross-currency calculations disabled.',error.message);
 }
 updateUI();
}
function showResult(){
  const val = id => $('#'+id).value.trim()==='' ? null : Number($('#'+id).value);
  const rawComps=$('#sold-comps').value.trim();
  const comps=rawComps ? describeSoldSample(rawComps,fx) : null;
  if(comps?.error){
    $('#deal-result').textContent='Sold examples need correction: '+comps.error;
    return;
  }
  const benchmarkUsd=comps ? comps.medianUsd : val('deal-target');
  if(comps)$('#deal-target').value=benchmarkUsd.toFixed(2);
  const result=evaluateResaleCase({
    askPrice:val('deal-price'),askCurrency:$('#deal-currency').value,
    benchmarkUsd,conservativeBenchmarkUsd:comps?.q1Usd ?? null,
    shippingUsd:val('deal-shipping'),otherCostsUsd:val('deal-costs'),
    sellingFeePercent:val('deal-fee-rate'),sellingFixedFeeUsd:val('deal-fixed-fee'),
    reserveUsd:val('deal-reserve'),fxBufferPercent:val('deal-fx-buffer')
  },fx);
  if(result.error){
    $('#deal-result').textContent=result.error+' If FX is unavailable, try USD.';
    return;
  }
  const money=n=>escapeHtml(shortMoney(n));
  const medianLabel=comps?'At sample median':'At assumed resale value';
  const cautiousLabel='At sample lower quartile (25th percentile)';
  const netCard=(name,data)=>'<div class="net-case '+(data.netUsd<0?'net-negative':'')+'"><span>'+escapeHtml(name)+'</span><strong>'+ (data.netUsd>0?'+':'')+money(data.netUsd)+'</strong><small>Assumed sale '+money(data.salePriceUsd)+' · selling fees '+money(data.feeUsd)+'</small></div>';
  const noPurchase=result.purchaseNotViableAtBasis;
  const notes=comps
    ? 'Based on '+comps.count+' unverified, user-entered sold prices. Lower quartile '+money(comps.q1Usd)+', median '+money(comps.medianUsd)+'. These describe your sample, not a future sale-price guarantee. '+comps.cautions.join(' ')
    : 'The expected resale price is entered manually. No independent sale evidence or conservative range has been supplied.';
  $('#deal-result').innerHTML='<div class="resale-result">'+
    '<span class="result-mini">RESALE SCENARIO · NOT A VERIFIED DEAL OR PROFIT FORECAST</span>'+
    '<div class="net-cases">'+netCard(medianLabel,result.medianCase)+
    (result.cautiousCase?netCard(cautiousLabel,result.cautiousCase):'<div class="net-case net-unavailable"><span>Conservative sample case</span><strong>Not available</strong><small>Add 3–40 comparable sold prices to calculate it.</small></div>')+'</div>'+
    '<div class="resale-metrics"><div><span>Total estimated acquisition cost</span><strong>'+money(result.landedUsd)+'</strong></div>'+
    '<div><span>Break-even resale price</span><strong>'+money(result.breakEvenSaleUsd)+'</strong></div>'+
    '<div><span>Maximum break-even buying price (USD)</span><strong>'+(noPurchase?'Not viable at this sale value':money(result.maxAffordableAskUsd))+'</strong></div></div>'+
    '<p class="resale-caveat">'+notes+'</p>'+
    '<p class="resale-caveat">FX buffer '+money(result.fxAllowanceUsd)+' is included. Maximum buy price uses the '+escapeHtml(result.basis)+'. Actual taxes, duties, repairs, authenticity, liquidity, platform rules and unentered costs can change the result. '+(fxReady?'FX: '+escapeHtml(fxDate)+'.':'FX feed unavailable; USD pricing only.')+'</p>'+
    '</div>';
}

let marketSignalSnapshot = null;
function renderMarketSignals(){
  const cards=$('#signal-cards'), age=$('#signal-age');
  const result=parseSignalSnapshot(marketSignalSnapshot);
  if(result.error){
    age.textContent='No current snapshot';
    cards.innerHTML='<p class="source-unavailable">'+escapeHtml(result.error)+' Refreshed data will appear here once the automatic source update succeeds.</p>';
    return;
  }
  age.textContent='Last checked '+new Date(result.fetchedAt).toLocaleString()+' · Expires automatically';
  const q=currentSearch.trim().toLowerCase();
  const selected=result.items.filter(x=>!q||((x.title||'')+' '+(x.artist||'')).toLowerCase().includes(q));
  cards.innerHTML=selected.length ? selected.map(x=>'<article class="source-signal-card">'+
    '<div class="signal-type">VINYL · ASKING-PRICE FLOOR</div>'+
    '<h4>'+escapeHtml(x.artist ? x.artist+' — '+x.title : x.title)+'</h4>'+
    '<p>Release ID '+escapeHtml(x.id)+(x.year?' · '+escapeHtml(x.year):'')+'</p>'+
    '<div class="signal-price">'+escapeHtml(shortMoney(x.lowestAsk,'USD'))+'</div>'+
    '<p class="signal-count">'+escapeHtml(x.listingsCount)+' current listings reported · price is lowest ask, not resale value</p>'+
    '<a href="'+escapeHtml(x.url)+'" target="_blank" rel="noopener">Data provided by Discogs. ↗</a>'+
    '</article>').join('') :
    '<p class="source-unavailable">None of the currently tracked vinyl releases match your search. The five marketplace search links above still work for other products.</p>';
}
async function loadMarketSignals(){
  try{
    const response=await fetch('data/market-signals.json',{cache:'no-store'});
    if(!response.ok)throw new Error('No market snapshot available');
    marketSignalSnapshot=await response.json();
  }catch(error){
    marketSignalSnapshot=null;
    console.warn('Market reference snapshot unavailable:',error.message);
  }
  renderMarketSignals();
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)renderMarketSignals()});

let liveSnapshotItems = [], liveSnapshotDate = null;
function renderLiveSnapshots() {
 const wrap=$('#live-feed-wrap');
 if(!liveSnapshotItems.length){wrap.hidden=true;return}
 const q=currentSearch.trim().toLowerCase();
 const selected=liveSnapshotItems.filter(x=>!q||(String(x.title||'').toLowerCase().includes(q))).slice(0,12);
 wrap.hidden=false;
 $('#live-feed-time').textContent='Snapshot fetched: '+(liveSnapshotDate || 'date not provided')+' · availability must be verified';
 $('#live-feed-cards').innerHTML=selected.length?selected.map(item=>{
  let validUrl='';
  try{
   const u=new URL(item.url);
   if(u.protocol==='https:'&&/(^|\.)ebay\.(com|de|co\.uk|com\.au)$/.test(u.hostname))validUrl=u.href;
  }catch(error){}
  return '<article class="live-item"><span class="live-tag">SOURCE: '+escapeHtml(item.marketplace||'eBay')+' · SNAPSHOT</span><strong>'+escapeHtml(String(item.title||'').slice(0,120))+'</strong><div><b>'+escapeHtml(shortMoney(Number(item.price),String(item.currency||'USD')))+'</b>'+(validUrl?'<a target="_blank" rel="noopener noreferrer" href="'+escapeHtml(validUrl)+'">View listing ↗</a>':'<span>Link unavailable</span>')+'</div></article>';
 }).join(''):'<div class="live-empty">No snapshot matches this search. Try the marketplace search links instead.</div>';
}
async function loadLiveSnapshots(){
 try{
  const response=await fetch('data/live-listings.json',{cache:'no-store'});
  if(!response.ok)return;
  const data=await response.json();
  liveSnapshotItems=Array.isArray(data.items)?data.items:[];
  liveSnapshotDate=data.lastUpdated;
  renderLiveSnapshots();
 }catch(error){console.warn('Optional live snapshot unavailable:',error.message)}
}

function wireEvents(){
 $$('#category-buttons button').forEach(btn=>btn.addEventListener('click',()=>{
  currentCategory=btn.dataset.category;
  $$('#category-buttons button').forEach(b=>{b.classList.toggle('active',b===btn);b.setAttribute('aria-pressed',String(b===btn))});
  renderScenarios();
 }));
 $('#sort-by').addEventListener('change',e=>{sortBy=e.target.value;renderScenarios()});
 $('#global-search').addEventListener('submit',e=>{
  e.preventDefault();
  currentSearch=$('#main-search').value.trim();
  $('#deal-query').value=currentSearch;
  updateQuickLinks(currentSearch);
  renderScenarios();renderLiveSnapshots();renderMarketSignals();renderGlobalMarketSearch();
  document.querySelector('#discover').scrollIntoView({behavior:'smooth'});
 });
 $$('.text-chip').forEach(btn=>btn.addEventListener('click',()=>{
  $('#main-search').value=btn.dataset.query;
  $('#global-search').requestSubmit();
 }));
 $('#clear-global-search').addEventListener('click',()=>{
  currentSearch='';
  $('#main-search').value='';
  renderScenarios();renderLiveSnapshots();renderMarketSignals();renderGlobalMarketSearch();
 });
 $('#estimate-value-btn').addEventListener('click',()=>{
  const feedback=$('#comps-feedback');
  const result=estimateFromSoldComparables($('#sold-comps').value,fx);
  if(result.error){
    feedback.classList.add('error');
    feedback.textContent=result.error;
    return;
  }
  $('#deal-target').value=result.medianUsd.toFixed(2);
  feedback.classList.remove('error');
  feedback.textContent='Median '+shortMoney(result.medianUsd)+' from '+result.count+' user-provided sales. Range: '+shortMoney(result.minUsd)+' – '+shortMoney(result.maxUsd)+'. Check that items have similar condition, model and sale date.';
 });
 $('#deal-query').addEventListener('input',e=>updateQuickLinks(e.target.value));
 $('#deal-form').addEventListener('submit',e=>{e.preventDefault();showResult()});
 $('#deal-origin').addEventListener('change',e=>{
  const currency=markets.find(m=>m.id===e.target.value)?.currency;
  if(currency)$('#deal-currency').value=currency;
 });
}
wireEvents();
try{await loadSampleData()}catch(error){$('#scenario-cards').innerHTML='<div class="no-data">The sample dataset could not load. Serve this site via HTTP or GitHub Pages, not by opening index.html directly as a file.</div>';console.error(error)}
await loadFX();
await loadMarketSignals();
await loadLiveSnapshots();
