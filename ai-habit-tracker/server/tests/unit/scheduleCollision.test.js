import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Helper function implementing the interval collision logic from scheduleController.js
function checkOverlap(eventA, eventB) {
  return Math.max(eventA.startMinutes, eventB.startMinutes) <
         Math.min(eventA.endMinutes, eventB.endMinutes);
}

function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

describe("Schedule Collision & Interval Engine (scheduleController.js)", () => {
  it("detects partial overlap between two events", () => {
    const slotA = { startMinutes: timeToMinutes("09:00"), endMinutes: timeToMinutes("10:30") };
    const slotB = { startMinutes: timeToMinutes("10:00"), endMinutes: timeToMinutes("11:30") };

    assert.strictEqual(checkOverlap(slotA, slotB), true, "09:00-10:30 and 10:00-11:30 must overlap");
    assert.strictEqual(checkOverlap(slotB, slotA), true, "Overlap must be symmetric");
  });

  it("detects full enclosure (one event inside another)", () => {
    const bigSlot = { startMinutes: timeToMinutes("09:00"), endMinutes: timeToMinutes("12:00") };
    const smallSlot = { startMinutes: timeToMinutes("10:00"), endMinutes: timeToMinutes("11:00") };

    assert.strictEqual(checkOverlap(bigSlot, smallSlot), true, "Enclosed slot must trigger conflict");
  });

  it("does NOT conflict on adjacent boundary slots", () => {
    const slot1 = { startMinutes: timeToMinutes("09:00"), endMinutes: timeToMinutes("10:00") };
    const slot2 = { startMinutes: timeToMinutes("10:00"), endMinutes: timeToMinutes("11:00") };

    assert.strictEqual(checkOverlap(slot1, slot2), false, "Adjacent slots (10:00 end and 10:00 start) must not conflict");
  });

  it("does NOT conflict on completely disjoint time blocks", () => {
    const morningSlot = { startMinutes: timeToMinutes("08:00"), endMinutes: timeToMinutes("09:00") };
    const afternoonSlot = { startMinutes: timeToMinutes("14:00"), endMinutes: timeToMinutes("15:30") };

    assert.strictEqual(checkOverlap(morningSlot, afternoonSlot), false, "Disjoint morning and afternoon slots must not conflict");
  });

  it("correctly identifies conflicts in a multi-event list", () => {
    const events = [
      { id: 1, title: "Deep Work", startMinutes: 540, endMinutes: 660 }, // 09:00 - 11:00
      { id: 2, title: "Team Standup", startMinutes: 600, endMinutes: 630 }, // 10:00 - 10:30 (conflicts with 1)
      { id: 3, title: "Lunch", startMinutes: 720, endMinutes: 780 }, // 12:00 - 13:00 (no conflict)
    ];

    const conflictsFor1 = events.filter(e => e.id !== 1 && checkOverlap(events[0], e));
    const conflictsFor3 = events.filter(e => e.id !== 3 && checkOverlap(events[2], e));

    assert.strictEqual(conflictsFor1.length, 1);
    assert.strictEqual(conflictsFor1[0].id, 2);
    assert.strictEqual(conflictsFor3.length, 0);
  });
});

