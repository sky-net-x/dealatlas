// Local scenario calculations. No sale is verified by DealAtlas.
import {estimateFromSoldComparables, toUSD} from './logic.mjs';

const valid = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const round = value => Math.round((value + Number.EPSILON) * 100) / 100;
function percentile(sorted, fraction) {
  const position = (sorted.length - 1) * fraction;
  const low = Math.floor(position), high = Math.ceil(position);
  return sorted[low] + (sorted[high] - sorted[low]) * (position - low);
}

// Prices must be explicitly supplied by the user as sold examples.
// Percentiles describe that sample, NOT future prices or confidence intervals.
export function describeSoldSample(raw, rates) {
  const sample = estimateFromSoldComparables(raw, rates);
  if (sample.error) return sample;
  const q1Usd = percentile(sample.valuesUsd, 0.25);
  const q3Usd = percentile(sample.valuesUsd, 0.75);
  const relativeIqr = sample.medianUsd > 0 ? (q3Usd - q1Usd) / sample.medianUsd : 0;
  return {
    count: sample.count,
    minUsd: sample.minUsd,
    maxUsd: sample.maxUsd,
    medianUsd: sample.medianUsd,
    q1Usd,
    q3Usd,
    relativeIqr,
    cautions: [
      ...(sample.count < 5 ? ['Only '+sample.count+' sold examples; the sample is small.'] : []),
      ...(relativeIqr > 0.25 ? ['Sold prices vary substantially; check differences in condition, accessories and dates.'] : [])
    ]
  };
}

// Returns a transparent *scenario* including resale fees and a lower-sample case.
// All amounts in USD. Inputs are assumptions, not verified profit or tax guidance.
export function evaluateResaleCase({
  askPrice, askCurrency, benchmarkUsd, conservativeBenchmarkUsd = null,
  shippingUsd = 0, otherCostsUsd = 0, sellingFeePercent = 0,
  sellingFixedFeeUsd = 0, reserveUsd = 0, fxBufferPercent = 0
}, rates) {
  const askUsd = askPrice === null || askPrice === '' ? null : toUSD(askPrice, askCurrency, rates);
  const numbers = [benchmarkUsd, shippingUsd, otherCostsUsd, sellingFeePercent,
    sellingFixedFeeUsd, reserveUsd, fxBufferPercent];
  if (askUsd === null || !numbers.every(valid) || benchmarkUsd <= 0
      || sellingFeePercent >= 100 || fxBufferPercent > 100
      || (conservativeBenchmarkUsd !== null &&
          (!valid(conservativeBenchmarkUsd) || conservativeBenchmarkUsd <= 0))) {
    return {error:'Enter valid prices and costs, a positive benchmark, and a selling fee below 100%.'};
  }
  const feeRate = sellingFeePercent / 100;
  const fxRate = fxBufferPercent / 100;
  const askingWithFx = askUsd * (1 + fxRate);
  const landedUsd = askingWithFx + shippingUsd + otherCostsUsd + reserveUsd;
  function atSale(salePrice) {
    const feeUsd = salePrice * feeRate + sellingFixedFeeUsd;
    const proceedsUsd = salePrice - feeUsd;
    return {salePriceUsd:round(salePrice),feeUsd:round(feeUsd),
      proceedsUsd:round(proceedsUsd),netUsd:round(proceedsUsd-landedUsd)};
  }
  const medianCase = atSale(benchmarkUsd);
  const cautiousCase = conservativeBenchmarkUsd === null ? null : atSale(conservativeBenchmarkUsd);
  const breakEvenSaleUsd = (landedUsd + sellingFixedFeeUsd) / (1 - feeRate);
  const saleBasis = conservativeBenchmarkUsd ?? benchmarkUsd;
  const maxAffordableAskUsd = (saleBasis * (1 - feeRate) - sellingFixedFeeUsd -
    shippingUsd - otherCostsUsd - reserveUsd) / (1 + fxRate);
  return {
    askUsd:round(askUsd), fxAllowanceUsd:round(askingWithFx - askUsd),
    landedUsd:round(landedUsd), medianCase, cautiousCase,
    breakEvenSaleUsd:round(breakEvenSaleUsd),
    maxAffordableAskUsd:round(maxAffordableAskUsd),
    basis:conservativeBenchmarkUsd === null ? 'manual assumption' : 'user-entered lower quartile',
    // Break-even capacity can be negative; do not label zero as a feasible price.
    purchaseNotViableAtBasis: maxAffordableAskUsd < 0
  };
}
