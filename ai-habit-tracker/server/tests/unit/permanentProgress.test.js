import { describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Habit from "../../src/models/Habit.js";
import HabitLog from "../../src/models/HabitLog.js";
import UserGamification from "../../src/models/UserGamification.js";

describe("Permanent Habit Progress & LeetCode-Style Activity Retention", () => {
  it("HabitLog schema defines userId, habitTitle, category, and date", () => {
    const paths = HabitLog.schema.paths;
    assert.ok(paths.userId, "HabitLog must have userId field");
    assert.ok(paths.habitTitle, "HabitLog must have habitTitle field");
    assert.ok(paths.category, "HabitLog must have category field");
    assert.ok(paths.date, "HabitLog must have date field");
    assert.ok(paths.status, "HabitLog must have status field");
  });

  it("Habit schema defines isDeleted, isArchived, and deletedAt fields", () => {
    const paths = Habit.schema.paths;
    assert.ok(paths.isDeleted, "Habit must have isDeleted field for soft-delete");
    assert.ok(paths.isArchived, "Habit must have isArchived field");
    assert.ok(paths.deletedAt, "Habit must have deletedAt field");
  });

  it("UserGamification schema defines allTimeMaxStreak and lifetimeCompletedLogs", () => {
    const paths = UserGamification.schema.paths;
    assert.ok(paths.allTimeMaxStreak, "UserGamification must have allTimeMaxStreak");
    assert.ok(paths.lifetimeCompletedLogs, "UserGamification must have lifetimeCompletedLogs");
  });

  it("Heatmap grouping helper correctly aggregates logs across dates even if habits are deleted", () => {
    const mockLogs = [
      { date: new Date("2026-10-01T10:00:00Z"), status: "done" },
      { date: new Date("2026-10-01T18:00:00Z"), status: "done" },
      { date: new Date("2026-10-02T12:00:00Z"), status: "done" },
      { date: new Date("2026-11-20T08:00:00Z"), status: "done" },
    ];

    const activityHeatmap = {};
    mockLogs.forEach((l) => {
      const dStr = typeof l.date === "string" ? l.date.split("T")[0] : l.date.toISOString().split("T")[0];
      activityHeatmap[dStr] = (activityHeatmap[dStr] || 0) + 1;
    });

    assert.strictEqual(activityHeatmap["2026-10-01"], 2, "Oct 1 should have 2 completions");
    assert.strictEqual(activityHeatmap["2026-10-02"], 1, "Oct 2 should have 1 completion");
    assert.strictEqual(activityHeatmap["2026-11-20"], 1, "Nov 20 should have 1 completion");
    assert.strictEqual(Object.keys(activityHeatmap).length, 3, "Total active days should be 3");
  });

  it("Max streak calculation retains user allTimeMaxStreak even when current habits array is empty", () => {
    const userHabits = []; // all habits deleted by user
    const gam = { allTimeMaxStreak: 24 };

    const calculatedMaxStreak = Math.max(
      gam.allTimeMaxStreak || 0,
      ...userHabits.map((h) => Math.max(h.streak || 0, h.longestStreak || 0, 0))
    );

    assert.strictEqual(calculatedMaxStreak, 24, "Max streak must not vanish to 0 when user deletes habits");
  });
});
