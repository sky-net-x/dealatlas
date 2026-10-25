import test from 'node:test';
import assert from 'node:assert/strict';
import {
 WATCH_STORAGE_KEY,MAX_WATCHES,normalizeWatch,readWatchlist,
 createOrUpdateWatch,serializeWatchlist,selectWatchCandidates
} from '../assets/watchlist.mjs';
import {buildListingSearchUrl,normalizePublicSearch} from '../assets/public-listings.mjs';

const id=n=>'w_'+('00000000-0000-4000-8000-'+String(n).padStart(12,'0'));
const watch={query:'Lamy 2000',category:'Collectibles',maxAskUsd:170};
const normalized={id:'l1',title:'Lamy 2000',priceUsd:150,category:'Collectibles',saleVerified:false,sellerVerified:false,url:'https://nibdrawer.resell.store/lamy'};
test('persist watchlist schema safely; reload saved watches',()=>{
  let watches=createOrUpdateWatch([],watch,id(1));
  const value=serializeWatchlist(watches);
  assert.equal(WATCH_STORAGE_KEY,'dealatlas.publicWatches.v1');
  assert.deepEqual(readWatchlist(value),watches);
});
test('invalid or tampered browser storage fails closed without throwing',()=>{
  assert.deepEqual(readWatchlist('{broken'),[]);
  assert.deepEqual(readWatchlist('{"version":3,"watches":[]}'),[]);
  const raw={version:1,watches:[{...watch,id:'<img onerror=x>'},{...watch,id:id(2),maxAskUsd:-1}]};
  assert.deepEqual(readWatchlist(JSON.stringify(raw)),[]);
});
test('safe numeric budget and bounded user inputs required',()=>{
  assert.throws(()=>normalizeWatch({...watch,maxAskUsd:-100}));
  assert.throws(()=>normalizeWatch({...watch,maxAskUsd:Infinity}));
  assert.throws(()=>normalizeWatch({...watch,category:'Hacked'}));
  assert.throws(()=>normalizeWatch({...watch,query:'x'}));
  assert.throws(()=>normalizeWatch({...watch,query:'X'.repeat(81)}));
  assert.deepEqual(normalizeWatch({...watch,query:' Lamy   2000 ',maxAskUsd:170.559}),{...watch,maxAskUsd:170.56});
});
test('same search and category updates budget without duplicating watch',()=>{
  const original=createOrUpdateWatch([],watch,id(1));
  const updated=createOrUpdateWatch(original,{...watch,query:'lamy 2000',maxAskUsd:110},id(2));
  assert.equal(updated.length,1);
  assert.equal(updated[0].id,id(1));
  assert.equal(updated[0].maxAskUsd,110);
});
test('at most six local watches allowed',()=>{
  let watches=[];
  for(let i=0;i<MAX_WATCHES;i++)watches=createOrUpdateWatch(watches,{...watch,query:'Lamy '+i},id(i));
  assert.equal(watches.length,6);
  assert.throws(()=>createOrUpdateWatch(watches,{...watch,query:'Seventh'},id(99)),/maximum six/);
});
test('candidate filtering never equates asking prices with completed-sale values',()=>{
  const vals=[
    {...normalized,id:'a',priceUsd:165},
    {...normalized,id:'b',priceUsd:175},
    {...normalized,id:'c',priceUsd:80},
    {...normalized,id:'d',saleVerified:true,priceUsd:40},
    {...normalized,id:'e',sellerVerified:true,priceUsd:10},
    {...normalized,id:'f',category:'Home',priceUsd:10}
  ];
  const hits=selectWatchCandidates(watch,vals);
  assert.deepEqual(hits.map(x=>x.id),['c','a']);
});
test('watch queries use documented price-ascending sorting',()=>{
  const url=new URL(buildListingSearchUrl({query:'Lamy 2000',category:'Collectibles',sort:'price-asc',limit:20}));
  assert.equal(url.searchParams.get('sort'),'price-asc');
  assert.equal(url.searchParams.get('limit'),'20');
  assert.throws(()=>buildListingSearchUrl({sort:'recently-sold'}));
});
