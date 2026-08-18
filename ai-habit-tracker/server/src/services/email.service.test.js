import test from "node:test";
import assert from "node:assert/strict";

import { validateBrevoConfig } from "./email.service.js";

test("rejects Gmail-based SMTP login as invalid for Brevo", () => {
  const result = validateBrevoConfig({
    login: "user@gmail.com",
    key: "xsmtpsib-1234567890",
  });

  assert.equal(result.isValid, false);
  assert.match(result.reason, /gmail.com|use your Brevo/i);
});

test("accepts a valid Brevo SMTP key shape", () => {
  const result = validateBrevoConfig({
    login: "user@yourdomain.com",
    key: "xsmtpsib-1234567890",
  });

  assert.equal(result.isValid, true);
  assert.equal(result.reason, "valid");
});
