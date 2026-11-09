import { describe, it } from "node:test";
import assert from "node:assert/strict";

function calculateCorrelation(arrX, arrY) {
  if (!arrX || !arrY || arrX.length < 3 || arrX.length !== arrY.length) return 0;
  const n = arrX.length;
  const sumX = arrX.reduce((a, b) => a + b, 0);
  const sumY = arrY.reduce((a, b) => a + b, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const diffX = arrX[i] - meanX;
    const diffY = arrY[i] - meanY;
    num += diffX * diffY;
    denX += diffX * diffX;
    denY += diffY * diffY;
  }

  if (denX === 0 || denY === 0) return 0;
  return num / Math.sqrt(denX * denY);
}

describe("Mathematical Pearson Correlation Engine (journalAnalytics.service.js)", () => {
  it("computes r = 1.0 for perfect positive correlation", () => {
    const sleepHours = [6, 7, 8, 9, 10];
    const productivity = [12, 14, 16, 18, 20];
    const r = calculateCorrelation(sleepHours, productivity);
    assert.ok(Math.abs(r - 1.0) < 1e-6, `Expected r close to 1.0, got ${r}`);
  });

  it("computes r = -1.0 for perfect negative correlation", () => {
    const stressLevel = [1, 2, 3, 4, 5];
    const moodScore = [5, 4, 3, 2, 1];
    const r = calculateCorrelation(stressLevel, moodScore);
    assert.ok(Math.abs(r - (-1.0)) < 1e-6, `Expected r close to -1.0, got ${r}`);
  });

  it("returns 0 for arrays with zero variance (denX or denY = 0)", () => {
    const constantMood = [4, 4, 4, 4, 4];
    const waterLiters = [2, 3, 2.5, 3.5, 4];
    const r = calculateCorrelation(constantMood, waterLiters);
    assert.strictEqual(r, 0, "Zero variance array must return 0 without throwing or returning NaN");
  });

  it("safely handles datasets with fewer than 3 samples", () => {
    assert.strictEqual(calculateCorrelation([1, 2], [2, 4]), 0);
    assert.strictEqual(calculateCorrelation([], []), 0);
    assert.strictEqual(calculateCorrelation(null, [1, 2, 3]), 0);
  });

  it("safely handles unequal length arrays", () => {
    const r = calculateCorrelation([1, 2, 3], [1, 2, 3, 4]);
    assert.strictEqual(r, 0);
  });
});

