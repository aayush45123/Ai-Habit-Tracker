import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  findNutritionDatabaseEntry,
  calculateNutrition,
} from "../../src/services/nutritionDatabase.js";

describe("Nutrition Database & Mathematical Engine (nutritionDatabase.js)", () => {
  it("resolves exact canonical key for staple foods", () => {
    const chapatiEntry = findNutritionDatabaseEntry("chapati");
    assert.ok(chapatiEntry, "Chapati entry must exist in database");
    assert.ok(chapatiEntry.name.includes("Chapati"), "Name must include Chapati");

    const eggEntry = findNutritionDatabaseEntry("boiled_egg");
    assert.ok(eggEntry, "Boiled egg entry must exist");
  });

  it("calculates nutrition accurately for piece-based foods (e.g. 4 chapatis)", () => {
    const res = calculateNutrition("chapati", 4, "piece");
    assert.strictEqual(res.matched, true);
    assert.ok(res.calories > 0, "Calories must be positive");
    assert.ok(res.protein > 0, "Protein must be positive");
    assert.ok(res.calories >= 250 && res.calories <= 450, `Expected ~300-400 kcal for 4 chapatis, got ${res.calories}`);
  });

  it("calculates nutrition accurately for gram-based weight inputs (e.g. 100g cooked rice)", () => {
    const res = calculateNutrition("rice_cooked", 100, "g");
    assert.strictEqual(res.matched, true);
    assert.ok(res.calories >= 100 && res.calories <= 160, `Expected ~130 kcal for 100g cooked rice, got ${res.calories}`);
    assert.ok(res.protein >= 2 && res.protein <= 4, `Expected ~2.5-3.5g protein for 100g cooked rice, got ${res.protein}`);
  });

  it("handles unknown or unmapped food strings gracefully", () => {
    const res = calculateNutrition("some_imaginary_martian_fruit_xyz_123", 1, "piece");
    assert.strictEqual(res.matched, false);
    assert.ok(res.note.includes("No database entry"));
  });

  it("scales linearly with quantity", () => {
    const singleEgg = calculateNutrition("boiled_egg", 1, "piece");
    const doubleEgg = calculateNutrition("boiled_egg", 2, "piece");
    assert.strictEqual(doubleEgg.calories, singleEgg.calories * 2);
  });
});
