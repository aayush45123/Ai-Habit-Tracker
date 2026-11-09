import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { signupSchema, loginSchema } from "../../src/validators/auth.validator.js";
import authMiddleware from "../../src/middleware/authMiddleware.js";
import validate from "../../src/middleware/validate.middleware.js";

describe("Authentication & Security In-Process Tests (/api/auth)", () => {
  it("Zod signupSchema rejects invalid payloads with descriptive errors", () => {
    const invalidPayload = {
      name: "A", // too short (<3)
      email: "invalid-email-address",
      password: "123", // too short (<8) and missing upper/lower/number/special
    };

    const result = signupSchema.safeParse(invalidPayload);
    assert.strictEqual(result.success, false, "Should fail validation");
    assert.ok(result.error.issues.length >= 3, "Should catch name, email, and password issues");

    const fieldsWithErrors = result.error.issues.map((i) => i.path[0]);
    assert.ok(fieldsWithErrors.includes("name"), "Should flag name");
    assert.ok(fieldsWithErrors.includes("email"), "Should flag email");
    assert.ok(fieldsWithErrors.includes("password"), "Should flag password");
  });

  it("Zod signupSchema accepts valid registration payloads", () => {
    const validPayload = {
      name: "Aayush Sharma",
      email: "aayush@example.com",
      password: "StrongPassword123!",
    };

    const result = signupSchema.safeParse(validPayload);
    assert.strictEqual(result.success, true, "Valid payload must pass validation");
    assert.strictEqual(result.data.email, "aayush@example.com");
  });

  it("Zod loginSchema rejects empty email or password", () => {
    const emptyPayload = { email: "", password: "" };
    const result = loginSchema.safeParse(emptyPayload);
    assert.strictEqual(result.success, false);
  });

  it("validate middleware returns HTTP 400 on schema violation", () => {
    const middleware = validate(signupSchema);
    const req = { body: { name: "X", email: "bad", password: "1" } };
    let capturedStatus = null;
    let capturedBody = null;

    const res = {
      status: (code) => {
        capturedStatus = code;
        return {
          json: (data) => {
            capturedBody = data;
          },
        };
      },
    };

    let nextCalled = false;
    middleware(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, false, "Next must not be called on validation failure");
    assert.strictEqual(capturedStatus, 400);
    assert.strictEqual(capturedBody.message, "Validation failed");
    assert.ok(Array.isArray(capturedBody.errors), "Errors must be an array");
  });

  it("authMiddleware blocks requests without token with 401 Unauthorized", async () => {
    const req = { headers: {} };
    let capturedStatus = null;
    let capturedBody = null;

    const res = {
      status: (code) => {
        capturedStatus = code;
        return {
          json: (data) => {
            capturedBody = data;
          },
        };
      },
    };

    let nextCalled = false;
    await authMiddleware(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(capturedStatus, 401);
    assert.strictEqual(capturedBody.message, "No token, authorization denied");
  });

  it("authMiddleware rejects invalid or malformed tokens with 401", async () => {
    const req = { headers: { authorization: "Bearer invalid.malformed.token" } };
    let capturedStatus = null;
    let capturedBody = null;

    const res = {
      status: (code) => {
        capturedStatus = code;
        return {
          json: (data) => {
            capturedBody = data;
          },
        };
      },
    };

    let nextCalled = false;
    await authMiddleware(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(capturedStatus, 401);
    assert.strictEqual(capturedBody.message, "Invalid token");
  });
});
