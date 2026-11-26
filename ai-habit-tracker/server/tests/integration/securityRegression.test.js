import { describe, it } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import securityHeaders from "../../src/middleware/securityHeaders.js";
import { createRateLimiter } from "../../src/middleware/rateLimiter.js";
import { verifyFirebaseIdToken } from "../../src/services/firebaseAuth.service.js";
import { logFocus } from "../../src/controllers/focusController.js";

describe("Security Audit Regression Suite", () => {
  it("securityHeaders sets Content-Security-Policy", () => {
    const headers = {};
    const res = {
      removeHeader: () => {},
      setHeader: (name, val) => {
        headers[name] = val;
      },
    };
    securityHeaders({}, res, () => {});
    assert.ok(headers["Content-Security-Policy"], "CSP header must be set");
    assert.ok(headers["Content-Security-Policy"].includes("default-src 'self'"));
    assert.ok(headers["Content-Security-Policy"].includes("frame-ancestors 'none'"));
  });

  it("verifyFirebaseIdToken rejects forged/unsigned JWTs (fail-closed)", async () => {
    const forgedToken = jwt.sign(
      { sub: "victim-uid", email: "victim@example.com", email_verified: true },
      "forged-secret"
    );
    await assert.rejects(
      () => verifyFirebaseIdToken(forgedToken),
      /Unable to verify ID token/
    );
  });

  it("rateLimiter ignores spoofed leftmost X-Forwarded-For IP", async () => {
    const limiter = createRateLimiter({
      windowMs: 60 * 1000,
      max: 2,
      message: "Too many requests",
      keyPrefix: "spoof_test_" + Date.now(),
    });

    const statuses = [];
    for (let i = 0; i < 3; i++) {
      const req = {
        headers: {
          "x-forwarded-for": `10.0.0.${i}, 203.0.113.50`,
          "x-test-ratelimit": "true",
        },
      };
      let code = 200;
      const res = {
        setHeader: () => {},
        status: (c) => {
          code = c;
          return { json: () => {} };
        },
      };
      await limiter(req, res, () => {
        code = 200;
      });
      statuses.push(code);
    }

    assert.deepEqual(statuses, [200, 200, 429]);
  });

  it("focusController.logFocus rejects negative or excessive durations", async () => {
    for (const badDuration of [-10, 0, 9999]) {
      let statusCode = 200;
      let body = null;
      const req = {
        user: { _id: "507f1f77bcf86cd799439011" },
        body: { durationMin: badDuration, status: "completed" },
      };
      const res = {
        status: (c) => {
          statusCode = c;
          return {
            json: (b) => {
              body = b;
            },
          };
        },
      };
      await logFocus(req, res);
      assert.strictEqual(statusCode, 400, `Duration ${badDuration} should return 400`);
      assert.ok(body?.message);
    }
  });
});
