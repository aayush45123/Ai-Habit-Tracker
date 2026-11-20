import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import securityHeaders from "../../src/middleware/securityHeaders.js";
import { createRateLimiter } from "../../src/middleware/rateLimiter.js";
import { validateImageMagicBytes } from "../../src/middleware/upload.middleware.js";
import { forgotPasswordSchema, resetPasswordSchema } from "../../src/validators/auth.validator.js";

describe("Phase 8: Production Security Hardening Test Suite", () => {
  // ─── 1. Security Headers Tests ───
  describe("Security Headers (securityHeaders.js)", () => {
    it("strips X-Powered-By and sets strict security headers", () => {
      const headers = {};
      const req = {};
      const res = {
        removeHeader: (name) => {
          delete headers[name];
        },
        setHeader: (name, val) => {
          headers[name] = val;
        },
      };

      let nextCalled = false;
      securityHeaders(req, res, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, true, "Middleware must call next()");
      assert.strictEqual(headers["X-Frame-Options"], "DENY", "Must block clickjacking with DENY");
      assert.strictEqual(headers["X-Content-Type-Options"], "nosniff", "Must prevent MIME sniffing");
      assert.strictEqual(headers["Referrer-Policy"], "strict-origin-when-cross-origin");
      assert.ok(headers["Permissions-Policy"].includes("camera=()"), "Must restrict dangerous browser APIs");
    });
  });

  // ─── 2. Rate Limiting Tests ───
  describe("Rate Limiting Engine (rateLimiter.js)", () => {
    it("allows requests under the threshold and throttles with HTTP 429 when exceeded", () => {
      const limiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 3,
        message: "Rate limit exceeded",
        keyPrefix: "test_rl_" + Date.now(),
      });

      const mockIp = "192.168.1.100";
      const responses = [];

      for (let i = 0; i < 5; i++) {
        const req = {
          headers: {
            "x-forwarded-for": mockIp,
            "x-test-ratelimit": "true", // trigger limiter in test mode
          },
        };
        let statusCode = 200;
        let responseBody = null;
        const res = {
          setHeader: () => {},
          status: (code) => {
            statusCode = code;
            return {
              json: (body) => {
                responseBody = body;
              },
            };
          },
        };

        limiter(req, res, () => {
          statusCode = 200;
        });

        responses.push({ statusCode, responseBody });
      }

      // First 3 requests should succeed (200)
      assert.strictEqual(responses[0].statusCode, 200);
      assert.strictEqual(responses[1].statusCode, 200);
      assert.strictEqual(responses[2].statusCode, 200);

      // 4th and 5th requests must be throttled with HTTP 429
      assert.strictEqual(responses[3].statusCode, 429, "4th request must be throttled");
      assert.strictEqual(responses[3].responseBody.message, "Rate limit exceeded");
      assert.strictEqual(responses[4].statusCode, 429, "5th request must be throttled");
    });
  });

  // ─── 3. Password Reset & Enumeration Defense ───
  describe("Password Recovery Validation (auth.validator.js)", () => {
    it("forgotPasswordSchema rejects malformed email strings", () => {
      const result = forgotPasswordSchema.safeParse({ email: "not-an-email" });
      assert.strictEqual(result.success, false);
    });

    it("forgotPasswordSchema accepts valid email and normalizes it", () => {
      const result = forgotPasswordSchema.safeParse({ email: "User@Domain.COM " });
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.email, "user@domain.com");
    });

    it("resetPasswordSchema enforces strong password policy and token length", () => {
      // Weak password (<8 chars, no special char)
      const weakResult = resetPasswordSchema.safeParse({
        token: "a".repeat(64),
        password: "weak",
      });
      assert.strictEqual(weakResult.success, false);

      // Strong password + valid token
      const validResult = resetPasswordSchema.safeParse({
        token: "a".repeat(64),
        password: "HardenedPassword2026!#",
      });
      assert.strictEqual(validResult.success, true);
    });
  });

  // ─── 4. File Upload Magic Byte Inspection ───
  describe("File Upload Armor (validateImageMagicBytes)", () => {
    it("accepts valid PNG image magic bytes", () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      assert.strictEqual(validateImageMagicBytes(pngBuffer), true);
    });

    it("accepts valid JPEG image magic bytes", () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      assert.strictEqual(validateImageMagicBytes(jpegBuffer), true);
    });

    it("accepts valid WEBP image magic bytes", () => {
      const webpBuffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
      ]);
      assert.strictEqual(validateImageMagicBytes(webpBuffer), true);
    });

    it("strictly rejects malicious SVG / HTML script disguised as image", () => {
      const maliciousSvg = Buffer.from("<svg onload='alert(1)'></svg>");
      assert.strictEqual(validateImageMagicBytes(maliciousSvg), false);

      const maliciousHtml = Buffer.from("<html><script>stealTokens()</script></html>");
      assert.strictEqual(validateImageMagicBytes(maliciousHtml), false);

      const emptyBuffer = Buffer.from([]);
      assert.strictEqual(validateImageMagicBytes(emptyBuffer), false);
    });
  });

  // ─── 5. Cryptographic Hashing Integrity ───
  describe("Cryptographic Token Security", () => {
    it("generates non-deterministic 256-bit entropy and verifies SHA-256 integrity", () => {
      const token1 = crypto.randomBytes(32).toString("hex");
      const token2 = crypto.randomBytes(32).toString("hex");

      assert.notStrictEqual(token1, token2, "Entropy source must be non-deterministic");
      assert.strictEqual(token1.length, 64, "32-byte hex string must be 64 characters");

      const hash1 = crypto.createHash("sha256").update(token1).digest("hex");
      const hash2 = crypto.createHash("sha256").update(token1).digest("hex");
      assert.strictEqual(hash1, hash2, "SHA-256 hash must be deterministic for identical input");
    });
  });
});
