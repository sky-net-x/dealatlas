import {toUSD, calculateGap, marketplaceUrl, shortMoney, rangeForScenario} from './logic.mjs';

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
function updateUI(){renderHero();renderScenarios();updateQuickLinks($('#deal-query').value||currentSearch);}

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
 const val = (id) => Number($('#'+id).value);
 const result=calculateGap({
   price:val('deal-price'),currency:$('#deal-currency').value,
   targetUsd:val('deal-target'),shippingUsd:val('deal-shipping'),otherCostsUsd:val('deal-costs')
 },fx);
 if(!result){
  $('#deal-result').innerHTML='<div class="result-placeholder">A valid price and exchange rate are required. Try USD or reconnect when live FX is available.</div>';
  return;
 }
 const negative=result.gap<0;
 const desc=negative?'Estimated total cost exceeds the benchmark value.':'Potential price difference before unentered expenses and resale fees.';
 $('#deal-result').innerHTML='<div class="result-content '+(negative?'negative':'')+'">'+
 '<span class="result-mini">ESTIMATED PRICE GAP · NOT A PROFIT FORECAST</span>'+
 '<div class="result-number">'+(result.gap>0?'+':'')+escapeHtml(shortMoney(result.gap))+'</div>'+
 '<div class="result-breakdown"><div><span>Estimated landed cost</span><strong>'+escapeHtml(shortMoney(result.totalCost))+'</strong></div><div><span>Gap as % of benchmark</span><strong>'+escapeHtml(result.percent.toFixed(1))+'%</strong></div></div>'+
 '<p>'+escapeHtml(desc)+' Exchange rates: '+(fxReady?'Frankfurter daily reference, '+escapeHtml(fxDate):'USD only · no FX feed')+'. Verify actual market comparables and all fees yourself.</p></div>';
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
  renderScenarios();renderLiveSnapshots();
  document.querySelector('#discover').scrollIntoView({behavior:'smooth'});
 });
 $$('.text-chip').forEach(btn=>btn.addEventListener('click',()=>{
  $('#main-search').value=btn.dataset.query;
  $('#global-search').requestSubmit();
 }));
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
await loadLiveSnapshots();
