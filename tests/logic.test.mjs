import test from 'node:test';
import assert from 'node:assert/strict';
import {toUSD,calculateGap,marketplaceUrl,rangeForScenario} from '../assets/logic.mjs';
const rates={USD:1,EUR:0.9,GBP:0.8,JPY:150,AUD:1.5};
test('exchange rate conversion uses units per USD',()=>{
 assert.equal(toUSD(90,'EUR',rates),100);
 assert.equal(toUSD(15000,'JPY',rates),100);
 assert.equal(toUSD(90,'EUR',{}),null);
});
test('gap includes all provided costs',()=>{
 const result=calculateGap({price:90,currency:'EUR',targetUsd:150,shippingUsd:10,otherCostsUsd:5},rates);
 assert.equal(result.totalCost,115); assert.equal(result.gap,35);
});
test('a sample market range is computed, not hardcoded',()=>{
 const result=rangeForScenario({prices:{US:100,JP:15000}},[{id:'US',currency:'USD'},{id:'JP',currency:'JPY'}],rates);
 assert.equal(result.difference,0);
});
test('search links are URL encoded',()=>{
 assert.match(marketplaceUrl('DE','Nikon F3 + lens'),/Nikon%20F3%20%2B%20lens/);
});
