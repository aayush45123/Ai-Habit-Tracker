import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getPresets,
  createEvent,
  cloneDaySchedule,
  applyPresetSchedule,
} from "../../src/controllers/scheduleController.js";

describe("Schedule Controller In-Process Endpoint Tests (/api/schedule)", () => {
  it("getPresets returns all 3 pre-configured daily routine presets", async () => {
    let capturedCode = null;
    let capturedData = null;

    const mockRes = {
      status: (code) => {
        capturedCode = code;
        return mockRes;
      },
      json: (data) => {
        capturedData = data;
        return data;
      },
    };

    await getPresets({}, mockRes);

    assert.strictEqual(capturedCode, 200);
    assert.strictEqual(capturedData.success, true);
    assert.strictEqual(capturedData.presets.length, 3);

    const keys = capturedData.presets.map((p) => p.key);
    assert.ok(keys.includes("productive_workday"));
    assert.ok(keys.includes("student_study"));
    assert.ok(keys.includes("wellness_balance"));
  });

  it("createEvent rejects payload with missing required fields", async () => {
    let capturedCode = null;
    let capturedData = null;

    const mockRes = {
      status: (code) => {
        capturedCode = code;
        return mockRes;
      },
      json: (data) => {
        capturedData = data;
        return data;
      },
    };

    const req = {
      user: { _id: "650000000000000000000001" },
      body: {
        title: "", // Missing title
        date: "2026-11-01",
        startTime: "09:00",
        endTime: "10:00",
      },
    };

    await createEvent(req, mockRes);

    assert.strictEqual(capturedCode, 400);
    assert.strictEqual(capturedData.success, false);
    assert.ok(capturedData.message.includes("required"));
  });

  it("createEvent rejects payload when end time is earlier than start time", async () => {
    let capturedCode = null;
    let capturedData = null;

    const mockRes = {
      status: (code) => {
        capturedCode = code;
        return mockRes;
      },
      json: (data) => {
        capturedData = data;
        return data;
      },
    };

    const req = {
      user: { _id: "650000000000000000000001" },
      body: {
        title: "Invalid Window Task",
        date: "2026-11-01",
        startTime: "14:00",
        endTime: "11:00", // Earlier than start!
      },
    };

    await createEvent(req, mockRes);

    assert.strictEqual(capturedCode, 400);
    assert.strictEqual(capturedData.success, false);
    assert.ok(capturedData.message.includes("End time must be later"));
  });

  it("cloneDaySchedule rejects request when sourceDate or targetDate is missing", async () => {
    let capturedCode = null;
    let capturedData = null;

    const mockRes = {
      status: (code) => {
        capturedCode = code;
        return mockRes;
      },
      json: (data) => {
        capturedData = data;
        return data;
      },
    };

    const req = {
      user: { _id: "650000000000000000000001" },
      body: { sourceDate: "2026-11-01" }, // Missing targetDate
    };

    await cloneDaySchedule(req, mockRes);

    assert.strictEqual(capturedCode, 400);
    assert.strictEqual(capturedData.success, false);
  });

  it("applyPresetSchedule rejects unknown preset keys", async () => {
    let capturedCode = null;
    let capturedData = null;

    const mockRes = {
      status: (code) => {
        capturedCode = code;
        return mockRes;
      },
      json: (data) => {
        capturedData = data;
        return data;
      },
    };

    const req = {
      user: { _id: "650000000000000000000001" },
      body: { presetKey: "non_existent_preset_key_123" },
    };

    await applyPresetSchedule(req, mockRes);

    assert.strictEqual(capturedCode, 400);
    assert.strictEqual(capturedData.success, false);
    assert.ok(capturedData.message.includes("Unknown preset key"));
  });
});
