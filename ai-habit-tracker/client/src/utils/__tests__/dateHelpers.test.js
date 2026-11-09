import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatDateISO,
  formatDisplayDate,
  formatTime12,
  timeToMinutes,
  minutesToTime,
  calculateDuration,
  getWeekDays,
  isCurrentTimeInRange,
} from "../dateHelpers.js";

describe("Client Date & Timetable Helpers (dateHelpers.js)", () => {
  it("formatDateISO returns formatted YYYY-MM-DD string", () => {
    const fixedDate = new Date(2026, 9, 31); // October 31, 2026
    const res = formatDateISO(fixedDate);
    assert.strictEqual(res, "2026-10-31");
  });

  it("formatDisplayDate formats date into friendly string", () => {
    const res = formatDisplayDate("2026-10-31");
    assert.ok(res.includes("2026"), "Should include year");
    assert.ok(res.includes("Oct"), "Should include month");
    assert.ok(res.includes("31"), "Should include day");
  });

  it("timeToMinutes correctly converts 24h string to minutes from midnight", () => {
    assert.strictEqual(timeToMinutes("00:00"), 0);
    assert.strictEqual(timeToMinutes("01:15"), 75);
    assert.strictEqual(timeToMinutes("09:30"), 570);
    assert.strictEqual(timeToMinutes("12:00"), 720);
    assert.strictEqual(timeToMinutes("23:59"), 1439);
    assert.strictEqual(timeToMinutes(""), 0);
    assert.strictEqual(timeToMinutes(null), 0);
  });

  it("minutesToTime converts minutes integer back to HH:mm string", () => {
    assert.strictEqual(minutesToTime(0), "00:00");
    assert.strictEqual(minutesToTime(75), "01:15");
    assert.strictEqual(minutesToTime(570), "09:30");
    assert.strictEqual(minutesToTime(720), "12:00");
    assert.strictEqual(minutesToTime(1439), "23:59");
  });

  it("formatTime12 converts 24h times to 12h AM/PM strings", () => {
    assert.strictEqual(formatTime12("00:00"), "12:00 AM");
    assert.strictEqual(formatTime12("08:15"), "8:15 AM");
    assert.strictEqual(formatTime12("12:00"), "12:00 PM");
    assert.strictEqual(formatTime12("13:45"), "1:45 PM");
    assert.strictEqual(formatTime12("21:30"), "9:30 PM");
  });

  it("calculateDuration correctly formats hour and minute differences", () => {
    assert.strictEqual(calculateDuration("09:00", "10:30"), "1h 30m");
    assert.strictEqual(calculateDuration("14:00", "15:00"), "1h");
    assert.strictEqual(calculateDuration("10:00", "10:45"), "45m");
    assert.strictEqual(calculateDuration("08:00", "08:00"), "0m");
  });

  it("getWeekDays returns 7 consecutive days starting from Monday", () => {
    // 2026-10-31 is Saturday
    const days = getWeekDays("2026-10-31");
    assert.strictEqual(days.length, 7);
    assert.strictEqual(days[0].dayName, "Mon");
    assert.strictEqual(days[5].dayName, "Sat");
    assert.strictEqual(days[6].dayName, "Sun");
    assert.strictEqual(days[5].isSelected, true);
    assert.strictEqual(days[0].dateStr, "2026-10-26"); // Monday of that week
  });

  it("isCurrentTimeInRange returns false for past or future dates", () => {
    const isPast = isCurrentTimeInRange("09:00", "10:00", "2020-01-01");
    assert.strictEqual(isPast, false);
  });
});

