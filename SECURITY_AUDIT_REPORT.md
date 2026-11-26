# Security Audit Report — AI Habit Tracker

**Date:** 2026-11-26  
**Scope:** Full-stack MERN application (`ai-habit-tracker/client`, `ai-habit-tracker/server`, deployment & CI configuration)  
**Status:** Phase 3 Complete — Awaiting User Approval Before Remediation (Phase 4)

---

## 1. Executive Summary

A comprehensive production-level security audit was conducted across the AI Habit Tracker codebase, covering authentication, authorization, input validation, database queries, AI integrations, file uploads, real-time WebSockets, HTTP headers, rate limiting, dependency supply chain, and deployment configuration.

### Severity Breakdown (Confirmed Findings)

| Severity | Count | Key Highlights |
| :--- | :---: | :--- |
| **Critical** | 1 | Unverified JWT fallback (`jwt.decode`) in Firebase authentication (`firebaseAuth.service.js`) allowing complete authentication bypass / account takeover if Admin SDK & Identity Toolkit fail or are unconfigured |
| **High** | 9 | Dual token storage in `localStorage` (`api.js`), unescaped `$regex` NoSQL/ReDoS (`journalController.js`, `adminController.js`), mass assignment in `JournalTemplate` update (`journalController.js`), missing CSP (`securityHeaders.js`), in-memory-only rate limiter (`rateLimiter.js`), `X-Forwarded-For` spoofing (`rateLimiter.js`), unthrottled `/api/auth/refresh` (`authRoutes.js`), unbounded admin pagination (`adminController.js`), known high-severity `npm audit` dependencies |
| **Medium** | 8 | AI prompt injection via unsanitized template interpolation (`aiChatController.js`, `aiTimetableController.js`, `gamificationController.js`), unvalidated `imageUrl` in food logs (`calorieController.js`), unbounded pagination on XP/journal endpoints, production `err.message` leakage, unauthenticated/unvalidated `/api/visitors/track`, HTML injection in email templates (`email.service.js`), permissive `!origin` CORS fallback (`app.js`, `socket.js`), `focusController.js` missing numeric bounds |
| **Low** | 4 | Unvalidated `/api/habits/add-bulk` (`habitRoutes.js`), `refreshToken` echoed in JSON response body (`authController.js`), identical `sameSite` branches in cookie options (`authController.js`), dormant `child_process.spawn` import (`modelRetrainController.js`) |
| **Not Applicable** | 8 | Payment integrity, coupon abuse, SQL injection, SSTI, prototype pollution, database RLS (MongoDB app-level scoping), OAuth/SSO CSRF (token-based Firebase flow), WebSocket origin bypass beyond CORS |

---

## 2. Architecture & Trust Boundaries

- **Frontend:** React 19 + Vite (`ai-habit-tracker/client`), deployed on **Vercel** (`client/vercel.json`). Communicates with backend via Axios (`client/src/utils/api.js`) and Socket.IO client.
- **Backend:** Node.js + Express 5 (`ai-habit-tracker/server`), deployed on **Render**.
- **Database:** MongoDB + Mongoose 9. User isolation is enforced at the application query layer (`userId: req.user._id`).
- **Authentication:** Dual mechanism:
  1. Email/password with bcrypt (12 rounds), 15-minute JWT access tokens, and 30-day rotating SHA-256 hashed refresh tokens stored in `HttpOnly` cookies (plus `tokenVersion` revocation).
  2. Firebase Auth (Google / Phone) verified via `firebaseAuth.service.js`.
- **Caching & Rate Limiting:** Upstash Redis (REST) / `ioredis` (TCP) for response caching (`cache.middleware.js`); sliding-window rate limiter (`rateLimiter.js`) currently backed by an in-memory `Map`.
- **External Integrations:** Cloudinary (avatars via Multer memory storage), Brevo HTTP API (`email.service.js`), Groq / OpenAI / Google Generative AI.

**Trust Boundaries:**
1. **Untrusted Internet -> Express API / Socket.IO:** Protected by CORS allowlist, `securityHeaders`, `rateLimiter`, `authMiddleware`, and Zod `validate()` middleware.
2. **Express API -> MongoDB / Redis:** Application must sanitize all query filters, projection/update objects, and cache keys by `req.user._id`.
3. **Express API -> External AI / Email / Storage:** User-supplied text must be bounded and sanitized before entering LLM prompts or HTML email bodies.

---

## 3. Audit of All 30 Vulnerability Categories

### 1. Broken Access Control
- **Status:** Found (Low/Medium structural gaps; core user routes properly guarded)
- **Severity:** Medium
- **Affected Files:** `server/src/routes/visitorRoutes.js`, `server/src/controllers/datasetController.js`
- **Technical Explanation:** Admin routes correctly apply `authMiddleware` + `isAdmin`. However, `POST /api/visitors/track` is completely unauthenticated and unvalidated, allowing arbitrary writes to the visitor collection. Additionally, `datasetController.js` (admin-only) queries `Habit.find()` and `HabitLog.find()` across all users and returns an unbounded CSV in JSON.
- **Evidence:** `datasetController.js` lines 7-8; `visitorController.js` lines 1-59.
- **Impact:** Log/database spam via `/api/visitors/track`; potential memory exhaustion on admin dataset export.
- **Recommended Fix:** Add Zod validation and strict rate limiting to `/api/visitors/track`; stream or paginate `datasetController` exports.

### 2. IDOR / BOLA (Insecure Direct Object Reference)
- **Status:** Verified Safe on Audited Core Endpoints (with 1 template mass-assignment caveat)
- **Severity:** Informational
- **Affected Files:** `workoutLogController.js` (lines 202-211), `scheduleController.js` (lines 621-625, 702), `habitController.js`, `journalController.js`
- **Technical Explanation:** `getTimetableOr404`, `ScheduleEvent.findOneAndUpdate`, `ScheduleEvent.findOneAndDelete`, and habit/journal queries consistently scope by `userId: req.user._id`.
- **Recommended Fix:** Add automated IDOR regression tests in `server/tests/` to prevent future regressions.

### 3. Exposed API Keys
- **Status:** Not Found in Tracked Source
- **Severity:** Informational
- **Technical Explanation:** Secrets are read from `process.env`. `ai-habit-tracker/.gitignore` excludes `.env`, `.env.*`, `client/.env`, and `server/.env`. Note: the repository root `.gitignore` only lists `node_modules` and `.vscode/.logo-cache/`, though `git ls-files` confirmed no `.env` files are currently tracked.
- **Recommended Fix:** Add `.env` and `.env.*` patterns to the root `.gitignore` as defense-in-depth.

### 4. Price and Data Manipulation
- **Status:** Found (Client-controlled `durationMin` & `imageUrl`)
- **Severity:** Medium
- **Affected Files:** `server/src/controllers/focusController.js` (lines 11-17), `server/src/controllers/calorieController.js` (lines 15, 39)
- **Technical Explanation:** `logFocus` accepts arbitrary `durationMin` values with no upper bound (and allows `<= 0` when `status !== "completed"`), enabling inflated productivity stats/XP farming. `calorieController` stores client-supplied `imageUrl` without URL scheme/host validation.
- **Impact:** Gamification/analytics manipulation; potential stored XSS or SSRF if `imageUrl` is rendered/fetched.
- **Recommended Fix:** Enforce Zod bounds (`durationMin` 1–480) in `focusController`; validate `imageUrl` as `https://` URL (preferring Cloudinary/allowed hosts).

### 5. Negative Quantity / Invalid Numeric Input Exploits
- **Status:** Found
- **Severity:** Medium
- **Affected Files:** `server/src/controllers/focusController.js` (lines 15, 87), `server/src/controllers/adminController.js` (line 77), `server/src/controllers/gamificationController.js` (lines 300-301), `server/src/controllers/journalController.js` (lines 329-333)
- **Technical Explanation:** `limit` and `days` query parameters are parsed with `Number()` / `parseInt()` without upper bounds or positive-integer enforcement (`?limit=99999999` or negative values).
- **Impact:** Memory exhaustion / DoS on MongoDB queries.
- **Recommended Fix:** Clamp pagination `limit` with `Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100)` across all paginated endpoints.

### 6. Fake Payment / Transaction Integrity
- **Status:** Not Applicable
- **Technical Explanation:** The application has no payment gateway, checkout, or financial transaction flows.

### 7. Coupon and Reward Abuse
- **Status:** Not Applicable
- **Technical Explanation:** Gamification rewards in `gamification.service.js` perform server-side balance checks and atomic coin deductions; no coupon/promo code system exists.

### 8. Privilege Escalation
- **Status:** Mitigated on Signup; Potential Risk in `JournalTemplate`
- **Severity:** High (via Mass Assignment — see #29)
- **Affected Files:** `server/src/validators/auth.validator.js` (line 21), `server/src/controllers/authController.js` (lines 81-82), `server/src/controllers/journalController.js` (line 426)
- **Technical Explanation:** `signupSchema` permits `role: z.enum(["user", "admin"]).optional()`, though `authController.signup` safely ignores it and hardcodes `assignedRole = "user"` and `isAdmin = false`. However, `journalController.js` passes raw `req.body` into `$set`, allowing a user to overwrite `isSystem` or `userId` on a `JournalTemplate`.
- **Recommended Fix:** Remove `role` from `signupSchema` and enforce an explicit field allowlist in `journalController.js`.

### 9. Authentication and OTP Bypass
- **Status:** Found (**CRITICAL**)
- **Severity:** Critical
- **Affected File:** `server/src/services/firebaseAuth.service.js` (lines 104-116)
- **Technical Explanation:** `verifyFirebaseIdToken()` attempts Firebase Admin SDK verification, then Google Identity Toolkit lookup, and if both fail or are unconfigured, falls back to `jwt.decode(idToken)` — which performs **zero cryptographic signature verification**.
- **Evidence:**
  ```js
  // 3. Fallback JWT decode (handles token parsing when service account isn't loaded yet)
  const decoded = jwt.decode(idToken);
  if (decoded && (decoded.sub || decoded.user_id)) { ... }
  ```
- **Impact:** An attacker can craft an unsigned/forged JWT with any victim's `email` or `uid` and bypass authentication completely whenever Admin SDK verification throws or is uninitialized.
- **Recommended Fix:** Remove the `jwt.decode()` fallback immediately. Fail closed (`throw new Error(...)`) if neither Firebase Admin SDK nor Identity Toolkit verifies the token.

### 10. AI Prompt Injection
- **Status:** Found
- **Severity:** Medium
- **Affected Files:** `server/src/controllers/aiTimetableController.js` (lines 67-117), `server/src/controllers/aiChatController.js` (lines 62-78), `server/src/controllers/gamificationController.js` (lines 132-149)
- **Technical Explanation:** User-controlled strings (`injuries`, `additionalNotes`, `focusAreas`, `habitTitles`, `message`) are interpolated directly into LLM prompt templates without length caps, delimiter isolation, or instruction-override filtering.
- **Impact:** Users can hijack model behavior, extract system prompts, or cause unexpected AI outputs.
- **Recommended Fix:** Enforce strict Zod max-lengths, strip control/role-delimiter tokens, and wrap user data in explicit XML/JSON data delimiters with system instructions to treat them as untrusted data.

### 11. Cross-Site Scripting (XSS)
- **Status:** Found (Amplified by Missing CSP & `localStorage` Tokens; Email HTML Injection)
- **Severity:** High
- **Affected Files:** `server/src/middleware/securityHeaders.js` (missing CSP), `client/src/utils/api.js` (lines 10, 81-94), `server/src/services/email.service.js` (lines 42-44, 86-150)
- **Technical Explanation:** No `Content-Security-Policy` header is sent by the backend. Meanwhile, `email.service.js` interpolates `user.name`, `incompleteHabits` titles, and `habitTitle` directly into HTML email templates without HTML-entity escaping.
- **Impact:** Any client-side XSS can steal tokens from `localStorage`; malicious habit titles or user names can inject arbitrary HTML/phishing links into outgoing emails.
- **Recommended Fix:** Add a strict `Content-Security-Policy` header in `securityHeaders.js`, remove `localStorage` token storage, and HTML-escape all template variables in `email.service.js`.

### 12. Malicious File Upload
- **Status:** Mitigated (Magic-Byte & Memory Storage Present)
- **Severity:** Informational
- **Affected Files:** `server/src/middleware/upload.middleware.js`, `server/src/routes/profileRoutes.js`
- **Technical Explanation:** Uses Multer memory storage with MIME + magic-byte validation and uploads to Cloudinary.
- **Recommended Fix:** Add automated regression tests for invalid magic bytes / oversized payloads.

### 13. Environment Variable Exposure
- **Status:** Mitigated (with Root `.gitignore` Gap)
- **Severity:** Low
- **Affected Files:** `.gitignore`, `ai-habit-tracker/.gitignore`
- **Technical Explanation:** `.env` files are ignored in `ai-habit-tracker/.gitignore` and not tracked in Git. Root `.gitignore` lacks `.env` rules.
- **Recommended Fix:** Mirror `.env*` ignore rules in root `.gitignore` and sanitize `err.message` in production 500 responses so env/connection details never leak.

### 14. SQL / NoSQL Injection
- **Status:** Found (Unescaped `$regex` Queries)
- **Severity:** High
- **Affected Files:** `server/src/controllers/journalController.js` (lines 320-326), `server/src/controllers/adminController.js` (lines 85-88)
- **Technical Explanation:** `req.query.search` is passed directly into `{ $regex: search, $options: "i" }` without escaping regex metacharacters.
- **Evidence:**
  ```js
  filter.$or = [{ title: { $regex: search, $options: "i" } }, ...];
  ```
- **Impact:** ReDoS / CPU exhaustion on MongoDB and regex-based query manipulation.
- **Recommended Fix:** Escape regex special characters (`search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")`) and cap search string length (e.g., max 100 chars).

### 15. JWT Vulnerabilities
- **Status:** Found (Client-Side Storage + Unverified Firebase Fallback)
- **Severity:** High (Critical for Firebase fallback — see #9)
- **Affected Files:** `client/src/utils/api.js` (lines 10, 81-94), `server/src/controllers/authController.js` (lines 245, 316, 574)
- **Technical Explanation:** Backend sets `HttpOnly` cookies for access/refresh tokens with `tokenVersion` revocation, which is strong. However, it also returns tokens in JSON response bodies, and `client/src/utils/api.js` stores/reads `token` and `refreshToken` in `localStorage`.
- **Impact:** Defeats `HttpOnly` cookie XSS protection.
- **Recommended Fix:** Stop returning `refreshToken` in JSON bodies and migrate `api.js` to rely solely on `withCredentials: true` `HttpOnly` cookies.

### 16. Rate Limit Bypass and Denial of Service
- **Status:** Found
- **Severity:** High
- **Affected Files:** `server/src/middleware/rateLimiter.js` (lines 9, 42), `server/src/routes/authRoutes.js` (line 32)
- **Technical Explanation:**
  1. `memoryBuckets = new Map()` is in-memory only — bypassed across multiple Render instances.
  2. `req.headers["x-forwarded-for"]?.split(",")[0]?.trim()` trusts the leftmost client-supplied IP, allowing trivial rate-limit bypass via header spoofing.
  3. `POST /api/auth/refresh` in `authRoutes.js` has no `authLimiter` applied.
- **Impact:** Unlimited brute-force / token-refresh grinding and IP spoofing bypass.
- **Recommended Fix:** Configure Express `trust proxy` properly (`req.ip` or rightmost proxy-appended IP), back rate limiting with Redis, and apply `authLimiter` to `/api/auth/refresh`.

### 17. Database Access Control / RLS
- **Status:** Not Applicable (MongoDB Application-Layer Scoping)
- **Technical Explanation:** MongoDB does not use SQL RLS; tenant isolation is handled at the Mongoose query layer (`userId`).

### 18. Predictable Security Tokens
- **Status:** Verified Safe
- **Technical Explanation:** `authController.js` uses `crypto.randomBytes(32)` / `crypto.randomBytes(40)` and stores SHA-256 hashes in MongoDB for verification, password reset, and refresh tokens.

### 19. Cross-Site Request Forgery (CSRF)
- **Status:** Medium Risk (Due to Cookie Auth + `sameSite: "lax"` / `!origin` Bypass)
- **Severity:** Medium
- **Affected Files:** `server/src/controllers/authController.js` (line 25), `server/src/app.js` (line 79)
- **Technical Explanation:** Cookie-based auth uses `sameSite: "lax"` in both dev and prod. Combined with `!origin` allowed in CORS, state-changing endpoints using cookies could be targeted if cross-site credentials are sent or non-browser requests lack origin checks.
- **Recommended Fix:** Enforce `sameSite: "strict"` (or `"none"` with CSRF double-submit / custom header check if cross-origin Vercel->Render requires it) and require custom header (`X-Requested-With`) or CSRF token for cookie-authenticated mutations.

### 20. CORS Misconfiguration
- **Status:** Found
- **Severity:** Medium
- **Affected Files:** `server/src/app.js` (line 79), `server/src/socket/socket.js` (line 25)
- **Technical Explanation:** `if (!origin) return callback(null, true)` unconditionally permits all requests without an `Origin` header.
- **Recommended Fix:** Restrict `!origin` bypass in production or pair cookie-authenticated endpoints with CSRF token verification.

### 21. Server-Side Request Forgery (SSRF)
- **Status:** Found (Latent Risk via Unvalidated `imageUrl`)
- **Severity:** Medium
- **Affected Files:** `server/src/controllers/calorieController.js` (lines 15, 39)
- **Technical Explanation:** Arbitrary `imageUrl` strings from `req.body` are persisted without URL/protocol/hostname validation.
- **Recommended Fix:** Validate `imageUrl` with `new URL()` (HTTPS only, block private/loopback IPs or restrict to Cloudinary domain).

### 22. Insecure Session Management
- **Status:** Found
- **Severity:** High
- **Affected Files:** `client/src/utils/api.js` (lines 10, 81-94), `server/src/controllers/authController.js` (lines 245, 316, 574)
- **Technical Explanation:** Storing `token` and `refreshToken` in `localStorage` exposes long-lived sessions to any JavaScript execution on the origin.
- **Recommended Fix:** Rely exclusively on `HttpOnly`, `Secure`, `SameSite` cookies.

### 23. OAuth / SSO Vulnerabilities
- **Status:** Found (**CRITICAL** — See #9)
- **Severity:** Critical
- **Affected File:** `server/src/services/firebaseAuth.service.js` (lines 104-116)
- **Technical Explanation:** Unverified `jwt.decode()` fallback in `verifyFirebaseIdToken`.

### 24. Prototype Pollution
- **Status:** Not Applicable / Not Found
- **Technical Explanation:** No unsafe recursive object merges (`lodash.merge`, `Object.assign` on raw nested user objects) were found; Mongoose schemas and Zod strip/validate structured payloads.

### 25. Regular Expression Denial of Service (ReDoS)
- **Status:** Found (Linked to #14)
- **Severity:** High
- **Affected Files:** `server/src/controllers/journalController.js` (lines 320-326), `server/src/controllers/adminController.js` (lines 85-88)
- **Technical Explanation:** Unescaped user input in MongoDB `$regex` allows catastrophic backtracking patterns such as `(a+)+$`.
- **Recommended Fix:** Escape regex metacharacters and cap query length.

### 26. WebSocket Hijacking
- **Status:** Partially Mitigated (JWT Auth Present; `!origin` Allowed in CORS)
- **Severity:** Low
- **Affected Files:** `server/src/socket/socket.js` (line 25), `server/src/socket/socketHandlers.js`
- **Technical Explanation:** Socket.IO verifies JWTs on connection and enforces per-socket rate limiting, but inherits the permissive `!origin` CORS callback.
- **Recommended Fix:** Enforce explicit `Origin` validation on Socket.IO handshake in production.

### 27. Server-Side Template Injection (SSTI)
- **Status:** Not Applicable
- **Technical Explanation:** No server-side template engine (EJS, Pug, Handlebars) is used; `email.service.js` performs simple `{{KEY}}` string replacement (HTML injection risk covered under #11).

### 28. Dependency Vulnerabilities
- **Status:** Found
- **Severity:** High
- **Affected Files:** `ai-habit-tracker/server/package.json`, `ai-habit-tracker/client/package.json`
- **Evidence:** `npm audit` reported **2 moderate, 3 high** vulnerabilities on the server and **4 moderate, 7 high** vulnerabilities on the client.
- **Recommended Fix:** Run `npm audit fix` (and review breaking updates) across both workspaces, then re-run full test and build suites.

### 29. Mass Assignment
- **Status:** Found
- **Severity:** High
- **Affected File:** `server/src/controllers/journalController.js` (line 426)
- **Evidence:**
  ```js
  findOneAndUpdate({ _id: id, userId }, { $set: req.body }, ...)
  ```
- **Impact:** Attackers can set protected fields such as `isSystem: true` or `userId` on `JournalTemplate` documents.
- **Recommended Fix:** Destructure and allowlist only permitted fields (`name`, `description`, `category`, `icon`, `fields`, `prompts`).

### 30. Security Misconfiguration
- **Status:** Found
- **Severity:** High
- **Affected Files:** `server/src/middleware/securityHeaders.js`, `server/src/controllers/timetableController.js` (line 576), `server/src/controllers/challengeController.js` (line 560), `server/src/controllers/focusController.js` (lines 40, 79), `server/src/controllers/modelRetrainController.js` (line 1)
- **Technical Explanation:**
  1. Missing `Content-Security-Policy` header in `securityHeaders.js`.
  2. Multiple controllers return raw `err.message` in HTTP 500 responses in production.
  3. Unused `import { spawn } from "child_process"` remains in `modelRetrainController.js`.
- **Recommended Fix:** Add CSP header, mask 500 error details when `NODE_ENV === "production"`, and remove the unused `spawn` import.
