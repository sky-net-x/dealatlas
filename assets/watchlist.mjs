// Local-only query watches; no account, email, automatic jobs or notifications.
import {RESELL_CATEGORIES} from './public-listings.mjs';

export const WATCH_STORAGE_KEY='dealatlas.publicWatches.v1';
export const MAX_WATCHES=6;
const watchId=/^w_[0-9a-f-]{36}$/i;

export function normalizeWatch(raw){
  if(!raw || typeof raw!=='object')throw new Error('Watch details are required.');
  const query=typeof raw.query==='string'?raw.query.trim().replace(/\s+/g,' '):'';
  if(query.length<2||query.length>80)throw new Error('Use a search of 2–80 characters.');
  const category=raw.category;
  if(!RESELL_CATEGORIES.includes(category))throw new Error('Unsupported watch category.');
  const maxAskUsd=typeof raw.maxAskUsd==='number'?raw.maxAskUsd:NaN;
  if(!Number.isFinite(maxAskUsd)||maxAskUsd<=0||maxAskUsd>1_000_000)
    throw new Error('Maximum asking price must be between $0.01 and $1,000,000.');
  return {query,category,maxAskUsd:Math.round(maxAskUsd*100)/100};
}

export function readWatchlist(rawString){
  if(!rawString)return [];
  let data;
  try{data=JSON.parse(rawString)}catch{return []}
  if(!data||data.version!==1||!Array.isArray(data.watches))return [];
  const watches=[],seen=new Set();
  for(const raw of data.watches.slice(0,MAX_WATCHES)){
    try{
      const safe=normalizeWatch(raw);
      if(!watchId.test(String(raw.id||'')))continue;
      const key=safe.query.toLocaleLowerCase()+'|'+safe.category;
      if(seen.has(key))continue;
      seen.add(key);
      watches.push({...safe,id:raw.id});
    }catch{}
  }
  return watches;
}

export function createOrUpdateWatch(watches,input,id){
  const safe=normalizeWatch(input);
  const list=Array.isArray(watches)?watches:[];
  const existing=list.find(x=>x.query.toLowerCase()===safe.query.toLowerCase()&&x.category===safe.category);
  if(existing)return list.map(x=>x===existing?{...existing,maxAskUsd:safe.maxAskUsd}:x);
  if(list.length>=MAX_WATCHES)throw new Error('Remove a watch before adding another (maximum six).');
  if(!watchId.test(id))throw new Error('Invalid watch identifier.');
  return [...list,{...safe,id}];
}

export function serializeWatchlist(watches){
  if(!Array.isArray(watches)||watches.length>MAX_WATCHES)throw Error('Invalid watchlist size');
  // Serialization validates as well, so untrusted data cannot be stored.
  const safe=watches.map(x=>({...normalizeWatch(x),id:x.id}));
  if(safe.some(x=>!watchId.test(x.id)))throw Error('Invalid watch identifier');
  return JSON.stringify({version:1,watches:safe});
}

export function selectWatchCandidates(watch,listings){
  const safe=normalizeWatch(watch);
  const candidates=[],seen=new Set();
  for(const listing of listings||[]){
    if(!listing||seen.has(listing.id)||
       !Number.isFinite(listing.priceUsd)||listing.priceUsd>safe.maxAskUsd ||
       listing.priceUsd<=0 || listing.saleVerified!==false || listing.sellerVerified!==false)continue;
    if(safe.category!=='All' && listing.category!==safe.category)continue;
    seen.add(listing.id);
    candidates.push(listing);
  }
  return candidates.sort((a,b)=>a.priceUsd-b.priceUsd).slice(0,5);
}
