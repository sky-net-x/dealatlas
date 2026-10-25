import test from 'node:test';
import assert from 'node:assert/strict';
import {parseSignalSnapshot,MAX_SIGNAL_AGE_MS} from '../assets/source-signals.mjs';

const now=Date.parse('2026-10-25T12:00:00Z');
function fixture(){
  return {
    schemaVersion:1,source:'Discogs API',kind:'current_asking_price_floor_not_sold',
    fetchedAt:'2026-10-25T11:00:00Z',expiresAt:'2026-10-25T16:30:00Z',
    items:[{id:'249504',title:'Never Gonna Give You Up',artist:'Rick Astley',
      lowestAsk:0.67,currency:'USD',listingsCount:120,url:'https://www.discogs.com/release/249504',
      priceType:'lowest_current_asking_price',soldPriceVerified:false,conditionVerified:false}]
  };
}
test('accepts current price floor, not a sold transaction',()=>{
  const v=parseSignalSnapshot(fixture(),now);
  assert.equal(v.items.length,1);
  assert.equal(v.items[0].priceType,'lowest_current_asking_price');
});
test('excludes expired snapshots, including exactly expiry and age 5.5h',()=>{
  const d=fixture();
  assert.match(parseSignalSnapshot(d,Date.parse(d.expiresAt)).error,/expired/);
  assert.match(parseSignalSnapshot(d,now+MAX_SIGNAL_AGE_MS).error,/expired/);
});
test('rejects future-dated snapshots and overlong cache expiry',()=>{
  const a=fixture();
  a.fetchedAt='2026-10-25T12:10:00Z';
  assert.ok(parseSignalSnapshot(a,now).error);
  const b=fixture();
  b.expiresAt='2026-10-25T18:30:01Z';
  assert.ok(parseSignalSnapshot(b,now).error);
});
test('forbids fake sold-price status and untrusted outbound URLs',()=>{
  const a=fixture();a.items[0].soldPriceVerified=true;
  assert.ok(parseSignalSnapshot(a,now).error);
  const b=fixture();b.items[0].url='https://example.org/phish';
  assert.ok(parseSignalSnapshot(b,now).error);
  const c=fixture();c.items[0].lowestAsk=NaN;
  assert.ok(parseSignalSnapshot(c,now).error);
});
test('rejects duplicate ids, missing items and forged provenance',()=>{
  const a=fixture();a.items.push({...a.items[0]});
  assert.ok(parseSignalSnapshot(a,now).error);
  const b=fixture();b.items=[];
  assert.ok(parseSignalSnapshot(b,now).error);
  const c=fixture();c.source='External';
  assert.ok(parseSignalSnapshot(c,now).error);
});
