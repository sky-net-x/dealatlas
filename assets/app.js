import {toUSD, marketplaceUrl, soldSearchUrl, estimateFromSoldComparables, shortMoney, rangeForScenario} from './logic.mjs';
import {describeSoldSample, evaluateResaleCase} from './valuation.mjs';
import {buildListingSearchUrl,normalizePublicSearch} from './public-listings.mjs';
import {WATCH_STORAGE_KEY,MAX_WATCHES,readWatchlist,createOrUpdateWatch,serializeWatchlist,selectWatchCandidates} from './watchlist.mjs';

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
function updateUI(){renderHero();renderScenarios();renderGlobalMarketSearch();updateQuickLinks($('#deal-query').value||currentSearch);}

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

let publicSearchController=null, publicSearchToken=0, publicSearchOffset=0;
let publicVisibleListings=new Map(), publicShownCount=0, publicHasMore=false;
let publicSourceTotal=0;

function renderPublicListing(x){
  const shipping=x.shippingUsd!==null && x.shippingUsd>0
    ? 'Listed shipping: '+escapeHtml(shortMoney(x.shippingUsd))
    : (x.shippingUsd===0 ? 'Shipping listed as $0 (may mean pickup only)' : 'Shipping not stated');
  return '<article class="public-listing-card">'+
    '<span class="public-listing-type">'+escapeHtml(x.category)+' · SELLER ASK</span>'+
    '<h4>'+escapeHtml(x.title)+'</h4>'+
    '<p class="public-listing-seller">Store: '+escapeHtml(x.seller)+'</p>'+
    '<div class="public-listing-price">'+escapeHtml(shortMoney(x.priceUsd,'USD'))+'</div>'+
    '<p class="public-listing-shipping">'+shipping+'</p>'+
    '<p class="public-listing-warning">Seller, condition, stock and price unverified.</p>'+
    '<div class="public-listing-actions"><a target="_blank" rel="noopener noreferrer" href="'+escapeHtml(x.url)+'">Verify at source ↗</a>'+
    '<button type="button" class="compare-public-listing" data-id="'+escapeHtml(x.id)+'">Check costs →</button></div></article>';
}
async function fetchPublicListings({append=false}={}){
  const query=$('#public-market-query').value.trim();
  const category=$('#public-market-category').value;
  const cards=$('#public-market-cards'), status=$('#public-market-status'), more=$('#public-market-more');
  const token=++publicSearchToken;
  if(publicSearchController)publicSearchController.abort();
  const controller=new AbortController();
  publicSearchController=controller;
  const timeout=setTimeout(()=>controller.abort(),13000);
  $('#public-market-submit').disabled=true;
  more.hidden=true;
  status.textContent='Checking the public marketplace API…';
  if(!append){publicSearchOffset=0;publicShownCount=0;publicVisibleListings.clear();cards.innerHTML='';}
  try {
    const u=buildListingSearchUrl({query,category,offset:publicSearchOffset,limit:12});
    const response=await fetch(u,{signal:controller.signal,cache:'no-store'});
    if(!response.ok)throw Error('HTTP '+response.status);
    const payload=await response.json();
    const result=normalizePublicSearch(payload,{limit:12,offset:publicSearchOffset});
    if(token!==publicSearchToken)return;
    publicSearchOffset=result.nextOffset;
    publicSourceTotal=result.total;
    publicHasMore=result.hasMore;
    let added=0;
    for(const item of result.listings){
      if(publicVisibleListings.has(item.id))continue;
      publicVisibleListings.set(item.id,item);
      cards.insertAdjacentHTML('beforeend',renderPublicListing(item));
      added++;
    }
    publicShownCount+=added;
    status.textContent=publicShownCount+' public seller listing'+(publicShownCount===1?'':'s')+
      ' shown · '+publicSourceTotal+' total reported by source · Seller claims not independently verified.';
    if(!publicShownCount)cards.innerHTML='<p class="explorer-unavailable">No verified-format public offers were returned for this search. Try another keyword, a category, or the other marketplace search links.</p>';
    more.hidden=!publicHasMore;
  } catch(error){
    if(token!==publicSearchToken)return;
    if(!append)cards.innerHTML='<p class="explorer-unavailable">This public marketplace could not be reached. Use the original marketplace links above, or try again later.</p>';
    status.textContent='Source currently unavailable; no listings have been fabricated.';
    more.hidden=true;
  } finally{
    clearTimeout(timeout);
    if(token===publicSearchToken)$('#public-market-submit').disabled=false;
  }
}
function prefillPublicListing(id){
  const item=publicVisibleListings.get(id);
  if(!item)return;
  $('#deal-query').value=item.title.slice(0,160);
  $('#deal-price').value=item.priceUsd.toFixed(2);
  $('#deal-currency').value='USD';
  $('#deal-shipping').value=item.pickupOrUnknown ? '' : item.shippingUsd.toFixed(2);
  // Do not let a prior product's assumed resale price or comparables contaminate this item.
  $('#deal-target').value='';
  $('#sold-comps').value='';
  $('#comps-feedback').textContent='';
  $('#deal-result').textContent='Seller asking price copied from a public listing, not verified. Add your shipping, fees and an independently supported resale benchmark before evaluating.';
  $('#compare').scrollIntoView({behavior:'smooth'});
}

let savedWatches=[];
let watchStorageAvailable=true;
let watchResults=new Map();
let watchCheckBusy=false;

function showWatchNotice(message){
  $('#watch-notice').textContent=message;
}
function initializeWatches(){
  try{
    savedWatches=readWatchlist(localStorage.getItem(WATCH_STORAGE_KEY));
  }catch(error){
    watchStorageAvailable=false;
    savedWatches=[];
    showWatchNotice('This browser blocks local storage. Watches work only while this page stays open.');
  }
  renderWatches();
}
function saveWatches(){
  if(!watchStorageAvailable)return;
  try{
    localStorage.setItem(WATCH_STORAGE_KEY,serializeWatchlist(savedWatches));
  }catch(error){
    watchStorageAvailable=false;
    showWatchNotice('Browser storage unavailable; watches are temporary for this visit.');
  }
}
function watchCard(watch){
  const state=watchResults.get(watch.id);
  const head='<div class="watch-card-heading"><div><h4>'+escapeHtml(watch.query)+'</h4><small>'+escapeHtml(watch.category==='All'?'All categories':watch.category)+' · max ask '+escapeHtml(shortMoney(watch.maxAskUsd))+' USD</small></div>'+
    '<button type="button" class="watch-remove" data-watch-id="'+escapeHtml(watch.id)+'" aria-label="Remove watch '+escapeHtml(watch.query)+'">×</button></div>';
  let body='';
  if(!state){
    body='<p class="watch-result-status">Not checked yet. Results are retrieved only when you request them.</p>';
  }else if(state.loading){
    body='<p class="watch-result-status">Checking the source now…</p>';
  }else if(state.error){
    body='<p class="watch-result-status">Source unavailable. No match claims were made.</p>';
  }else{
    body='<p class="watch-result-status">'+state.matches.length+' candidate'+(state.matches.length===1?'':'s')+
      ' under your asking-price limit, from '+state.inspected+' source results checked'+
      (state.more?' (more may exist)':'')+'. Checked '+escapeHtml(state.time)+'.</p>';
    body+=state.matches.length?'<div class="watch-match-list">'+state.matches.map(x=>
      '<a target="_blank" rel="noopener noreferrer" href="'+escapeHtml(x.url)+'"><span>'+escapeHtml(x.title)+'</span><strong>'+escapeHtml(shortMoney(x.priceUsd))+'</strong></a>'
    ).join('')+'</div>':'<p class="watch-empty">No matching seller asks in the first checked page. This is not evidence that the item is unavailable elsewhere.</p>';
  }
  return '<article class="watch-card" data-watch="'+escapeHtml(watch.id)+'">'+head+body+
    '<div class="watch-card-actions"><button type="button" class="watch-check-one" data-watch-id="'+escapeHtml(watch.id)+'" '+(watchCheckBusy?'disabled':'')+'>Check now ↻</button>'+
    '<button type="button" class="watch-explore-one" data-watch-id="'+escapeHtml(watch.id)+'">Search globally →</button></div>'+ 
    '<p class="watch-caveat">Budget applies to asking price only; exclude shipping, taxes, fees and condition. Listings may be demos.</p></article>';
}
function renderWatches(){
  const grid=$('#watch-grid'),all=$('#watch-check-all');
  grid.innerHTML=savedWatches.length?savedWatches.map(watchCard).join(''):
    '<div class="watch-empty-state">No saved watches yet. Add a product and maximum asking price above to build your private shortlist.</div>';
  all.disabled=watchCheckBusy || !savedWatches.length;
  all.textContent=watchCheckBusy?'Checking source…':'Check watches ↻';
}
async function checkWatch(watch){
  watchResults.set(watch.id,{loading:true});
  renderWatches();
  let timeout;
  const controller=new AbortController();
  try{
    timeout=setTimeout(()=>controller.abort(),12000);
    // Price ascending makes the first page useful for a maximum-ask watch.
    const url=buildListingSearchUrl({query:watch.query,category:watch.category,limit:20,sort:'price-asc'});
    const response=await fetch(url,{cache:'no-store',signal:controller.signal});
    if(!response.ok)throw new Error('Source HTTP '+response.status);
    const payload=await response.json();
    const normalized=normalizePublicSearch(payload,{limit:20,offset:0});
    // A watch always uses exact returned asking amounts, never inferred resale value.
    const matches=selectWatchCandidates(watch,normalized.listings);
    watchResults.set(watch.id,{matches,inspected:payload.data.length,more:normalized.hasMore,time:new Date().toLocaleTimeString()});
  }catch(error){
    watchResults.set(watch.id,{error:true});
  }finally{
    clearTimeout(timeout);
    renderWatches();
  }
}
async function checkSavedWatches(id=null){
  if(watchCheckBusy)return;
  const items=id?savedWatches.filter(w=>w.id===id):[...savedWatches];
  if(!items.length)return;
  watchCheckBusy=true;
  renderWatches();
  for(const watch of items){
    // It may have been removed while the request was pending.
    if(savedWatches.some(w=>w.id===watch.id))await checkWatch(watch);
  }
  watchCheckBusy=false;
  renderWatches();
  showWatchNotice('Check finished. Results reflect seller asking prices from the source, not verified deals. No automatic monitoring or notifications are enabled.');
}
function addWatchFromForm(){
  const input={
    query:$('#watch-query').value,category:$('#watch-category').value,
    maxAskUsd:$('#watch-budget').value===''?NaN:Number($('#watch-budget').value)
  };
  try{
    const before=savedWatches.find(w=>w.query.toLowerCase()===input.query.trim().toLowerCase()&&w.category===input.category);
    savedWatches=createOrUpdateWatch(savedWatches,input,'w_'+crypto.randomUUID());
    // A changed budget invalidates prior short-lived results.
    const affected=savedWatches.find(w=>w.query.toLowerCase()===input.query.trim().toLowerCase()&&w.category===input.category);
    if(affected)watchResults.delete(affected.id);
    saveWatches();
    renderWatches();
    if(watchStorageAvailable)showWatchNotice(before?'Price limit updated and saved in this browser.':'Watch saved privately in this browser. Click “Check now” to search.');
    $('#watch-budget').value='';
  }catch(error){
    showWatchNotice(error.message);
  }
}
function removeWatch(id){
  savedWatches=savedWatches.filter(w=>w.id!==id);
  watchResults.delete(id);
  saveWatches();
  renderWatches();
  showWatchNotice('Watch removed from this browser.');
}
function exploreWatch(id){
  const watch=savedWatches.find(w=>w.id===id);
  if(!watch)return;
  $('#public-market-query').value=watch.query;
  $('#public-market-category').value=watch.category;
  $('#main-search').value=watch.query;
  currentSearch=watch.query;
  renderGlobalMarketSearch();
  renderScenarios();
  renderLiveSnapshots();
  fetchPublicListings();
  $('#global-market-results').scrollIntoView({behavior:'smooth'});
}

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
  $('#watch-form').addEventListener('submit',e=>{e.preventDefault();addWatchFromForm()});
  $('#watch-check-all').addEventListener('click',()=>checkSavedWatches());
  $('#watch-grid').addEventListener('click',e=>{
    const btn=e.target.closest('button[data-watch-id]');
    if(!btn)return;
    const id=btn.dataset.watchId;
    if(btn.classList.contains('watch-remove'))removeWatch(id);
    if(btn.classList.contains('watch-check-one'))checkSavedWatches(id);
    if(btn.classList.contains('watch-explore-one'))exploreWatch(id);
  });
 $('#public-market-form').addEventListener('submit',e=>{e.preventDefault();fetchPublicListings()});
 $('#public-market-more').addEventListener('click',()=>fetchPublicListings({append:true}));
 $('#public-market-cards').addEventListener('click',e=>{
   const button=e.target.closest('.compare-public-listing');
   if(button)prefillPublicListing(button.dataset.id);
 });
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
  renderScenarios();renderLiveSnapshots();renderGlobalMarketSearch();
  $('#public-market-query').value=currentSearch;
  if(!$('#watch-query').value)$('#watch-query').value=currentSearch;
  fetchPublicListings();
  document.querySelector('#discover').scrollIntoView({behavior:'smooth'});
 });
 $$('.text-chip').forEach(btn=>btn.addEventListener('click',()=>{
  $('#main-search').value=btn.dataset.query;
  $('#global-search').requestSubmit();
 }));
 $('#clear-global-search').addEventListener('click',()=>{
  currentSearch='';
  $('#main-search').value='';
  renderScenarios();renderLiveSnapshots();renderGlobalMarketSearch();
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
initializeWatches();
wireEvents();
try{await loadSampleData()}catch(error){$('#scenario-cards').innerHTML='<div class="no-data">The sample dataset could not load. Serve this site via HTTP or GitHub Pages, not by opening index.html directly as a file.</div>';console.error(error)}
await loadFX();
await fetchPublicListings();
await loadLiveSnapshots();
