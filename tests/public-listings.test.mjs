import test from 'node:test';
import assert from 'node:assert/strict';
import {buildListingSearchUrl,validatePublicListing,normalizePublicSearch} from '../assets/public-listings.mjs';

const base={
  object:'public_listing',id:'8462ee67-e01c-4a8a-9690-a89bdae52c94',
  store:'nibdrawer',title:'Lamy 2000 fountain pen',
  price:150,shipping:9,category:'Collectibles',sold:false,
  url:'https://nibdrawer.resell.store/lamy-2000-makrolon',
  seller:{name:'Nib Drawer'}
};
const fixture=(items=[base])=>({object:'search_result',data:items,total:52,has_more:true});

test('only documented public search endpoint and approved category used',()=>{
  const url=new URL(buildListingSearchUrl({query:'Lamy 2000 & lens',category:'Collectibles',offset:12,limit:12}));
  assert.equal(url.origin,'https://api.resell.store');
  assert.equal(url.pathname,'/v1/market/search');
  assert.equal(url.searchParams.get('q'),'Lamy 2000 & lens');
  assert.equal(url.searchParams.get('category'),'Collectibles');
  assert.equal(url.searchParams.get('offset'),'12');
  assert.throws(()=>buildListingSearchUrl({category:'Hidden'}));
  assert.throws(()=>buildListingSearchUrl({offset:-1}));
});
test('accepts canonical seller listings without claiming sold proof',()=>{
  const v=normalizePublicSearch(fixture(),{limit:12,offset:0});
  assert.equal(v.listings.length,1);
  assert.equal(v.listings[0].priceUsd,150);
  assert.equal(v.listings[0].sellerVerified,false);
  assert.equal(v.listings[0].saleVerified,false);
  assert.equal(v.listings[0].priceType,'seller_asking_price');
  assert.equal(v.nextOffset,1);
});
test('rejects mismatched domain, unsafe schemes, offsite seller host',()=>{
  for (const unsafe of [
    'javascript:alert(1)','https://phishing.example/lamy','https://nibdrawer.resell.store.evil.com/lamy',
    'http://nibdrawer.resell.store/lamy','https://nibdrawer.resell.store/lamy?redirect=evil',
    'https://evil.resell.store/lamy','https://a.b.resell.store/lamy']){
    assert.equal(validatePublicListing({...base,url:unsafe}),null,unsafe);
  }
});
test('rejects bad seller claims, sold items, fake data and invalid price',()=>{
  assert.equal(validatePublicListing({...base,sold:true}),null);
  assert.equal(validatePublicListing({...base,price:-1}),null);
  assert.equal(validatePublicListing({...base,price:NaN}),null);
  assert.equal(validatePublicListing({...base,category:'Medical'}),null);
  assert.equal(validatePublicListing({...base,id:'<svg onload=alert(1)>'}),null);
  assert.equal(validatePublicListing({...base,store:'bad.store'}),null);
});
test('unknown shipping or pickup does not imply free cross-border shipping',()=>{
  assert.equal(validatePublicListing({...base,shipping:0}).pickupOrUnknown,true);
  assert.equal(validatePublicListing({...base,shipping:null}).pickupOrUnknown,true);
  assert.equal(validatePublicListing({...base,shipping:10}).pickupOrUnknown,false);
});
test('skip invalid public records, safely deduplicate and advance source offset',()=>{
  const result=normalizePublicSearch(fixture([base,base,{...base,id:'bad'}]),{limit:12,offset:5});
  assert.equal(result.listings.length,1);
  assert.equal(result.discarded,2);
  assert.equal(result.nextOffset,8);
});
test('malformed and oversized responses fail closed',()=>{
  assert.throws(()=>normalizePublicSearch({data:[],total:100,has_more:false}));
  assert.throws(()=>normalizePublicSearch(fixture(Array(13).fill(base)),{limit:12}));
  assert.throws(()=>normalizePublicSearch({...fixture(),total:-1}));
});
