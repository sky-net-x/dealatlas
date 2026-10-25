import test from 'node:test';
import assert from 'node:assert/strict';
import {describeSoldSample, evaluateResaleCase} from '../assets/valuation.mjs';
const rates={USD:1,EUR:0.9,GBP:0.8,JPY:150,AUD:1.5};

test('quartiles calculated on normalized user-provided sold prices',()=>{
  const sample=describeSoldSample('100 USD\n120 USD\n140 USD\n160 USD\n180 USD',rates);
  assert.equal(sample.medianUsd,140);
  assert.equal(sample.q1Usd,120);
  assert.equal(sample.q3Usd,160);
  assert.equal(sample.count,5);
});
test('currency conversion and percentiles respect FX',()=>{
  const sample=describeSoldSample('90 EUR\n120 USD\n21000 JPY\n160 USD\n180 USD',rates);
  assert.equal(sample.q1Usd,120);
  assert.equal(sample.medianUsd,140);
});
test('descriptive sample size and spread warnings are not confidence scores',()=>{
  const small=describeSoldSample('100 USD\n200 USD\n400 USD',rates);
  assert.equal(small.cautions.length,2);
  assert.match(small.cautions[0],/sample is small/);
  assert.match(describeSoldSample('100 USD',rates).error,/at least 3/);
});
test('median and conservative resale outcomes account for fees, buffer and reserve',()=>{
  const x=evaluateResaleCase({
    askPrice:800,askCurrency:'USD',benchmarkUsd:1200,conservativeBenchmarkUsd:1000,
    shippingUsd:50,otherCostsUsd:20,sellingFeePercent:12,sellingFixedFeeUsd:5,
    reserveUsd:30,fxBufferPercent:2
  },rates);
  assert.equal(x.landedUsd,916);
  assert.equal(x.medianCase.netUsd,135);
  assert.equal(x.cautiousCase.netUsd,-41);
  assert.equal(x.breakEvenSaleUsd,1046.59);
  assert.equal(x.maxAffordableAskUsd,759.8);
  assert.equal(x.basis,'user-entered lower quartile');
});
test('manual benchmark is explicitly flagged as an assumption, not a verified deal',()=>{
  const x=evaluateResaleCase({askPrice:90,askCurrency:'EUR',benchmarkUsd:150,sellingFeePercent:10},rates);
  assert.equal(x.landedUsd,100);
  assert.equal(x.medianCase.netUsd,35);
  assert.equal(x.cautiousCase,null);
  assert.equal(x.basis,'manual assumption');
});
test('invalid FX, negative costs, invalid fees, invalid benchmark fail closed',()=>{
  assert.match(evaluateResaleCase({askPrice:90,askCurrency:'EUR',benchmarkUsd:150},{}).error,/valid/);
  assert.match(evaluateResaleCase({askPrice:90,askCurrency:'USD',benchmarkUsd:150,sellingFeePercent:100},rates).error,/valid/);
  assert.match(evaluateResaleCase({askPrice:90,askCurrency:'USD',benchmarkUsd:0},rates).error,/valid/);
  assert.match(evaluateResaleCase({askPrice:null,askCurrency:'USD',benchmarkUsd:150},rates).error,/valid/);
  assert.match(evaluateResaleCase({askPrice:90,askCurrency:'USD',benchmarkUsd:150,reserveUsd:-1},rates).error,/valid/);
  assert.match(evaluateResaleCase({askPrice:90,askCurrency:'USD',benchmarkUsd:150,conservativeBenchmarkUsd:-12},rates).error,/valid/);
});
test('negative maximum purchase price is not hidden as viable zero',()=>{
  const x=evaluateResaleCase({askPrice:40,askCurrency:'USD',benchmarkUsd:100,sellingFixedFeeUsd:200},rates);
  assert.equal(x.purchaseNotViableAtBasis,true);
  assert.ok(x.maxAffordableAskUsd<0);
});
